const { SupportTicket, SupportMessage, SupportAttachment, User } = require('../models');
const n8nService = require('../services/n8nService');

// User creates a ticket
exports.createTicket = async (req, res) => {
    try {
        const { subject, category, message, priority } = req.body;
        const user_id = req.user.id;

        const ticket = await SupportTicket.create({
            user_id,
            subject,
            message,
            category,
            priority: priority || 'Medium',
            status: 'Open'
        });

        // Add the initial message
        await SupportMessage.create({
            ticket_id: ticket.id,
            sender_type: 'User',
            sender_id: user_id,
            message
        });

        // Add attachments if any
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                await SupportAttachment.create({
                    ticket_id: ticket.id,
                    file_url: `/uploads/${file.filename}`,
                    file_name: file.originalname,
                    file_type: file.mimetype
                });
            }
        }

        // Trigger n8n Automation asynchronously for immediate AI generated reply
        n8nService.triggerSupportWebhook(ticket, message, req.user).catch(err => {
            console.error('[SupportController] n8n automation webhook error:', err.message);
        });

        res.status(201).json({ success: true, message: 'Ticket created successfully', ticket });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ success: false, message: error.message, error: error.stack });
    }
};

// User fetches their tickets
exports.getUserTickets = async (req, res) => {
    try {
        const user_id = req.user.id;
        const tickets = await SupportTicket.findAll({
            where: { user_id },
            order: [['created_at', 'DESC']],
            include: [{ model: User, attributes: ['name', 'email'] }]
        });
        res.json({ success: true, tickets });
    } catch (error) {
        console.error('Fetch user tickets error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get single ticket details
exports.getTicketDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await SupportTicket.findByPk(id, {
            include: [
                { model: User, attributes: ['id', 'name', 'email', 'profile_image'] },
                { 
                    model: SupportMessage,
                    include: [{ model: User, attributes: ['name', 'profile_image'] }]
                },
                { model: SupportAttachment }
            ],
            order: [[SupportMessage, 'created_at', 'ASC']]
        });

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        // Security check: Only the owner or an admin can view
        if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Fetch ticket details error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Add a reply to a ticket
exports.replyToTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, status } = req.body;
        
        const ticket = await SupportTicket.findByPk(id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        // Security check
        if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const sender_type = req.user.role === 'admin' ? 'Admin' : 'User';

        await SupportMessage.create({
            ticket_id: id,
            sender_type,
            sender_id: req.user.id,
            message
        });

        // Update ticket status
        if (status) {
            ticket.status = status;
        } else if (sender_type === 'User' && ticket.status === 'Resolved') {
            ticket.status = 'Open'; // Reopen if user replies
        } else if (sender_type === 'Admin' && ticket.status === 'Open') {
            ticket.status = 'In Progress';
        }
        
        // Save the latest admin reply to the main table as well
        if (sender_type === 'Admin') {
            ticket.admin_reply = message;
        }
        
        await ticket.save();

        res.json({ success: true, message: 'Reply sent' });
    } catch (error) {
        console.error('Reply ticket error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Admin specific endpoints (Fetch all tickets)
exports.getAllTickets = async (req, res) => {
    try {
        const statusFilter = req.query.status;
        const whereClause = statusFilter && statusFilter !== 'All' ? { status: statusFilter } : {};

        const tickets = await SupportTicket.findAll({
            where: whereClause,
            include: [{ model: User, attributes: ['name', 'email'] }],
            order: [['created_at', 'DESC']]
        });
        
        res.json({ success: true, tickets });
    } catch (error) {
        console.error('Fetch all tickets error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Admin updates ticket status/priority
exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority } = req.body;

        const ticket = await SupportTicket.findByPk(id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        if (status) ticket.status = status;
        if (priority) ticket.priority = priority;

        await ticket.save();
        res.json({ success: true, message: 'Ticket updated successfully' });
    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
