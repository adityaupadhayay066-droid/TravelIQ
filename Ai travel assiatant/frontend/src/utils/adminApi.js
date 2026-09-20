import api from './api';

export const adminApi = {
    // 1. Dashboard & Analytics
    getAnalytics: () => api.get('/admin/analytics'),
    getSystemHealth: () => api.get('/admin/system-health'),
    getSystemStatus: () => api.get('/admin/system-status'),
    getRevenueAnalytics: () => api.get('/admin/revenue-analytics'),

    // 2. Users Management
    getUsers: (params = {}) => api.get('/admin/users', { params }),
    getUserById: (id) => api.get(`/admin/users/${id}`),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    resetUserPassword: (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, { newPassword }),
    bulkUpdateUsers: (userIds, action) => api.post('/admin/users/bulk', { userIds, action }),
    getUserActivity: (id) => api.get(`/admin/users/${id}/activity`),

    // 3. Trains & Stations
    getTrains: (params = {}) => api.get('/admin/trains', { params }),
    createTrain: (data) => api.post('/admin/trains', data),
    deleteTrain: (trainNumber) => api.delete(`/admin/trains/${trainNumber}`),
    updateLiveTrainStatus: (data) => api.post('/admin/trains/live-status', data),
    getStations: (params = {}) => api.get('/admin/stations', { params }),
    createStation: (data) => api.post('/admin/stations', data),
    updateStation: (code, data) => api.put(`/admin/stations/${code}`, data),
    deleteStation: (code) => api.delete(`/admin/stations/${code}`),

    // 4. Destinations Management
    getDestinations: (params = {}) => api.get('/admin/destinations', { params }),
    getDestinationById: (id) => api.get(`/admin/destinations/${id}`),
    createDestination: (data) => api.post('/admin/destinations', data),
    updateDestination: (id, data) => api.put(`/admin/destinations/${id}`, data),
    deleteDestination: (id) => api.delete(`/admin/destinations/${id}`),

    // 5. Reports & Issues
    getReports: (params = {}) => api.get('/admin/reports', { params }),
    createReport: (data) => api.post('/admin/reports', data),
    updateReport: (id, data) => api.put(`/admin/reports/${id}`, data),

    // 6. Notifications
    getNotifications: (params = {}) => api.get('/admin/notifications', { params }),
    markNotificationAsRead: (id) => api.put(`/admin/notifications/${id}/read`),
    markAllNotificationsAsRead: () => api.put('/admin/notifications/mark-all-read'),
    deleteNotification: (id) => api.delete(`/admin/notifications/${id}`),

    // 7. Admin Accounts & Roles
    getAdminAccounts: () => api.get('/admin/admins'),
    updateAdminRole: (id, admin_role) => api.put(`/admin/admins/${id}/role`, { admin_role }),

    // 8. Bookings & Coupons
    getBookings: (params = {}) => api.get('/admin/bookings', { params }),
    updateBooking: (id, data) => api.put(`/admin/bookings/${id}`, data),
    createBooking: (data) => api.post('/admin/bookings', data),
    getCoupons: () => api.get('/admin/coupons'),
    createCoupon: (data) => api.post('/admin/coupons', data),
    updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
    deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),

    // 9. Search Analytics & Sessions
    getSearchAnalytics: (params = {}) => api.get('/admin/searches', { params }),
    getActiveSessions: () => api.get('/admin/sessions'),
    revokeSession: (sessionId) => api.delete(`/admin/sessions/${sessionId}`),
    getLoginHistory: () => api.get('/admin/login-history'),
    getAuditLogs: (params = {}) => api.get('/admin/audit-logs', { params }),

    // 10. Security & Telemetry
    getSecurityAlerts: () => api.get('/admin/security-alerts'),
    resolveSecurityAlert: (id) => api.put(`/admin/security-alerts/${id}/resolve`),
    getSecuritySettings: () => api.get('/admin/security/settings'),
    updateSecuritySettings: (data) => api.post('/admin/security/settings', data),

    // 11. Datasets Upload & CSV Workflow
    previewDatasetCSV: (formData) => api.post('/admin/upload-dataset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    confirmDatasetImport: (formData) => api.post('/admin/upload-dataset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    exportReportUrl: (type) => `/api/admin/export/${type}`,

    // 12. Knowledge & Chatbot
    getKnowledgeBase: () => api.get('/admin/chatbot/knowledge'),
    addKnowledge: (data) => api.post('/admin/chatbot/knowledge', data),
    updateKnowledge: (id, data) => api.put(`/admin/chatbot/knowledge/${id}`, data),
    deleteKnowledge: (id) => api.delete(`/admin/chatbot/knowledge/${id}`),

    // 13. Support & ML
    getAllTickets: () => api.get('/admin/tickets'),
    replyToTicket: (ticketId, data) => api.put(`/admin/tickets/${ticketId}`, data),
    triggerMlRetrain: () => api.post('/admin/ml/retrain')
};

export default adminApi;
