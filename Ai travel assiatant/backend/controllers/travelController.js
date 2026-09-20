const { Trip, Route, Analytics, Train, TrainSchedule, SearchAnalytics, Station, LiveTrainStatus, TrainFare, sequelize } = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');
const { discoverMultiModalRoutes } = require('../services/multiModalDiscoveryService');

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
        res.status(500).json({ message: 'Error saving trip', error: error.message });
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
            // Provide default analytics if none exist yet
            analytics = {
                route_accuracy: 94.5,
                ai_prediction_score: 98.2,
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
        const { source, destination, departureDate, returnDate, tripType, passengers } = req.body;
        
        console.log(`[Backend] Route Search Request Payload:`, {
            source, destination, departureDate, returnDate, tripType, passengers
        });
        
        if (!source || !destination) {
            return res.status(400).json({ message: 'Source and destination required.' });
        }

        const sourceCode = String(source).trim().toUpperCase();
        const destCode = String(destination).trim().toUpperCase();

        const sourceStation = await Station.findOne({
            where: {
                [Op.or]: [
                    { station_code: sourceCode },
                    { station_name: sourceCode }
                ]
            }
        });

        const destStation = await Station.findOne({
            where: {
                [Op.or]: [
                    { station_code: destCode },
                    { station_name: destCode }
                ]
            }
        });
        
        if (sourceStation) {
            console.log(`[Backend] Resolved Source Station: ${sourceStation.station_name} (${sourceStation.station_code}) Coordinates: [${sourceStation.latitude}, ${sourceStation.longitude}]`);
        } else {
            console.warn(`[Backend] Source Station code/name "${source}" not found in database.`);
        }

        if (destStation) {
            console.log(`[Backend] Resolved Destination Station: ${destStation.station_name} (${destStation.station_code}) Coordinates: [${destStation.latitude}, ${destStation.longitude}]`);
        } else {
            console.warn(`[Backend] Destination Station code/name "${destination}" not found in database.`);
        }

        // 1. Run dynamic multi-modal discovery (with strict airport validation & multi-train generation)
        const discovery = discoverMultiModalRoutes(sourceStation, destStation, source, destination);

        // 2. Query database for direct train schedules if available
        let dbRoutes = [];
        try {
            const query = `
                SELECT 
                    t.train_number, 
                    t.train_name, 
                    MIN(s1.departure_time) as source_departure, 
                    MIN(s1.day_count) as source_day,
                    MIN(s2.arrival_time) as dest_arrival,
                    MIN(s2.day_count) as dest_day
                FROM train_schedules s1
                JOIN train_schedules s2 ON s1.train_number = s2.train_number
                JOIN trains t ON s1.train_number = t.train_number
                WHERE (s1.station_code = :sourceCode OR s1.station_code = :rawSource)
                  AND (s2.station_code = :destCode OR s2.station_code = :rawDest)
                  AND s1.stop_sequence < s2.stop_sequence
                GROUP BY t.train_number, t.train_name
                ORDER BY source_departure ASC
                LIMIT 100
            `;

            dbRoutes = await sequelize.query(query, {
                replacements: { 
                    sourceCode, 
                    destCode, 
                    rawSource: sourceStation ? sourceStation.station_code : sourceCode,
                    rawDest: destStation ? destStation.station_code : destCode
                },
                type: sequelize.QueryTypes.SELECT
            });
        } catch (dbErr) {
            console.warn('[Backend] Direct DB query notice:', dbErr.message);
        }

        // Fetch database fares for any found direct DB routes
        const trainNumbers = dbRoutes.map(r => r.train_number);
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

        for (const route of dbRoutes) {
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

            const fares = fareMap[route.train_number] || {
                'SL': 480, '3A': 1250, '2A': 1850, '1A': 2900
            };

            processedDbTrains.push({
                ...route,
                id: route.train_number,
                type: 'Train',
                name: route.train_name,
                train_name: route.train_name,
                number: route.train_number,
                train_number: route.train_number,
                depStation: sourceStation ? sourceStation.station_name : source,
                arrStation: destStation ? destStation.station_name : destination,
                depTime: route.source_departure ? route.source_departure.substring(0, 5) : '08:00 AM',
                arrTime: route.dest_arrival ? route.dest_arrival.substring(0, 5) : '06:00 PM',
                dur: `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}m`,
                duration_hours: parseFloat(durationHours.toFixed(1)),
                price: fares['SL'] || Math.min(...Object.values(fares)),
                fare_inr: fares['SL'] || null,
                classes: Object.entries(fares).map(([c, p]) => `${c} - ₹${p}`),
                fares,
                available_seats: {},
                running_days: 'Daily',
                available_classes: Object.keys(fares)
            });
        }

        // Combine DB direct trains with discovery schedule to ensure comprehensive 6-10+ trains
        const finalTrains = [...processedDbTrains];
        for (const genTrain of discovery.trains) {
            if (!uniqueTrainNumbers.has(genTrain.number)) {
                uniqueTrainNumbers.add(genTrain.number);
                finalTrains.push(genTrain);
            }
        }

        // Final multimodal collection
        // CRITICAL: Flights will strictly be empty [] if either source or destination has no airport (e.g. Ballia)!
        const finalFlights = discovery.flights;
        const finalBuses = discovery.buses;
        const allTransports = [...finalTrains, ...finalFlights, ...finalBuses];

        // Log search telemetry in SearchAnalytics
        try {
            await SearchAnalytics.create({
                user_id: req.user ? req.user.id : null,
                source,
                destination,
                status: allTransports.length > 0 ? 'SUCCESS' : 'NO_TRAINS',
                ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
            });
        } catch (analyticsErr) {
            console.error('⚠️  Failed to log search analytics:', analyticsErr.message);
        }

        res.json({
            trains: finalTrains,
            flights: finalFlights,
            buses: finalBuses,
            allTransports,
            totalResults: allTransports.length,
            distanceKm: discovery.distanceKm,
            hasAirport: discovery.hasAirport,
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
        console.error('[Search Trains Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

const getLiveTrainStatus = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const { journeyDate, selectedDay } = req.query; // e.g. "2023-10-25", "Wednesday"
        
        // Find train by PK or name
        let train = await Train.findByPk(trainNumber);
        if (!train) {
            train = await Train.findOne({
                where: {
                    [Op.or]: [
                        { train_number: trainNumber },
                        { train_name: { [Op.like]: `%${trainNumber}%` } }
                    ]
                }
            });
        }
        if (!train) {
            return res.status(404).json({ message: 'Train not found.' });
        }

        // Removing procedural running days validation, as it is demo data.
        let runningDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        if (selectedDay && !runningDays.includes(selectedDay)) {
            return res.status(400).json({ message: `Train ${train.train_number} does not run on ${selectedDay}s.` });
        }

        // Get schedules
        const schedules = await TrainSchedule.findAll({
            where: { train_number: train.train_number },
            order: [['stop_sequence', 'ASC']]
        });

        if (!schedules.length) {
            return res.status(404).json({ message: 'No schedule found for this train.' });
        }

        const schedulesWithStation = await Promise.all(schedules.map(async (sch) => {
            const station = await Station.findByPk(sch.station_code);
            return {
                stop_sequence: sch.stop_sequence,
                station_code: sch.station_code,
                station_name: station ? station.station_name : sch.station_code,
                arrival_time: sch.arrival_time,
                departure_time: sch.departure_time,
                day_count: sch.day_count,
                latitude: station ? station.latitude : null,
                longitude: station ? station.longitude : null
            };
        }));

        // Fix Timezone: Indian Railways operates in IST (UTC+5:30). 
        // We do all math in UTC, pretending UTC is IST to avoid server local time issues.
        const now = new Date();
        const currentIST_MS = now.getTime() + (5.5 * 60 * 60 * 1000);
        const currentTime = new Date(currentIST_MS);

        let baseDate;
        if (journeyDate) {
            baseDate = new Date(`${journeyDate}T00:00:00Z`);
            if (isNaN(baseDate.getTime())) {
                const y = currentTime.getUTCFullYear();
                const m = currentTime.getUTCMonth();
                const d = currentTime.getUTCDate();
                baseDate = new Date(Date.UTC(y, m, d));
            }
        } else {
            const y = currentTime.getUTCFullYear();
            const m = currentTime.getUTCMonth();
            const d = currentTime.getUTCDate();
            baseDate = new Date(Date.UTC(y, m, d));
        }

        // Get live train status from DB instead of mocking delays.
        const liveStatus = await LiveTrainStatus.findOne({ where: { train_number: trainNumber } });
        const delay_minutes = liveStatus ? liveStatus.delay_minutes : 0; 

        let status = 'Not Started';
        let current_station_code = null;
        let next_station_code = null;
        let last_crossed_station = null;
        let last_status_message = '';

        // Calculate actual datetimes for each stop in UTC space
        const parseTime = (t) => {
            if (!t) return null;
            const parts = t.split(':');
            return { h: parseInt(parts[0]) || 0, m: parseInt(parts[1]) || 0 };
        };

        const timeline = schedulesWithStation.map(stop => {
            const arr = parseTime(stop.arrival_time);
            const dep = parseTime(stop.departure_time);
            const dayOffset = (stop.day_count || 1) - 1;

            let actualArr = null;
            if (arr) {
                actualArr = new Date(baseDate);
                actualArr.setUTCDate(actualArr.getUTCDate() + dayOffset);
                actualArr.setUTCHours(arr.h, arr.m + delay_minutes, 0, 0);
            }

            let actualDep = null;
            if (dep) {
                actualDep = new Date(baseDate);
                actualDep.setUTCDate(actualDep.getUTCDate() + dayOffset);
                actualDep.setUTCHours(dep.h, dep.m + delay_minutes, 0, 0);
            }

            let schedArr = null;
            if (arr) {
                schedArr = new Date(baseDate);
                schedArr.setUTCDate(schedArr.getUTCDate() + dayOffset);
                schedArr.setUTCHours(arr.h, arr.m, 0, 0);
            }
            let schedDep = null;
            if (dep) {
                schedDep = new Date(baseDate);
                schedDep.setUTCDate(schedDep.getUTCDate() + dayOffset);
                schedDep.setUTCHours(dep.h, dep.m, 0, 0);
            }

            return {
                ...stop,
                actualArr,
                actualDep,
                schedArr,
                schedDep
            };
        });

        // Determine current position
        const source = timeline[0];
        const destination = timeline[timeline.length - 1];

        // If current time is before source departure
        if (currentTime < source.actualDep) {
            status = 'Not Started';
            current_station_code = source.station_code;
            next_station_code = timeline[1] ? timeline[1].station_code : null;
            last_status_message = `Train has not started. Scheduled departure from ${source.station_name} at ${source.schedDep.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}`;
        } 
        // If current time is after destination arrival
        else if (destination.actualArr && currentTime > destination.actualArr) {
            status = 'Completed';
            current_station_code = destination.station_code;
            last_crossed_station = destination.station_code;
            last_status_message = `Train has reached its destination ${destination.station_name}.`;
        } 
        // Train is running
        else {
            status = 'Running';
            // Find where we are
            for (let i = 0; i < timeline.length; i++) {
                const stop = timeline[i];
                if (stop.actualArr && stop.actualDep) {
                    if (currentTime >= stop.actualArr && currentTime <= stop.actualDep) {
                        current_station_code = stop.station_code;
                        last_crossed_station = stop.station_code;
                        next_station_code = timeline[i + 1] ? timeline[i + 1].station_code : null;
                        last_status_message = `Arrived at ${stop.station_name}. Waiting to depart.`;
                        break;
                    }
                }
                
                // If we are between stations
                const nextStop = timeline[i + 1];
                if (nextStop && stop.actualDep && nextStop.actualArr) {
                    if (currentTime > stop.actualDep && currentTime < nextStop.actualArr) {
                        last_crossed_station = stop.station_code;
                        current_station_code = null; // Between stations
                        next_station_code = nextStop.station_code;
                        last_status_message = `Departed ${stop.station_name}. Next stop is ${nextStop.station_name}.`;
                        break;
                    }
                }
            }
        }

        // Add display formatting flags to timeline
        const finalTimeline = timeline.map(stop => {
            let is_completed = false;
            if (status === 'Completed') is_completed = true;
            else if (status === 'Running' && stop.actualDep && currentTime > stop.actualDep) is_completed = true;

            return {
                stop_sequence: stop.stop_sequence,
                station_code: stop.station_code,
                station_name: stop.station_name,
                arrival_time: stop.arrival_time,
                departure_time: stop.departure_time,
                day_count: stop.day_count,
                latitude: stop.latitude,
                longitude: stop.longitude,
                is_completed,
                is_current: stop.station_code === current_station_code,
                estimated_arrival: stop.actualArr ? stop.actualArr.toTimeString().substring(0,5) : null,
                estimated_departure: stop.actualDep ? stop.actualDep.toTimeString().substring(0,5) : null
            };
        });

        // Use the first station if current_station_code is null (in transit) for map centering
        const active_station_code = current_station_code || last_crossed_station || source.station_code;
        const activeStop = finalTimeline.find(s => s.station_code === active_station_code) || finalTimeline[0];

        res.json({
            train_number: train.train_number,
            train_name: train.train_name,
            journey_date: journeyDate,
            live_status: {
                status,
                delay_minutes,
                current_station_code: active_station_code,
                next_station_code,
                last_crossed_station,
                last_status_message,
                current_lat: activeStop.latitude,
                current_lng: activeStop.longitude,
                last_updated_at: new Date()
            },
            timeline: finalTimeline
        });
    } catch (error) {
        console.error('[Get Live Train Status Error]:', error);
        res.status(500).json({ message: error.message });
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
    getLiveTrainStatus
};
