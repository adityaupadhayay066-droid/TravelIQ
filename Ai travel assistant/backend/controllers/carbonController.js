const { Trip, CarbonEmission } = require('../models');
const { getDistanceBetweenCities, compareTripEmissions } = require('../utils/carbonCalculator');

/**
 * Fetch and calculate comparative carbon footprint metrics for a trip.
 * Stores result in carbon_emissions table if not already indexed.
 */
const getTripCarbonEmission = async (req, res) => {
    const { tripId } = req.params;

    try {
        const trip = await Trip.findByPk(tripId);
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }

        // Calculate distance
        const distance = getDistanceBetweenCities(trip.source, trip.destination);
        const mode = trip.travel_mode || 'Train';

        // Calculate emissions comparisons
        const emissions = compareTripEmissions(distance, mode);

        // Find or create carbon emission record in database
        let record = await CarbonEmission.findOne({ where: { trip_id: tripId } });
        if (!record) {
            record = await CarbonEmission.create({
                user_id: trip.user_id,
                trip_id: tripId,
                transport_type: mode,
                distance,
                emission_value: emissions.chosen,
                carbon_saved: emissions.saved
            });
        } else {
            // Update in case travel mode changed
            record.transport_type = mode;
            record.distance = distance;
            record.emission_value = emissions.chosen;
            record.carbon_saved = emissions.saved;
            await record.save();
        }

        res.json({
            trip_id: trip.id,
            source: trip.source,
            destination: trip.destination,
            chosen_mode: mode,
            distance_km: distance,
            emissions,
            record
        });

    } catch (error) {
        console.error('[Get Trip Carbon Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get cumulative green travel summary and eco badges for a user.
 */
const getUserCarbonSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Query all carbon records for user
        const records = await CarbonEmission.findAll({ where: { user_id: userId } });

        let totalDistance = 0.0;
        let totalEmissions = 0.0;
        let totalSaved = 0.0;

        records.forEach(rec => {
            totalDistance += parseFloat(rec.distance || 0);
            totalEmissions += parseFloat(rec.emission_value || 0);
            totalSaved += parseFloat(rec.carbon_saved || 0);
        });

        // 1 Eco Point per 1 kg CO2 saved
        const ecoPoints = Math.round(totalSaved);

        // Badge system
        let badge = 'Bronze Eco-Traveler';
        let badgeColor = 'from-amber-600 to-amber-800';
        let nextBadge = 'Silver Eco-Warrior';
        let nextBadgeThreshold = 100;
        
        if (ecoPoints >= 300) {
            badge = 'Gold Green Pioneer';
            badgeColor = 'from-emerald-400 to-teal-600 animate-pulse';
            nextBadge = 'Max Rank Achieved';
            nextBadgeThreshold = 300;
        } else if (ecoPoints >= 100) {
            badge = 'Silver Eco-Warrior';
            badgeColor = 'from-slate-300 to-slate-500';
            nextBadge = 'Gold Green Pioneer';
            nextBadgeThreshold = 300;
        }

        const percentageToNext = nextBadgeThreshold > 0 
            ? Math.min(Math.round((ecoPoints / nextBadgeThreshold) * 100), 100) 
            : 100;

        res.json({
            user_id: userId,
            trips_logged: records.length,
            total_distance_km: parseFloat(totalDistance.toFixed(2)),
            total_emissions_co2_kg: parseFloat(totalEmissions.toFixed(2)),
            total_saved_co2_kg: parseFloat(totalSaved.toFixed(2)),
            eco_score_points: ecoPoints,
            badge,
            badge_color: badgeColor,
            next_badge: nextBadge,
            next_badge_threshold: nextBadgeThreshold,
            percentage_to_next: percentageToNext
        });

    } catch (error) {
        console.error('[User Carbon Summary Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTripCarbonEmission,
    getUserCarbonSummary
};
