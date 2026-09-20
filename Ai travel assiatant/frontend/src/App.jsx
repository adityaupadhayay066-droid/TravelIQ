import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AIChatbot from './components/AIChatbot';
import ErrorBoundary from './components/ErrorBoundary';
import AuthModal from './components/AuthModal';
import DashboardLayout from './components/DashboardLayout';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';

// Public & User-facing pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MyTripsPage = lazy(() => import('./pages/MyTripsPage'));
const DevicesPage = lazy(() => import('./pages/DevicesPage'));
const ActiveSessions = lazy(() => import('./pages/ActiveSessions'));
const ActivityLog = lazy(() => import('./pages/ActivityLog'));
const FoodPage = lazy(() => import('./pages/FoodPage'));
const RestaurantDetails = lazy(() => import('./pages/RestaurantDetails'));
const EcoTrackerPage = lazy(() => import('./pages/EcoTrackerPage'));
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard'));
const LiveTrackingPage = lazy(() => import('./pages/LiveTrackingPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const Station3DView = lazy(() => import('./pages/Station3DView'));
const AIWorkspace = lazy(() => import('./pages/AIWorkspace'));
const RAGSearchPage = lazy(() => import('./pages/RAGSearchPage'));
const VoiceAssistantPage = lazy(() => import('./pages/VoiceAssistantPage'));
const Globe3DPage = lazy(() => import('./pages/Globe3DPage'));
const KnowledgeGraphPage = lazy(() => import('./pages/KnowledgeGraphPage'));
const AgenticPlannerPage = lazy(() => import('./pages/AgenticPlannerPage'));
const AIPredictionsPage = lazy(() => import('./pages/AIPredictionsPage'));
const DestinationsDirectoryPage = lazy(() => import('./pages/DestinationsDirectoryPage'));
const DestinationPage = lazy(() => import('./pages/DestinationPage'));
import AIVoiceAssistant from './components/AIVoiceAssistant';

// Admin Pages
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminSignup = lazy(() => import('./pages/AdminSignup'));
const AdminDashboardHome = lazy(() => import('./pages/admin/AdminDashboardHome'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const TravelDataPage = lazy(() => import('./pages/admin/TravelDataPage'));
const TrainsPage = lazy(() => import('./pages/admin/TrainsPage'));
const DestinationsPage = lazy(() => import('./pages/admin/DestinationsPage'));
const TransportPage = lazy(() => import('./pages/admin/TransportPage'));
const AIAssistantPage = lazy(() => import('./pages/admin/AIAssistantPage'));
const AIKnowledgePage = lazy(() => import('./pages/admin/AIKnowledgePage'));
const SearchActivityPage = lazy(() => import('./pages/admin/SearchActivityPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage'));
const SystemHealthPage = lazy(() => import('./pages/admin/SystemHealthPage'));
const NotificationsPage = lazy(() => import('./pages/admin/NotificationsPage'));
const AdminManagementPage = lazy(() => import('./pages/admin/AdminManagementPage'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

function Loader() {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="w-9 h-9 border-[3px] border-[#E3DED2] dark:border-[#2A403A] border-t-[#173F3A] dark:border-t-[#EEF2ED] rounded-full animate-spin" />
    </div>
  );
}

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
    className="flex-1 flex flex-col w-full"
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth Public Routes */}
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
        <Route path="/admin/login" element={<PageWrapper><AdminLogin /></PageWrapper>} />
        <Route path="/admin/signup" element={<PageWrapper><AdminSignup /></PageWrapper>} />

        {/* ========================================================================= */}
        {/* ADMIN PANEL ROUTES (Protected & Wrapped in AdminLayout)                   */}
        {/* ========================================================================= */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        
        <Route path="/admin/dashboard" element={
          <AdminRoute><AdminLayout><PageWrapper><AdminDashboardHome /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute><AdminLayout><PageWrapper><UsersPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/travel-data" element={
          <AdminRoute><AdminLayout><PageWrapper><TravelDataPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/trains" element={
          <AdminRoute><AdminLayout><PageWrapper><TrainsPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/destinations" element={
          <AdminRoute><AdminLayout><PageWrapper><DestinationsPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/transport" element={
          <AdminRoute><AdminLayout><PageWrapper><TransportPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/ai" element={
          <AdminRoute><AdminLayout><PageWrapper><AIAssistantPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/ai-knowledge" element={
          <AdminRoute><AdminLayout><PageWrapper><AIKnowledgePage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/searches" element={
          <AdminRoute><AdminLayout><PageWrapper><SearchActivityPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/reports" element={
          <AdminRoute><AdminLayout><PageWrapper><ReportsPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/analytics" element={
          <AdminRoute><AdminLayout><PageWrapper><AnalyticsPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/system-health" element={
          <AdminRoute><AdminLayout><PageWrapper><SystemHealthPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/notifications" element={
          <AdminRoute><AdminLayout><PageWrapper><NotificationsPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/admins" element={
          <AdminRoute allowedRoles={['super_admin']}><AdminLayout><PageWrapper><AdminManagementPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/logs" element={
          <AdminRoute><AdminLayout><PageWrapper><AuditLogsPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/settings" element={
          <AdminRoute><AdminLayout><PageWrapper><AdminSettingsPage /></PageWrapper></AdminLayout></AdminRoute>
        } />

        {/* Backward Compatibility Aliases */}
        <Route path="/admin/chatbot" element={
          <AdminRoute><AdminLayout><PageWrapper><AIKnowledgePage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/security" element={
          <AdminRoute><AdminLayout><PageWrapper><AdminSettingsPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/data-status" element={
          <AdminRoute><AdminLayout><PageWrapper><TravelDataPage /></PageWrapper></AdminLayout></AdminRoute>
        } />
        <Route path="/admin/support" element={
          <AdminRoute><AdminLayout><PageWrapper><ReportsPage /></PageWrapper></AdminLayout></AdminRoute>
        } />

        {/* ========================================================================= */}
        {/* EXISTING USER-FACING APPLICATION ROUTES (Preserved Intact)                 */}
        {/* ========================================================================= */}
        <Route path="/" element={<PageWrapper><Navbar /><LandingPage /></PageWrapper>} />
        <Route path="/destinations" element={<PageWrapper><Navbar /><DestinationsDirectoryPage /></PageWrapper>} />
        <Route path="/destinations/:cityName" element={<PageWrapper><Navbar /><DestinationPage /></PageWrapper>} />
        <Route path="/support" element={<PageWrapper><Navbar /><SupportPage /></PageWrapper>} />
        <Route path="/support/ticket/:id" element={<PageWrapper><Navbar /><TicketDetail /></PageWrapper>} />

        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><Dashboard /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/profile" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><ProfilePage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/settings" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><SettingsPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/devices" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><DevicesPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/sessions" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><ActiveSessions /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/activity" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><ActivityLog /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/my-trips" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><MyTripsPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/food" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><FoodPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/eco" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><EcoTrackerPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/security" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><SecurityDashboard /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/track" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><LiveTrackingPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/station-3d" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><Station3DView /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/ai-workspace" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><AIWorkspace /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/rag" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><RAGSearchPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/voice-assistant" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><VoiceAssistantPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/3d-globe" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><Globe3DPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/knowledge-graph" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><KnowledgeGraphPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/agentic-planner" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><AgenticPlannerPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/ai-predictions" element={
          <ProtectedRoute><DashboardLayout><PageWrapper><AIPredictionsPage /></PageWrapper></DashboardLayout></ProtectedRoute>
        } />

        {/* 404 Fallback */}
        <Route path="*" element={
          <PageWrapper>
            <Navbar />
            <div className="flex-1 flex items-center justify-center py-24 px-4">
              <div className="text-center space-y-3">
                <h1 className="text-7xl font-extrabold font-heading text-[#173F3A] dark:text-[#F7F5EF]">404</h1>
                <p className="text-lg text-[#66736F] dark:text-[#A3B0AB]">Page not found</p>
                <div className="pt-2">
                  <a href="/" className="btn-primary inline-flex">Return Home</a>
                </div>
              </div>
            </div>
          </PageWrapper>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <div className="min-h-screen w-full bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col relative transition-colors duration-200">
              <Toaster 
                position="top-right" 
                toastOptions={{ 
                  style: { 
                    background: 'var(--color-surface)', 
                    color: 'var(--color-text)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(23,63,58,0.08)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-sans)'
                  } 
                }} 
              />
              <AuthModal />
              <Suspense fallback={<Loader />}>
                <AnimatedRoutes />
              </Suspense>
              <AIChatbot />
              <AIVoiceAssistant />
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
