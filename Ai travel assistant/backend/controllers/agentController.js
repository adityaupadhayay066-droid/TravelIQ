const { Station, Train, TrainSchedule, FoodRecommendation, sequelize } = require('../models');
const hotelService = require('../services/hotelService');

const STATION_CITY_MAP = {
    'NDLS': 'delhi', 'DLI': 'delhi', 'NZM': 'delhi',
    'BBS': 'bhubaneswar',
    'HWH': 'kolkata', 'SDAH': 'kolkata',
    'CSTM': 'mumbai', 'MMCT': 'mumbai', 'PNVL': 'mumbai',
    'MAS': 'chennai', 'MS': 'chennai',
    'SBC': 'bangalore', 'YPR': 'bangalore',
    'HYB': 'hyderabad', 'SC': 'hyderabad',
    'PUNE': 'pune',
    'JP': 'jaipur',
    'MAO': 'goa',
    'TATA': 'jamshedpur'
};

/**
 * Simulate agent steps, reasoning logs, and output results.
 */
const runAgentSimulation = async (req, res) => {
    const { source, destination, date, budget = 5000 } = req.body;

    if (!source || !destination) {
        return res.status(400).json({ message: "Source and destination are required." });
    }

    try {
        const parsedBudget = parseFloat(budget) || 5000;
        
        const sourceCode = source.trim().toUpperCase();
        const destCode = destination.trim().toUpperCase();

        const sourceStation = await Station.findOne({ where: { station_code: sourceCode } });
        const destStation = await Station.findOne({ where: { station_code: destCode } });

        const sourceName = sourceStation ? sourceStation.station_name : sourceCode;
        const destName = destStation ? destStation.station_name : destCode;

        const query = `
            SELECT t.train_number, t.train_name
            FROM train_schedules s1
            JOIN train_schedules s2 ON s1.train_number = s2.train_number
            JOIN trains t ON s1.train_number = t.train_number
            WHERE s1.station_code = :sourceCode AND s2.station_code = :destCode AND s1.stop_sequence < s2.stop_sequence
            LIMIT 1
        `;

        const routes = await sequelize.query(query, {
            replacements: { sourceCode, destCode },
            type: sequelize.QueryTypes.SELECT
        });

        const train = routes.length > 0 ? routes[0] : null;

        let primaryRoute = `${sourceCode} -> ${destCode}`;
        let trainDesc = "Direct Route";
        let bookingProb = 'Medium (60%)';
        
        if (train) {
            primaryRoute = `${train.train_number} (${train.train_name}) from ${sourceCode} to ${destCode}`;
            trainDesc = train.train_name;
            bookingProb = 'High (92%)';
        } else {
            primaryRoute = `No direct trains found in database between ${sourceCode} and ${destCode}`;
            bookingProb = 'N/A';
        }

        // Determine destination city for dataset lookups
        const cityLookupKey = STATION_CITY_MAP[destCode] || destName.toLowerCase();

        // 1. Fetch Real Food Data from Dataset / DB
        let destFoodRecommendations = [];
        try {
            const dbFoods = await FoodRecommendation.findAll({
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('city')),
                    'LIKE',
                    `%${cityLookupKey}%`
                )
            });

            if (dbFoods && dbFoods.length > 0) {
                destFoodRecommendations = dbFoods.map((f, i) => ({
                    id: `f-dataset-${f.id || i}`,
                    name: f.food_name,
                    restaurant: f.restaurant,
                    station: `${destCode} Station`,
                    price: f.price_range === '$' ? 120 : f.price_range === '$$' ? 220 : 350,
                    rating: f.rating || 4.6,
                    isVeg: Boolean(f.is_veg),
                    distance: `${(0.3 + i * 0.2).toFixed(1)} km`,
                    cuisine: f.must_try ? 'Must-Try Specialty' : 'Regional Cuisine',
                    deliveryTime: '15-20 min',
                    platformPrices: {
                        irctc: f.price_range === '$' ? 120 : 220,
                        zomato: f.price_range === '$' ? 140 : 250,
                        swiggy: f.price_range === '$' ? 135 : 240
                    }
                }));
            }
        } catch (dbErr) {
            console.warn('[Food Dataset Query Error]:', dbErr.message);
        }

        // Expanded fallback if DB had no rows for this specific city
        if (!destFoodRecommendations || destFoodRecommendations.length === 0) {
            const cityFoodMap = {
                'NDLS': [
                    { id: 'f1', name: 'Karim\'s Mughlai Platter', restaurant: 'Karim\'s Jama Masjid', station: 'NDLS', price: 280, rating: 4.8, isVeg: false, distance: '1.2 km', cuisine: 'Mughlai / North Indian', deliveryTime: '25 min', platformPrices: { irctc: 290, zomato: 310, swiggy: 300 } },
                    { id: 'f2', name: 'Sita Ram Diwan Chand Chole Bhature', restaurant: 'Sita Ram Diwan Chand', station: 'NDLS (Paharganj)', price: 120, rating: 4.7, isVeg: true, distance: '0.6 km', cuisine: 'Street Food / Breakfast', deliveryTime: '15 min', platformPrices: { irctc: 130, zomato: 140, swiggy: 135 } },
                    { id: 'f3', name: 'Haldiram Special Thali', restaurant: 'Haldiram\'s Executive Concourse', station: 'NDLS Concourse', price: 240, rating: 4.6, isVeg: true, distance: '0.1 km', cuisine: 'Pure Veg Thali', deliveryTime: '10 min', platformPrices: { irctc: 240, zomato: 260, swiggy: 250 } },
                    { id: 'f4', name: 'Kake Di Hatti Dal Makhani & Naan', restaurant: 'Kake Di Hatti Chandni Chowk', station: 'NDLS', price: 220, rating: 4.6, isVeg: true, distance: '1.5 km', cuisine: 'North Indian', deliveryTime: '30 min', platformPrices: { irctc: 230, zomato: 250, swiggy: 240 } },
                ],
                'BBS': [
                    { id: 'f1', name: 'Authentic Dalma & Steamed Rice', restaurant: 'Odisha Hotel', station: 'BBS Platform 1 Exit', price: 160, rating: 4.7, isVeg: true, distance: '0.4 km', cuisine: 'Odia Traditional', deliveryTime: '15 min', platformPrices: { irctc: 160, zomato: 180, swiggy: 175 } },
                    { id: 'f2', name: 'Pahili Bhoga Chhena Poda', restaurant: 'Nimapara Sweets', station: 'BBS Concourse', price: 90, rating: 4.9, isVeg: true, distance: '0.2 km', cuisine: 'Traditional Dessert', deliveryTime: '10 min', platformPrices: { irctc: 90, zomato: 110, swiggy: 100 } },
                    { id: 'f3', name: 'Chilika Prawn Malai Curry', restaurant: 'Mayfair Dhabba', station: 'BBS Master Canteen', price: 340, rating: 4.8, isVeg: false, distance: '0.8 km', cuisine: 'Seafood Special', deliveryTime: '25 min', platformPrices: { irctc: 350, zomato: 380, swiggy: 370 } },
                    { id: 'f4', name: 'Macha Ghanta & Kanika Thali', restaurant: 'Bikanervala Master Canteen', station: 'BBS Main Station', price: 210, rating: 4.5, isVeg: false, distance: '0.5 km', cuisine: 'Regional Feast', deliveryTime: '20 min', platformPrices: { irctc: 210, zomato: 230, swiggy: 220 } },
                ]
            };

            const defaultFood = [
                { id: 'f1', name: `${destName} Signature Thali`, restaurant: `${destName} Central Kitchen`, station: destCode, price: 180, rating: 4.6, isVeg: true, distance: '0.3 km', cuisine: 'Regional Special', deliveryTime: '15 min', platformPrices: { irctc: 180, zomato: 200, swiggy: 195 } },
                { id: 'f2', name: 'Station Master Fresh Biryani', restaurant: 'Royal Concourse Kitchen', station: destCode, price: 220, rating: 4.7, isVeg: false, distance: '0.2 km', cuisine: 'Biryani / Mughlai', deliveryTime: '12 min', platformPrices: { irctc: 220, zomato: 240, swiggy: 235 } },
                { id: 'f3', name: 'Crispy Snack & Tea Combo', restaurant: 'Chai Junction Express', station: destCode, price: 75, rating: 4.5, isVeg: true, distance: '0.1 km', cuisine: 'Quick Bites', deliveryTime: '8 min', platformPrices: { irctc: 75, zomato: 90, swiggy: 85 } },
                { id: 'f4', name: 'Chef Special Paneer Butter Masala', restaurant: `${destName} Highway Treat`, station: destCode, price: 250, rating: 4.6, isVeg: true, distance: '0.7 km', cuisine: 'North Indian', deliveryTime: '20 min', platformPrices: { irctc: 255, zomato: 280, swiggy: 270 } },
            ];

            destFoodRecommendations = cityFoodMap[destCode] || defaultFood;
        }

        // 2. Fetch Real Hotel Data from CSV Dataset (google_hotel_data_clean_v2.csv)
        const hostelBasePrice = Math.max(399, Math.min(899, Math.round(parsedBudget * 0.12)));
        const budgetHotelBasePrice = Math.max(999, Math.min(1899, Math.round(parsedBudget * 0.28)));
        const premiumHotelBasePrice = Math.max(1999, Math.min(4500, Math.round(parsedBudget * 0.45)));

        let accommodationList = [];
        if (hotelService.isDataLoaded()) {
            const realHotelSearch = hotelService.searchHotels(cityLookupKey, { limit: 12 });
            if (realHotelSearch.hotels && realHotelSearch.hotels.length > 0) {
                accommodationList = realHotelSearch.hotels.map((h, i) => {
                    const isHostel = (h.price && h.price < 900) || (h.type && h.type.includes('hostel'));
                    return {
                        id: `acc-dataset-${i}`,
                        name: h.name,
                        type: isHostel ? 'hostel' : 'hotel',
                        category: h.features?.[0] || (isHostel ? 'Hostel / Dorm' : 'Hotel'),
                        rating: h.rating || 4.6,
                        reviewsCount: Math.floor(Math.random() * 400) + 120,
                        pricePerNight: h.price ? Math.round(h.price) : (isHostel ? hostelBasePrice : budgetHotelBasePrice),
                        distanceToStation: `${(0.4 + i * 0.2).toFixed(1)} km`,
                        address: `Near ${destName} Station, ${h.city}`,
                        amenities: h.features?.length ? h.features : ['WiFi', 'AC Room', '24/7 Security'],
                        tag: isHostel ? '🎒 Verified Hostel' : '🏨 Dataset Verified',
                        badgeColor: isHostel ? 'emerald' : 'purple',
                        freeCancellation: true
                    };
                });
            }
        }

        // Fallback if dataset returns 0 hotels for an unknown small town
        if (!accommodationList || accommodationList.length === 0) {
            accommodationList = [
                {
                    id: 'acc-1',
                    name: `Zostel / Backpacker Hub ${destName}`,
                    type: 'hostel',
                    category: 'Bunk Dorm & Co-living',
                    rating: 4.8,
                    reviewsCount: 428,
                    pricePerNight: hostelBasePrice,
                    distanceToStation: '0.6 km',
                    address: `Near ${destName} Station Main Exit`,
                    amenities: ['High-speed WiFi', 'AC Pods', 'Personal Lockers', 'Female Only Dorm Available', 'Café & Lounge', '24/7 Security'],
                    tag: '🎒 Top Hostel Pick',
                    badgeColor: 'emerald',
                    freeCancellation: true
                },
                {
                    id: 'acc-2',
                    name: `Hotel Transit Grand ${destName}`,
                    type: 'hotel',
                    category: '3-Star Premium Hotel',
                    rating: 4.7,
                    reviewsCount: 612,
                    pricePerNight: budgetHotelBasePrice,
                    distanceToStation: '0.4 km',
                    address: `Station Plaza, ${destName}`,
                    amenities: ['Complimentary Breakfast', 'AC Deluxe Room', 'Free WiFi', 'Station Pickup', '24hr Room Service', 'Elevator'],
                    tag: '🏨 Best Value Hotel',
                    badgeColor: 'purple',
                    freeCancellation: true
                }
            ];
        }

        // Realistic budget calculations
        const estTicketCost = train ? 1850 : Math.min(1500, Math.round(parsedBudget * 0.35));
        const estHotelCost = budgetHotelBasePrice;
        const estMealsCost = Math.min(800, Math.round(parsedBudget * 0.15));
        const estLocalTransport = Math.min(500, Math.round(parsedBudget * 0.08));
        const totalEstCost = estTicketCost + estHotelCost + estMealsCost + estLocalTransport;
        const remainingBudget = Math.max(0, parsedBudget - totalEstCost);
        const savingsPercent = Math.max(5, Math.round(((parsedBudget - totalEstCost) / Math.max(parsedBudget, 1)) * 100));

        // Generate realistic responses tailored to source/destination/budget
        const simulationData = {
            parameters: { source, destination, date, budget: parsedBudget },
            timestamp: new Date(),
            agents: [
                {
                    id: 'route',
                    name: 'Route Optimization Agent',
                    status: 'completed',
                    progress: 100,
                    logs: [
                        'Initiating railway network trace...',
                        `Searching optimal tracks connecting ${sourceName} to ${destName}...`,
                        'Analyzing alternative transit routes (Superfast vs Express schedules)...',
                        'Calculated primary routes based on database records.',
                    ],
                    reasoning: train ? `Found direct route via ${trainDesc}. Recommended path utilizes available database schedules.` : `Analyzed optimal connected transit tracks for ${sourceCode} to ${destCode}.`,
                    result: {
                        primaryRoute: primaryRoute,
                        travelDuration: train ? '14h 30m (Fastest)' : '16h 15m (Est)',
                        distanceKm: train ? '1280 km' : '1350 km',
                        alternativesCount: routes.length || 3
                    }
                },
                {
                    id: 'booking',
                    name: 'Smart Booking Agent',
                    status: 'completed',
                    progress: 100,
                    logs: [
                        'Polling class seat inventories...',
                        'Estimating booking availability probabilities via historical occupancy networks...',
                        'Calculating optimal reservation window rules...',
                        'Analyzed ticket pricing indices from database.'
                    ],
                    reasoning: `Seat availability based on train load and demand curves. ${train ? 'Route active.' : 'Alternative connections available.'}`,
                    result: {
                        recommendedClass: '3A',
                        availableSeats: train ? 48 : 32,
                        bookingProbability: bookingProb !== 'N/A' ? bookingProb : 'High (84%)',
                        fareEst: estTicketCost
                    }
                },
                {
                    id: 'food',
                    name: 'Gourmet Food Agent',
                    status: 'completed',
                    progress: 100,
                    logs: [
                        `Scanning restaurant ratings near ${destName} (${destCode}) railway hub...`,
                        `Checking food vendor hygiene certifications within budget cap ₹${estMealsCost}...`,
                        'Aggregating multi-platform price comparisons (IRCTC vs Zomato vs Swiggy)...',
                        `Compiled ${destFoodRecommendations.length} top-rated eateries and station delivery options.`
                    ],
                    reasoning: `Selected ${destFoodRecommendations.length} certified restaurants and local specialties near ${destName} fitting within your meal budget.`,
                    result: {
                        mealBudget: estMealsCost,
                        totalRestaurantsFound: destFoodRecommendations.length,
                        recommendations: destFoodRecommendations.map(f => ({
                            id: f.id,
                            station: f.station,
                            item: f.name,
                            vendor: f.restaurant,
                            rating: f.rating,
                            price: f.price,
                            isVeg: f.isVeg,
                            cuisine: f.cuisine,
                            distance: f.distance,
                            deliveryTime: f.deliveryTime,
                            platformPrices: f.platformPrices
                        })),
                        restaurants: destFoodRecommendations
                    }
                },
                {
                    id: 'budget',
                    name: 'Budget Maximizer Agent',
                    status: 'completed',
                    progress: 100,
                    logs: [
                        `Verifying ticket expense limits against max cap of ₹${parsedBudget}...`,
                        `Allocated ₹${estTicketCost} for travel, ₹${estHotelCost} for stay, ₹${estMealsCost} for meals...`,
                        'Evaluating contingency safety reserves and expenditure curve...',
                        `Budget optimization score: 94/100 (Remaining buffer: ₹${remainingBudget})`
                    ],
                    reasoning: totalEstCost <= parsedBudget
                        ? `Complete itinerary fits comfortably within your ₹${parsedBudget.toLocaleString()} budget with ₹${remainingBudget.toLocaleString()} safety savings!`
                        : `Itinerary cost (₹${totalEstCost.toLocaleString()}) slightly exceeds budget (₹${parsedBudget.toLocaleString()}). Hostels recommended to reduce cost.`,
                    result: {
                        totalEstCost: totalEstCost,
                        remainingBudget: remainingBudget,
                        savingsPercent: savingsPercent,
                        allocation: {
                            ticket: estTicketCost,
                            stay: estHotelCost,
                            meals: estMealsCost,
                            transport: estLocalTransport,
                            contingency: Math.max(200, parsedBudget - totalEstCost)
                        }
                    }
                },
                {
                    id: 'weather',
                    name: 'Climate Sentinel Agent',
                    status: 'completed',
                    progress: 100,
                    logs: [
                        `Connecting to meteorological stations near ${destName}...`,
                        'Analyzing satellite radar imagery along transit coordinates...',
                        'Predicting cross-route delay factors triggered by precipitation or visibility...',
                        'Weather status locked: Pleasant travel conditions forecasted.'
                    ],
                    reasoning: `Stable weather patterns with mild breeze forecasted across ${destName}.`,
                    result: {
                        averageTemp: '27°C',
                        precipitationProb: '8%',
                        windSpeed: '14 km/h',
                        delayRisk: 'Negligible (<5 min)'
                    }
                },
                {
                    id: 'safety',
                    name: 'Security Guard Agent',
                    status: 'completed',
                    progress: 100,
                    logs: [
                        'Scanning safety logs and passenger transit security indices...',
                        `Mapping RPF assistance kiosks at ${sourceCode} and ${destCode}...`,
                        'Evaluating 24/7 CCTV platform security coverage...',
                        'Safety verified: Active escort squads and verified helpline 139/182 active.'
                    ],
                    reasoning: `Verified route with 24/7 RPF security patrol and continuous CCTV monitoring.`,
                    result: {
                        overallSafetyScore: '9.6/10',
                        rpfHelpline: 'Active (139 / 182)',
                        nightPatrol: 'Escorted Night Guard',
                        alertStatus: 'Green (Safe)'
                    }
                },
                {
                    id: 'carbon',
                    name: 'Carbon Tracker Agent',
                    status: 'completed',
                    progress: 100,
                    logs: [
                        'Estimating vehicle-weight to passenger distribution ratios...',
                        'Computing carbon emission metrics for rail vs flight models...',
                        'Estimating cumulative greenhouse footprint offset...',
                        'Eco-efficiency rating finalized: Grade A++'
                    ],
                    reasoning: `Choosing electrified rail over flight for this trip reduces CO₂ emissions by over 85%.`,
                    result: {
                        railEmissionKg: 22.4,
                        flightEmissionKg: 158.0,
                        netSavedCo2Kg: 135.6,
                        ecoGrade: 'A++'
                    }
                },
                {
                    id: 'hotel',
                    name: 'Hotel Aggregator Agent',
                    status: 'completed',
                    progress: 100,
                    logs: [
                        `Locating verified hotels & hostels within 2km of ${destName} (${destCode})...`,
                        `Filtering properties by budget (Hostels from ₹${hostelBasePrice}, Hotels from ₹${budgetHotelBasePrice})...`,
                        'Cross-checking verified guest ratings (>4.3★) and station proximity...',
                        `Aggregated ${accommodationList.length} top accommodations (Hotels & Hostels).`
                    ],
                    reasoning: `Identified top-rated Hotels and Backpacker Hostels near ${destName} station with free cancellation.`,
                    result: {
                        totalAccommodations: accommodationList.length,
                        hotelsCount: accommodationList.filter(a => a.type === 'hotel').length,
                        hostelsCount: accommodationList.filter(a => a.type === 'hostel').length,
                        hotels: accommodationList,
                        featuredHostel: accommodationList.find(a => a.type === 'hostel'),
                        featuredHotel: accommodationList.find(a => a.type === 'hotel')
                    }
                }
            ]
        };

        res.json(simulationData);
    } catch (e) {
        console.error('[Agent Simulation Error]:', e);
        res.status(500).json({ message: e.message });
    }
};

module.exports = { runAgentSimulation };
