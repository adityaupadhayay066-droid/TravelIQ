const express = require('express');
const router = express.Router();
const multer = require('multer');
const { adminProtect, requireAdminRole } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

// File upload support for CSV imports
const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const { adminLogin } = require('../controllers/authController');
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetUserPassword,
    bulkUpdateUsers,
    getAnalytics,
    getActiveSessions,
    revokeSession,
    getLoginHistory,
    resetDatabase,
    getAuditLogs,
    getTrains,
    createTrain,
    deleteTrain,
    updateLiveTrainStatus,
    getBookings,
    updateBooking,
    createBooking,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getSecurityAlerts,
    resolveSecurityAlert,
    getSearchAnalytics,
    getSystemHealth,
    triggerMlRetrain,
    getStations,
    createStation,
    updateStation,
    deleteStation,
    uploadDataset,
    getAdminSecuritySettings,
    updateAdminSecuritySettings,
    getRouteManagement,
    getRevenueAnalytics,
    getAnnouncements,
    createAnnouncement,
    toggleAnnouncement,
    deleteAnnouncement,
    exportReport,
    getUserActivity,
    getAdminAccounts,
    updateAdminRole
} = require('../controllers/adminController');

const {
    getDestinations,
    getDestinationById,
    createDestination,
    updateDestination,
    deleteDestination
} = require('../controllers/adminDestinationController');

const {
    getReports,
    updateReport,
    createReport
} = require('../controllers/adminReportController');

const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/adminNotificationController');

const {
    getKnowledgeBase,
    addKnowledge,
    updateKnowledge,
    deleteKnowledge
} = require('../controllers/chatbotController');

const { getAllTickets, replyToTicket } = require('../controllers/supportController');

// ─── Public admin auth routes (rate-limited) ───
router.post('/login', loginLimiter, adminLogin);

// ─── Protected admin dashboard routes ───
router.use(adminProtect);

// 1. Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/reset-password', resetUserPassword);
router.post('/users/bulk', bulkUpdateUsers);
router.get('/users/:id/activity', getUserActivity);

// 2. Dashboard Analytics & Health
router.get('/analytics', getAnalytics);
router.get('/system-health', getSystemHealth);
router.get('/system-status', getSystemHealth);
router.get('/sessions', getActiveSessions);
router.delete('/sessions/:sessionId', revokeSession);
router.get('/login-history', getLoginHistory);
router.get('/audit-logs', getAuditLogs);
router.post('/reset-database', resetDatabase);

// 3. Trains & Stations
router.get('/trains', getTrains);
router.post('/trains', createTrain);
router.delete('/trains/:trainNumber', deleteTrain);
router.post('/trains/live-status', updateLiveTrainStatus);
router.get('/stations', getStations);
router.post('/stations', createStation);
router.put('/stations/:stationCode', updateStation);
router.delete('/stations/:stationCode', deleteStation);

// 4. Destinations
router.get('/destinations', getDestinations);
router.get('/destinations/:id', getDestinationById);
router.post('/destinations', createDestination);
router.put('/destinations/:id', updateDestination);
router.delete('/destinations/:id', deleteDestination);

// 5. Reports & Issues
router.get('/reports', getReports);
router.post('/reports', createReport);
router.put('/reports/:id', updateReport);

// 6. Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/mark-all-read', markAllAsRead);
router.put('/notifications/:id/read', markAsRead);
router.delete('/notifications/:id', deleteNotification);

// 7. Admin Accounts & RBAC (Super Admin Only for Role Modification)
router.get('/admins', getAdminAccounts);
router.put('/admins/:id/role', requireAdminRole(['super_admin']), updateAdminRole);

// 8. Bookings & Coupons
router.get('/bookings', getBookings);
router.post('/bookings', createBooking);
router.put('/bookings/:id', updateBooking);
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// 9. Support & Security
router.get('/tickets', getAllTickets);
router.put('/tickets/:ticketId', replyToTicket);
router.get('/security-alerts', getSecurityAlerts);
router.put('/security-alerts/:id/resolve', resolveSecurityAlert);
router.get('/security/settings', getAdminSecuritySettings);
router.post('/security/settings', updateAdminSecuritySettings);

// 10. Search & ML & Datasets
router.get('/searches', getSearchAnalytics);
router.post('/ml/retrain', triggerMlRetrain);
router.post('/upload-dataset', csvUpload.single('file'), uploadDataset);
router.get('/routes-management', getRouteManagement);
router.get('/revenue-analytics', getRevenueAnalytics);
router.get('/export/:type', exportReport);

// 11. Announcements & Chatbot Knowledge
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id/toggle', toggleAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);
router.get('/chatbot/knowledge', getKnowledgeBase);
router.post('/chatbot/knowledge', addKnowledge);
router.put('/chatbot/knowledge/:id', updateKnowledge);
router.delete('/chatbot/knowledge/:id', deleteKnowledge);

module.exports = router;
