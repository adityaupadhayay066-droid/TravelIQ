const { Report, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET /api/admin/reports
const getReports = async (req, res) => {
    try {
        const { search = '', status = '', priority = '', category = '', page = 1, limit = 10, sortBy = 'created_at', order = 'DESC' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { report_id: { [Op.like]: `%${search}%` } },
                { subject: { [Op.like]: `%${search}%` } },
                { user_name: { [Op.like]: `%${search}%` } },
                { user_email: { [Op.like]: `%${search}%` } }
            ];
        }
        if (status && status !== 'all') whereClause.status = status;
        if (priority && priority !== 'all') whereClause.priority = priority;
        if (category && category !== 'all') whereClause.category = category;

        const { count, rows } = await Report.findAndCountAll({
            where: whereClause,
            order: [[sortBy, order.toUpperCase()]],
            limit: parseInt(limit),
            offset
        });

        // Compute summary counts
        const openCount = await Report.count({ where: { status: 'Open' } });
        const investigatingCount = await Report.count({ where: { status: 'Investigating' } });
        const resolvedCount = await Report.count({ where: { status: 'Resolved' } });
        const criticalCount = await Report.count({ where: { priority: 'Critical', status: { [Op.ne]: 'Closed' } } });

        return res.json({
            success: true,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / parseInt(limit)),
            reports: rows,
            stats: {
                open: openCount,
                investigating: investigatingCount,
                resolved: resolvedCount,
                critical: criticalCount
            }
        });
    } catch (error) {
        console.error('getReports error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve reports.' });
    }
};

// PUT /api/admin/reports/:id
const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found.' });
        }

        const { status, priority, assigned_admin_id, assigned_admin_name, internal_notes, resolution_summary } = req.body;
        
        await report.update({
            ...(status && { status }),
            ...(priority && { priority }),
            ...(assigned_admin_id !== undefined && { assigned_admin_id }),
            ...(assigned_admin_name !== undefined && { assigned_admin_name }),
            ...(internal_notes !== undefined && { internal_notes }),
            ...(resolution_summary !== undefined && { resolution_summary })
        });

        return res.json({ success: true, report, message: 'Report updated successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/reports
const createReport = async (req, res) => {
    try {
        const { category, subject, description, priority = 'Medium', user_id, user_name, user_email } = req.body;
        const report_id = 'REP-' + Date.now().toString().slice(-6);

        const newReport = await Report.create({
            report_id,
            category: category || 'Other',
            subject,
            description,
            priority,
            status: 'Open',
            user_id: user_id || (req.user ? req.user.id : null),
            user_name: user_name || (req.user ? req.user.name : 'Anonymous User'),
            user_email: user_email || (req.user ? req.user.email : 'user@example.com')
        });

        return res.status(201).json({ success: true, report: newReport });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getReports,
    updateReport,
    createReport
};
