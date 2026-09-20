const { Destination, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET /api/admin/destinations
const getDestinations = async (req, res) => {
    try {
        const { search = '', status = '', page = 1, limit = 10, sortBy = 'popularity', order = 'DESC' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { state: { [Op.like]: `%${search}%` } },
                { country: { [Op.like]: `%${search}%` } }
            ];
        }
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        const { count, rows } = await Destination.findAndCountAll({
            where: whereClause,
            order: [[sortBy, order.toUpperCase()]],
            limit: parseInt(limit),
            offset
        });

        return res.json({
            success: true,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / parseInt(limit)),
            destinations: rows
        });
    } catch (error) {
        console.error('getDestinations error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve destinations.' });
    }
};

// GET /api/admin/destinations/:id
const getDestinationById = async (req, res) => {
    try {
        const { id } = req.params;
        const destination = await Destination.findByPk(id);
        if (!destination) {
            return res.status(404).json({ success: false, message: 'Destination not found.' });
        }
        return res.json({ success: true, destination });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/destinations
const createDestination = async (req, res) => {
    try {
        const {
            name, state, country = 'India', description, image_url, popularity = 80,
            best_time_to_visit, estimated_budget, attractions, food_recommendations,
            safety_info, local_transport, tags, status = 'active'
        } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Destination name is required.' });
        }

        const destination = await Destination.create({
            name,
            state,
            country,
            description,
            image_url: image_url || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1200',
            popularity: parseInt(popularity) || 80,
            best_time_to_visit,
            estimated_budget: estimated_budget ? parseFloat(estimated_budget) : null,
            attractions: Array.isArray(attractions) ? attractions : (attractions ? attractions.split(',').map(s => s.trim()) : []),
            food_recommendations: Array.isArray(food_recommendations) ? food_recommendations : (food_recommendations ? food_recommendations.split(',').map(s => s.trim()) : []),
            safety_info,
            local_transport,
            tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(s => s.trim()) : ['Popular']),
            status
        });

        return res.status(201).json({ success: true, destination, message: 'Destination created successfully.' });
    } catch (error) {
        console.error('createDestination error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/destinations/:id
const updateDestination = async (req, res) => {
    try {
        const { id } = req.params;
        const destination = await Destination.findByPk(id);
        if (!destination) {
            return res.status(404).json({ success: false, message: 'Destination not found.' });
        }

        const updates = { ...req.body };
        if (updates.attractions && !Array.isArray(updates.attractions)) {
            updates.attractions = updates.attractions.split(',').map(s => s.trim());
        }
        if (updates.food_recommendations && !Array.isArray(updates.food_recommendations)) {
            updates.food_recommendations = updates.food_recommendations.split(',').map(s => s.trim());
        }
        if (updates.tags && !Array.isArray(updates.tags)) {
            updates.tags = updates.tags.split(',').map(s => s.trim());
        }

        await destination.update(updates);
        return res.json({ success: true, destination, message: 'Destination updated successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/admin/destinations/:id
const deleteDestination = async (req, res) => {
    try {
        const { id } = req.params;
        const destination = await Destination.findByPk(id);
        if (!destination) {
            return res.status(404).json({ success: false, message: 'Destination not found.' });
        }
        await destination.destroy();
        return res.json({ success: true, message: 'Destination deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDestinations,
    getDestinationById,
    createDestination,
    updateDestination,
    deleteDestination
};
