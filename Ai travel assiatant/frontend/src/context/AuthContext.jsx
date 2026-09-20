import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

/**
 * Generate or retrieve a persistent device identifier for this browser.
 */
const getDeviceId = () => {
    let devId = localStorage.getItem('deviceId');
    if (!devId) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            devId = crypto.randomUUID();
        } else {
            devId = 'dev-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
        }
        localStorage.setItem('deviceId', devId);
    }
    return devId;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Global Auth Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('login');

    const openAuthModal = (mode = 'login') => {
        setAuthModalMode(mode);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    useEffect(() => {
        const fetchUser = async () => {
            const cached = localStorage.getItem('userInfo');

            // Only verify session with the server if we have a cached login
            if (cached) {
                try {
                    setUser(JSON.parse(cached)); // Show cached user immediately
                    const { data } = await api.get('/auth/me');
                    setUser(data);
                    localStorage.setItem('userInfo', JSON.stringify(data));
                } catch (err) {
                    // The interceptor may have already retried via refresh token.
                    // If we still fail, try one explicit refresh as a safety net.
                    try {
                        await api.post('/auth/refresh');
                        const { data } = await api.get('/auth/me');
                        setUser(data);
                        localStorage.setItem('userInfo', JSON.stringify(data));
                    } catch (refreshErr) {
                        // Refresh also failed — session is truly dead
                        setUser(null);
                        localStorage.removeItem('userInfo');
                    }
                }
            }

            setLoading(false);
        };

        fetchUser();

        // Listen for silent refresh failures
        const handleLogout = () => {
            setUser(null);
            localStorage.removeItem('userInfo');
        };
        window.addEventListener('auth_logout', handleLogout);
        return () => window.removeEventListener('auth_logout', handleLogout);
    }, []);

    // ═══════════════════════════════════════
    // USER LOGIN
    // ═══════════════════════════════════════
    const login = async (email, password, turnstileToken) => {
        try {
            const device_id = getDeviceId();
            const { data } = await api.post('/auth/login', { email, password, device_id, turnstileToken });

            if (data && data.two_factor_required) {
                return { status: '2FA_REQUIRED', ...data };
            }

            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            toast.success('Successfully logged in!');
            return { status: 'SUCCESS', user: data };
        } catch (error) {
            handleAuthError(error, 'Login');
            return { status: 'FAILED' };
        }
    };

    // ═══════════════════════════════════════
    // USER REGISTRATION
    // ═══════════════════════════════════════
    const register = async (name, email, password, phone, turnstileToken) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password, phone, turnstileToken });

            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            toast.success('Registration successful!');
            return 'SUCCESS';
        } catch (error) {
            handleAuthError(error, 'Registration');
            return 'FAILED';
        }
    };

    // ═══════════════════════════════════════
    // ADMIN LOGIN (Separate endpoint)
    // ═══════════════════════════════════════
    const adminLogin = async (email, password) => {
        try {
            const { data } = await api.post('/auth/admin/login', { email, password });

            if (data && data.two_factor_required) {
                return { status: '2FA_REQUIRED', ...data };
            }

            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            toast.success('Admin access granted.');
            return { status: 'SUCCESS', user: data };
        } catch (error) {
            handleAuthError(error, 'Admin login');
            return { status: 'FAILED' };
        }
    };

    // ═══════════════════════════════════════
    // ADMIN REGISTRATION (Separate endpoint)
    // ═══════════════════════════════════════
    const adminRegister = async (name, email, password, adminSecret) => {
        try {
            const { data } = await api.post('/auth/admin/register', { name, email, password, adminSecret });

            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            toast.success('Admin account created successfully!');
            return { status: 'SUCCESS', user: data };
        } catch (error) {
            handleAuthError(error, 'Admin registration');
            return { status: 'FAILED' };
        }
    };

    // ═══════════════════════════════════════
    // COMPLETE LOGIN POST-VERIFICATION
    // ═══════════════════════════════════════
    const completeLogin = (userData) => {
        localStorage.setItem('userInfo', JSON.stringify(userData));
        setUser(userData);
        toast.success('Verification successful. Welcome!');
    };

    // ═══════════════════════════════════════
    // LOGOUT
    // ═══════════════════════════════════════
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.warn('[AuthContext] Backend logout warning:', err.message);
        }

        localStorage.removeItem('userInfo');
        setUser(null);
        toast.success('Logged out successfully.');
    };

    // ═══════════════════════════════════════
    // UPDATE USER (Local state)
    // ═══════════════════════════════════════
    const updateUser = (updates) => {
        const newUser = { ...user, ...updates };
        setUser(newUser);
        localStorage.setItem('userInfo', JSON.stringify(newUser));
    };

    // ═══════════════════════════════════════
    // ERROR HANDLER
    // ═══════════════════════════════════════
    function handleAuthError(error, context) {
        if (!error.response) {
            toast.error('Network Error: Cannot reach the backend server. Please check your connection and try again.');
            return;
        }

        const status = error.response.status;
        const message = error.response.data?.message;

        if (status === 429) {
            toast.error(message || 'Too many attempts. Please wait before trying again.');
        } else if (status === 401) {
            toast.error(message || 'Invalid credentials.');
        } else if (status === 403) {
            toast.error(message || 'Access denied.');
        } else if (status >= 500) {
            toast.error(`Server Error: ${message || 'Internal server error. Please try again later.'}`);
        } else {
            toast.error(message || `${context} failed.`);
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            adminLogin,
            adminRegister,
            completeLogin,
            logout,
            updateUser,
            loading,
            isAuthModalOpen,
            authModalMode,
            openAuthModal,
            closeAuthModal
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
