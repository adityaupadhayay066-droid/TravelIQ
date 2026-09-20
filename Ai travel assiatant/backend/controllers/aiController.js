const aiService = require('../services/aiService');
const { 
    AiPrediction, 
    FareForecast, 
    DelayPrediction, 
    OccupancyPrediction, 
    CrowdPrediction, 
    RecommendationLog, 
    ModelMetric 
} = require('../models');

// Helper to log general predictions
const logPrediction = async (userId, type, input, output, confidence) => {
    try {
        await AiPrediction.create({
            user_id: userId || null,
            prediction_type: type,
            input_data: input,
            output_data: output,
            confidence: confidence || null
        });
    } catch (err) {
        console.error(`⚠️ Failed to log prediction telemetry:`, err.message);
    }
};

const getDelayPrediction = async (req, res) => {
    try {
        const response = await aiService.predictDelay(req.body);
        
        // Background DB logging
        logPrediction(req.user?.id, 'DELAY', req.body, response, response.confidence);
        
        try {
            await DelayPrediction.create({
                train_number: req.body.train_number,
                route: req.body.route,
                departure_delay_mins: response.expected_departure_delay_mins,
                arrival_delay_mins: response.expected_arrival_delay_mins,
                delay_probability: response.delay_probability,
                confidence: response.confidence
            });
        } catch (dbErr) {
            console.error('⚠️ DelayPrediction DB log warning:', dbErr.message);
        }
        
        res.json(response);
    } catch (error) {
        console.error('Delay prediction error:', error.message);
        res.status(500).json({ message: 'Error in delay prediction service' });
    }
};

const getFareForecast = async (req, res) => {
    try {
        const response = await aiService.predictFare(req.body);
        
        logPrediction(req.user?.id, 'FARE', req.body, response, null);
        
        try {
            await FareForecast.create({
                source: req.body.source,
                destination: req.body.destination,
                class_code: req.body.class_code,
                travel_date: new Date(),
                current_fare: Math.round(req.body.current_fare),
                forecasted_fare_7d: Math.round(response.forecasted_fare_7d),
                recommendation: response.recommendation,
                demand_level: response.demand_level
            });
        } catch (dbErr) {
            console.error('⚠️ FareForecast DB log warning:', dbErr.message);
        }
        
        res.json(response);
    } catch (error) {
        console.error('Fare forecast error:', error.message);
        res.status(500).json({ message: 'Error in fare forecast service' });
    }
};

const getCrowdPrediction = async (req, res) => {
    try {
        const response = await aiService.predictCrowd(req.body);
        
        logPrediction(req.user?.id, 'CROWD', req.body, response, null);
        
        try {
            await CrowdPrediction.create({
                station_code: req.body.station_code,
                prediction_date: new Date(),
                hour_of_day: req.body.hour_of_day,
                crowd_level: response.crowd_level,
                expected_crowd_percent: response.expected_crowd_percent,
                platform_congestion_percent: response.platform_congestion_percent,
                peak_time_alert: response.peak_time_alert
            });
        } catch (dbErr) {
            console.error('⚠️ CrowdPrediction DB log warning:', dbErr.message);
        }
        
        res.json(response);
    } catch (error) {
        console.error('Crowd prediction error:', error.message);
        res.status(500).json({ message: 'Error in crowd prediction service' });
    }
};

const getOccupancyPrediction = async (req, res) => {
    try {
        const response = await aiService.predictOccupancy(req.body);
        
        logPrediction(req.user?.id, 'OCCUPANCY', req.body, response, null);
        
        try {
            await OccupancyPrediction.create({
                train_number: req.body.train_number,
                travel_date: new Date(),
                class_code: req.body.class_code,
                availability_probability: response.availability_probability,
                expected_waiting_list: response.expected_waiting_list,
                seat_demand: response.seat_demand,
                coach_occupancy_percent: response.coach_occupancy_percent
            });
        } catch (dbErr) {
            console.error('⚠️ OccupancyPrediction DB log warning:', dbErr.message);
        }
        
        res.json(response);
    } catch (error) {
        console.error('Occupancy prediction error:', error.message);
        res.status(500).json({ message: 'Error in occupancy prediction service' });
    }
};

const getRouteRecommendation = async (req, res) => {
    try {
        const response = await aiService.recommendRoute(req.body);
        
        logPrediction(req.user?.id, 'ROUTE', req.body, response, response.match_confidence);
        
        try {
            await RecommendationLog.create({
                user_id: req.user?.id || null,
                recommendation_type: 'ROUTE',
                criteria: req.body,
                results: response
            });
        } catch (dbErr) {
            console.error('⚠️ RecommendationLog DB log warning:', dbErr.message);
        }
        
        res.json(response);
    } catch (error) {
        console.error('Route recommendation error:', error.message);
        res.status(500).json({ message: 'Error in route recommendation service' });
    }
};

const getFoodRecommendation = async (req, res) => {
    try {
        const response = await aiService.recommendFood(req.body);
        
        logPrediction(req.user?.id, 'FOOD', req.body, response, null);
        
        try {
            await RecommendationLog.create({
                user_id: req.user?.id || null,
                recommendation_type: 'FOOD',
                criteria: req.body,
                results: response
            });
        } catch (dbErr) {
            console.error('⚠️ RecommendationLog DB log warning:', dbErr.message);
        }
        
        res.json(response);
    } catch (error) {
        console.error('Food recommendation error:', error.message);
        res.status(500).json({ message: 'Error in food recommendation service' });
    }
};

const getUserBehaviorProfile = async (req, res) => {
    try {
        const response = await aiService.predictBehavior(req.body);
        logPrediction(req.user?.id, 'BEHAVIOR', req.body, response, null);
        res.json(response);
    } catch (error) {
        console.error('User behavior prediction error:', error.message);
        res.status(500).json({ message: 'Error in behavior profiling service' });
    }
};

const triggerRetraining = async (req, res) => {
    try {
        const response = await aiService.retrainModels();
        res.json(response);
    } catch (error) {
        console.error('Model retraining error:', error.message);
        res.status(500).json({ message: 'Error triggering model retraining' });
    }
};

const getModelStatusMetrics = async (req, res) => {
    try {
        // First try to fetch from MySQL database metrics table
        let metrics = [];
        try {
            metrics = await ModelMetric.findAll({
                order: [['last_trained_at', 'DESC']]
            });
        } catch (dbErr) {
            console.warn('⚠️ Could not fetch metrics from DB, using fallback:', dbErr.message);
        }

        // Call FastAPI to get latest local json log metrics
        let serviceMetrics = null;
        try {
            serviceMetrics = await aiService.getModelMetrics();
        } catch (err) {
            console.warn('⚠️ Could not fetch metrics from FastAPI service:', err.message);
        }

        let totalPredictions = 0;
        let recentPredictions = [];
        try {
            totalPredictions = await AiPrediction.count();
            recentPredictions = await AiPrediction.findAll({
                limit: 10,
                order: [['created_at', 'DESC']]
            });
        } catch (dbErr) {
            console.warn('⚠️ Could not fetch predictions log from DB:', dbErr.message);
        }

        res.json({
            database_metrics: metrics,
            active_metrics: serviceMetrics?.metrics || serviceMetrics || null,
            total_predictions: totalPredictions,
            recent_predictions: recentPredictions
        });
    } catch (error) {
        console.error('Model metrics fetch error:', error.message);
        res.status(500).json({ message: 'Error fetching model metrics' });
    }
};


const getCopilotQuery = async (req, res) => {
    try {
        const response = await aiService.queryCopilot(req.body.query, req.user?.id || 1);
        res.json(response);
    } catch (error) {
        console.error('Copilot query error:', error.message);
        res.status(500).json({ message: 'Error in copilot query service' });
    }
};


const getMemoryProfile = async (req, res) => {
    try {
        const response = await aiService.getMemoryProfile(req.user?.id || 1);
        res.json(response);
    } catch (error) {
        console.error('Get memory profile error:', error.message);
        res.status(500).json({ message: 'Error fetching memory profile' });
    }
};

const updateMemoryProfile = async (req, res) => {
    try {
        const response = await aiService.updateMemoryProfile({
            ...req.body,
            user_id: req.user?.id || 1
        });
        res.json(response);
    } catch (error) {
        console.error('Update memory profile error:', error.message);
        res.status(500).json({ message: 'Error updating memory profile' });
    }
};

module.exports = {
    getDelayPrediction,
    getFareForecast,
    getCrowdPrediction,
    getOccupancyPrediction,
    getRouteRecommendation,
    getFoodRecommendation,
    getUserBehaviorProfile,
    triggerRetraining,
    getModelStatusMetrics,
    getCopilotQuery,
    getMemoryProfile,
    updateMemoryProfile
};

