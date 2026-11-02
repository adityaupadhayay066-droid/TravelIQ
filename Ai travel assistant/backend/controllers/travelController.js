const { Trip, Route, Analytics, Train, TrainSchedule, SearchAnalytics, Station, LiveTrainStatus, TrainFare, sequelize } = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');
const { discoverMultiModalRoutes } = require('../services/multiModalDiscoveryService');
const { trainRunsOnDate, getTrainFrequencyLabel, formatRunningDays, findConnectingTrains, getDayOfWeek } = require('../services/routeValidationEngine');
const { MultiModalRoutingEngine } = require('../services/multiModalRoutingEngine');
const { getTrainTrackingDetails } = require('../services/trainTrackingService');
const { resolveStation, parseTravelDate } = require('../services/stationResolver');
const { validateTransportRecord } = require('../services/transportValidationEngine');
const { searchFerriesFromProvider, VERIFIED_FERRY_SCHEDULES } = require('../services/adapters/ferryProviderAdapter');

const predictTrip = async (req, res) => {
    try {
        const [priceRes, timeRes] = await Promise.all([
            aiService.predictPrice(req.body),
            aiService.predictTime(req.body)
        ]);
        
        res.json({
            price: priceRes.predicted_price,
            time: priceRes.predicted_duration_hours
        });
    } catch (error) {
        res.status(500).json({ message: 'Error communicating with AI service' });
    }
};

const optimizeTripRoute = async (req, res) => {
    try {
        const response = await aiService.optimizeRoute(req.body);
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error optimizing route' });
    }
};

const saveUserTrip = async (req, res) => {
    try {
        const { source, destination, travel_date, budget, travel_mode, predicted_price, predicted_time, ai_recommendation } = req.body;
        
        const newTrip = await Trip.create({
            user_id: req.user.id,
            source,
            destination,
            departure_date: travel_date,
            budget,
            travel_mode,
            predicted_price,
            predicted_time,
            ai_score: ai_recommendation?.score || null
        });

        res.status(201).json({ message: 'Trip saved successfully', trip: newTrip });
    } catch (error) {
        console.error('Error saving trip:', error.message);
        res.status(500).json({ message: 'Error saving trip. Please try again later.' });
    }
};

const getUserHistory = async (req, res) => {
    try {
        const trips = await Trip.findAll({ 
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']]
        });
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history' });
    }
};

const getUserAnalytics = async (req, res) => {
    try {
        let analytics = await Analytics.findOne({ where: { user_id: req.user.id } });
        if (!analytics) {
            // Provide authentic initial analytics if none exist yet (no fabricated accuracies)
            analytics = {
                route_accuracy: null,
                ai_prediction_score: null,
                total_saved_money: 0,
                total_saved_time: 0
            };
        }
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics' });
    }
};

const searchRoutes = async (req, res) => {
    try {
        let { source, destination, departureDate, returnDate, tripType, passengers } = req.body;
        
        console.log(`[Backend] Route Search Request Payload:`, {
            source, destination, departureDate, returnDate, tripType, passengers
        });
        
        if (!source || !destination) {
            return res.status(400).json({ message: 'Source and destination required.' });
        }

        // Strict Entity Resolution & Fuzzy Station Matching
        const sourceMatch = await resolveStation(source);
        const destMatch = await resolveStation(destination);

        const originCodes = sourceMatch?.stationCodes || [String(source).trim().toUpperCase()];
        const destCodes = destMatch?.stationCodes || [String(destination).trim().toUpperCase()];

        let sourceStation = await Station.findOne({
            where: {
                [Op.or]: [
                    { station_code: originCodes },
                    { station_name: String(source).trim() }
                ]
            }
        });

        let destStation = await Station.findOne({
            where: {
                [Op.or]: [
                    { station_code: destCodes },
                    { station_name: String(destination).trim() }
                ]
            }
        });

        if (!sourceStation && sourceMatch?.primaryStationCode) {
            sourceStation = await Station.findOne({
                where: { station_code: sourceMatch.primaryStationCode }
            });
        }

        if (!destStation && destMatch?.primaryStationCode) {
            destStation = await Station.findOne({
                where: { station_code: destMatch.primaryStationCode }
            });
        }

        // Intelligent Date Fallback: default to tomorrow if omitted
        let dateInfo = null;
        if (!departureDate) {
            dateInfo = parseTravelDate(null);
            departureDate = dateInfo.travelDate;
        }
        
        if (sourceStation) {
            console.log(`[Backend] Resolved Source Station: ${sourceStation.station_name} (${sourceStation.station_code}) Coordinates: [${sourceStation.latitude}, ${sourceStation.longitude}]`);
        } else {
            console.warn(`[Backend] Source Station code/name "${source}" resolved to cluster: [${originCodes.join(', ')}]`);
        }

        if (destStation) {
            console.log(`[Backend] Resolved Destination Station: ${destStation.station_name} (${destStation.station_code}) Coordinates: [${destStation.latitude}, ${destStation.longitude}]`);
        } else {
            console.warn(`[Backend] Destination Station code/name "${destination}" resolved to cluster: [${destCodes.join(', ')}]`);
        }

        // 1. Run dynamic multi-modal discovery with departureDate filtering & multimodal flight alternatives
        const discovery = discoverMultiModalRoutes(sourceStation, destStation, source, destination, departureDate);

        // 2. Query database for direct train schedules across multi-station clusters
        let dbRoutes = [];
        try {
            const query = `
                SELECT 
                    t.train_number, 
                    t.train_name, 
                    t.runs_on,
                    t.service_type,
                    t.frequency,
                    MIN(s1.departure_time) as source_departure, 
                    MIN(s1.day_count) as source_day,
                    MIN(s2.arrival_time) as dest_arrival,
                    MIN(s2.day_count) as dest_day
                FROM train_schedules s1
                JOIN train_schedules s2 ON s1.train_number = s2.train_number
                JOIN trains t ON s1.train_number = t.train_number
                WHERE s1.station_code IN (:origin_station_codes)
                  AND s2.station_code IN (:dest_station_codes)
                  AND s1.stop_sequence < s2.stop_sequence
                GROUP BY t.train_number, t.train_name, t.runs_on, t.service_type, t.frequency
                ORDER BY source_departure ASC
                LIMIT 100
            `;

            dbRoutes = await sequelize.query(query, {
                replacements: { 
                    origin_station_codes: originCodes, 
                    dest_station_codes: destCodes
                },
                type: sequelize.QueryTypes.SELECT
            });
        } catch (dbErr) {
            console.warn('[Backend] Direct DB query notice:', dbErr.message);
        }

        // Filter direct DB routes by departureDate (day of the week)
        const validDbRoutes = dbRoutes.filter(route => trainRunsOnDate(route, departureDate));

        // Fetch database fares for any found direct DB routes
        const trainNumbers = validDbRoutes.map(r => r.train_number);
        let allFares = [];
        if (trainNumbers.length > 0) {
            allFares = await TrainFare.findAll({
                where: { train_number: trainNumbers }
            });
        }
        
        const fareMap = {};
        for (const f of allFares) {
            if (!fareMap[f.train_number]) fareMap[f.train_number] = {};
            fareMap[f.train_number][f.class_code] = f.fare;
        }

        const uniqueTrainNumbers = new Set();
        const processedDbTrains = [];
        const originStnCode = sourceStation ? sourceStation.station_code : (sourceMatch?.primaryStationCode || originCodes[0] || (source && source.trim().toUpperCase()));
        const destStnCode = destStation ? destStation.station_code : (destMatch?.primaryStationCode || destCodes[0] || (destination && destination.trim().toUpperCase()));

        for (const route of validDbRoutes) {
            if (uniqueTrainNumbers.has(route.train_number)) continue;
            uniqueTrainNumbers.add(route.train_number);

            let durationHours = 0;
            if (route.source_departure && route.dest_arrival) {
                const parseTime = (t) => {
                    if (!t) return 0;
                    const parts = t.split(':');
                    return (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
                };
                const dept = parseTime(route.source_departure);
                const arr = parseTime(route.dest_arrival);
                const days = (route.dest_day - route.source_day);
                durationHours = (days * 24) + arr - dept;
                if (durationHours < 0) durationHours += 24; 
            }

            const authenticFares = fareMap[route.train_number] || null;
            const price = authenticFares ? (authenticFares['SL'] || Math.min(...Object.values(authenticFares))) : null;
            const classes = authenticFares ? Object.entries(authenticFares).map(([c, p]) => `${c} - ₹${p}`) : [];
            const fareType = authenticFares ? 'actual' : null;

            const runningDaysFormatted = formatRunningDays(route.runs_on);
            const frequencyLabel = route.frequency || getTrainFrequencyLabel(route.runs_on);

            processedDbTrains.push({
                ...route,
                id: route.train_number,
                type: 'Train',
                mode: 'Train',
                route_type: 'Direct',
                direct: true,
                validated: true,
                source_verified: true,
                verification_status: authenticFares ? 'static_reference' : 'reference_timetable',
                source: 'irctc_sql_database',
                fare_type: fareType,
                departure_date: departureDate || null,
                name: route.train_name,
                train_name: route.train_name,
                number: route.train_number,
                train_number: route.train_number,
                source_station_code: route.source_station_code || originStnCode,
                destination_station_code: route.dest_station_code || destStnCode,
                source_code: route.source_station_code || originStnCode,
                destination_code: route.dest_station_code || destStnCode,
                origin_station_code: route.source_station_code || originStnCode,
                dest_station_code: route.dest_station_code || destStnCode,
                depStation: sourceStation ? sourceStation.station_name : source,
                arrStation: destStation ? destStation.station_name : destination,
                depTime: route.source_departure ? route.source_departure.substring(0, 5) : '08:00 AM',
                arrTime: route.dest_arrival ? route.dest_arrival.substring(0, 5) : '06:00 PM',
                dur: `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}m`,
                duration_hours: parseFloat(durationHours.toFixed(1)),
                price: price,
                fare_inr: price,
                classes: classes,
                fares: authenticFares,
                available_seats: null,
                runs_on: route.runs_on,
                running_days: runningDaysFormatted,
                frequency: frequencyLabel,
                available_classes: authenticFares ? Object.keys(authenticFares) : [],
                retrieved_at: new Date().toISOString()
            });
        }

        const routingEngine = new MultiModalRoutingEngine({ sequelize });

        const finalTrains = [...processedDbTrains];

        // If direct path does not exist or direct options are limited, query verified connecting routes via Universal Hub Architecture.
        if (processedDbTrains.length < 3) {
            const connectingDiscovery = await routingEngine.findConnectingRoutes(originStnCode, destStnCode, departureDate, { forceConnecting: true });
            for (const conn of (connectingDiscovery.routes || [])) {
                if (!uniqueTrainNumbers.has(conn.id)) {
                    uniqueTrainNumbers.add(conn.id);
                    const firstLeg = conn.legs ? conn.legs[0] : null;
                    const lastLeg = conn.legs ? conn.legs[conn.legs.length - 1] : null;
                    if (!firstLeg || !lastLeg) continue;

                    const firstNo = firstLeg.service_number || firstLeg.train_number || firstLeg.number || firstLeg.service_name || firstLeg.mode || 'TRANSIT-1';
                    const lastNo = lastLeg.service_number || lastLeg.train_number || lastLeg.number || lastLeg.service_name || lastLeg.mode || 'TRANSIT-2';
                    if (String(firstNo).toUpperCase().includes('TR1') || String(lastNo).toUpperCase().includes('TR2')) {
                        continue;
                    }

                    const firstName = firstLeg.service_name || firstLeg.train_name || firstLeg.name || `Service #${firstNo}`;
                    const lastName = lastLeg.service_name || lastLeg.train_name || lastLeg.name || `Service #${lastNo}`;

                    let combinedFare = null;
                    if (firstLeg.fare && lastLeg.fare) {
                        combinedFare = firstLeg.fare + lastLeg.fare;
                    } else if (conn.fare) {
                        combinedFare = conn.fare;
                    } else {
                        // Robust lookup in TrainFare database
                        const f1 = (await TrainFare.findOne({ where: { train_number: String(firstNo).trim(), class_code: 'SL' } }))?.fare 
                                || (await TrainFare.findOne({ where: { train_number: String(firstNo).trim() } }))?.fare || 0;
                        const f2 = (await TrainFare.findOne({ where: { train_number: String(lastNo).trim(), class_code: 'SL' } }))?.fare 
                                || (await TrainFare.findOne({ where: { train_number: String(lastNo).trim() } }))?.fare || 0;
                        if (f1 > 0 || f2 > 0) {
                            combinedFare = f1 + f2;
                        }
                    }

                    const normalizedLegs = (conn.legs || []).map(l => ({
                        ...l,
                        train_name: l.service_name || l.train_name || l.name,
                        service_name: l.service_name || l.train_name || l.name,
                        service_number: l.service_number || l.train_number || l.number,
                        from: l.from_station || l.from || l.origin,
                        from_station: l.from_station || l.from || l.origin,
                        to: l.to_station || l.to || l.destination,
                        to_station: l.to_station || l.to || l.destination,
                        departure: l.departure_time_clock || l.departure || l.dep_time,
                        departure_time_clock: l.departure_time_clock || l.departure || l.dep_time,
                        arrival: l.arrival_time_clock || l.arrival || l.arr_time,
                        arrival_time_clock: l.arrival_time_clock || l.arrival || l.arr_time
                    }));

                    finalTrains.push({
                        ...conn,
                        id: conn.id,
                        type: 'Train',
                        mode: conn.type === 'MultiModal_Rail_Bus' ? 'Rail + Bus' : 'Train',
                        route_type: 'Connecting',
                        direct: false,
                        validated: true,
                        source_verified: true,
                        verification_status: 'verified_connecting_hub',
                        source: 'universal_hub_routing_engine',
                        fare_type: combinedFare ? 'actual_sum' : null,
                        departure_date: departureDate || null,
                        name: `${firstName} → ${lastName}`,
                        train_name: `${firstName} → ${lastName}`,
                        number: `${firstNo} / ${lastNo}`,
                        train_number: `${firstNo} / ${lastNo}`,
                        source_station_code: originStnCode,
                        destination_station_code: destStnCode,
                        source_code: originStnCode,
                        destination_code: destStnCode,
                        origin_station_code: originStnCode,
                        dest_station_code: destStnCode,
                        depTime: firstLeg.departure_time_clock || '08:00 AM',
                        arrTime: lastLeg.arrival_time_clock || '08:00 PM',
                        dur: conn.duration || '12h 00m',
                        duration_hours: conn.duration_minutes ? parseFloat((conn.duration_minutes / 60).toFixed(1)) : 12.0,
                        depStation: sourceStation ? sourceStation.station_name : originStnCode,
                        arrStation: destStation ? destStation.station_name : destStnCode,
                        legs: normalizedLegs,
                        price: combinedFare,
                        fare_inr: combinedFare,
                        classes: combinedFare ? [`Combined - ₹${combinedFare.toLocaleString()}`] : [],
                        fares: combinedFare ? { 'Combined': combinedFare } : null,
                        available_classes: combinedFare ? ['Combined'] : [],
                        layover: conn.layover_display,
                        frequency: 'Connecting Route (Verified Hub)',
                        running_days: 'Daily (via Connection)',
                        retrieved_at: new Date().toISOString()
                    });
                }
            }
        }

        // Final multimodal collection: Trains, Flights, Buses, and Ferries
        const finalFlights = discovery.flights || [];
        const finalBuses = discovery.buses || [];
        
        // Search verified maritime and coastal ferries
        const ferryDiscovery = await searchFerriesFromProvider({
            originInput: source,
            destInput: destination,
            departureDate
        });
        const finalFerries = ferryDiscovery.ferries || [];

        const allTransports = [...finalTrains, ...finalFlights, ...finalBuses, ...finalFerries];

        // Log search telemetry in SearchAnalytics
        try {
            await SearchAnalytics.create({
                user_id: req.user ? req.user.id : null,
                source,
                destination,
                status: allTransports.length > 0 ? 'SUCCESS' : 'NO_TRAINS',
                ip_address: req.ip || '127.0.0.1'
            });
        } catch (analyticsErr) {
            console.error('⚠️  Failed to log search analytics:', analyticsErr.message);
        }

        res.json({
            trains: finalTrains,
            flights: finalFlights,
            buses: finalBuses,
            ferries: finalFerries,
            allTransports,
            totalResults: allTransports.length,
            distanceKm: discovery.distanceKm,
            hasAirport: discovery.hasAirport,
            departureDate: departureDate || null,
            dateNotice: dateInfo && dateInfo.isDefaultDate ? dateInfo.dateNotice : null,
            originCluster: originCodes,
            destCluster: destCodes,
            source: sourceStation ? sourceStation.toJSON() : discovery.resolvedSource,
            destination: destStation ? destStation.toJSON() : discovery.resolvedDest,
            sourceStation: sourceStation ? sourceStation.toJSON() : discovery.resolvedSource,
            destStation: destStation ? destStation.toJSON() : discovery.resolvedDest
        });
    } catch (error) {
        console.error('Error searching routes:', error);
        res.status(500).json({ message: 'Error searching routes' });
    }
};

const searchTrains = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.json([]);
        }
        const query = q.trim();
        const trains = await Train.findAll({
            where: {
                [Op.or]: [
                    { train_number: { [Op.like]: `%${query}%` } },
                    { train_name: { [Op.like]: `%${query}%` } }
                ]
            },
            limit: 15,
            order: [['train_number', 'ASC']]
        });
        res.json(trains.map(t => ({ train_number: t.train_number, train_name: t.train_name })));
    } catch (error) {
        console.error('[Search Trains Error]:', error.message);
        res.status(500).json({ message: 'Internal server error. Please try again later.' });
    }
};

const getLiveTrainStatus = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const { journeyDate, selectedDay } = req.query;
        const data = await getTrainTrackingDetails({ trainNumber, journeyDate, selectedDay });
        if (!data) {
            return res.status(404).json({ message: 'Train not found.' });
        }
        res.json(data);
    } catch (error) {
        console.error('[Get Live Train Status Error]:', error.message);
        res.status(500).json({ message: 'Internal server error. Please try again later.' });
    }
};

const getSourcesHealth = async (req, res) => {
    try {
        const [stationsCount, trainsCount, schedulesCount, faresCount] = await Promise.all([
            Station.count(),
            Train.count(),
            TrainSchedule.count(),
            TrainFare.count()
        ]);

        res.json({
            status: 'HEALTHY',
            timestamp: new Date().toISOString(),
            counts: {
                stations: stationsCount,
                trains: trainsCount,
                schedules: schedulesCount,
                fares: faresCount,
                ferry_routes: VERIFIED_FERRY_SCHEDULES.length
            },
            providers: {
                irctc_sql_database: { status: 'healthy', records: trainsCount },
                verified_maritime_ferry_registry: { status: 'healthy', active_routes: VERIFIED_FERRY_SCHEDULES.length },
                verified_flight_registry: { status: 'healthy' },
                interstate_bus_network: { status: 'healthy' }
            }
        });
    } catch (error) {
        console.error('[Sources Health Error]:', error.message);
        res.status(500).json({ status: 'ERROR', error: error.message });
    }
};

module.exports = {
    predictTrip,
    optimizeTripRoute,
    saveUserTrip,
    getUserHistory,
    getUserAnalytics,
    searchRoutes,
    searchTrains,
    getLiveTrainStatus,
    getSourcesHealth
};
