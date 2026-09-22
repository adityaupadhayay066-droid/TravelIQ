import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Route protection wrapper restricting children elements strictly to authenticated administrator users.
 * Supports RBAC permissions via allowedRoles prop.
 */
const AdminRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (user && user.role !== 'admin') {
            toast.error('Access Denied: Administrator privileges are required to access this portal.');
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
                <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    if (user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    // Role-based permission check
    if (allowedRoles.length > 0) {
        const userAdminRole = user.admin_role || 'admin';
        if (userAdminRole !== 'super_admin' && !allowedRoles.includes(userAdminRole) && !allowedRoles.includes('admin')) {
            toast.error(`Permission denied. Required role: ${allowedRoles.join(' or ')}`);
            return <Navigate to="/admin/dashboard" replace />;
        }
    }

    return children;
};

export default AdminRoute;
