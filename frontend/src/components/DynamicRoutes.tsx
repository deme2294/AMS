import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./Auth/AuthContext";
import { ROLES } from "../utils/roles";

// --- Import All Pages for Dynamic Routing ---

// Dashboards
import DashboardOverview    from "../pages/dashboard/DashboardOverview";
import DashboardAnalytics   from "../pages/dashboard/DashboardAnalytics";
import ManagerDashboard     from "../pages/dashboard/ManagerDashboard";
import BarberDashboard      from "../pages/dashboard/BarberDashboard";
import ReceptionistDashboard from "../pages/dashboard/ReceptionistDashboard";

// Services & Categories
import CategoriesManagement   from "../pages/categories/CategoriesManagement";
import ServiceCategoriesPage  from "../pages/services/ServiceCategoriesPage";
import ServicesPage           from "../pages/services/ServicesPage";
import CustomerServicesPage   from "../pages/services/CustomerServicesPage";
import ServiceSubmissionPage  from "../pages/standalone/ServiceSubmissionPage";
import ReviewBookingsPage     from "../pages/services/ReviewBookingsPage";
import QueueManagementPage    from "../pages/services/QueueManagementPage";

// Users & Employees
import AllUsersPage           from "../pages/users/AllUsersPage";
import AddNewUserPage         from "../pages/users/AddNewUserPage";
import EditUserPage           from "../pages/users/EditUserPage";
import ManageEmployeesPage    from "../pages/users/ManageEmployeesPage";
import RolesPermissionsPage   from "../pages/users/RolesPermissionsPage";

// ─────────────────────────────────────────────────────────
// Route Configuration Map
// path → component
// ─────────────────────────────────────────────────────────
const routeConfig: Record<string, React.ComponentType<any>> = {
    // Dashboards (role-based rendering is handled below)
    '/dashboard/overview':   DashboardOverview,
    '/dashboard/analytics':  DashboardAnalytics,

    // Categories Management
    '/categories':           CategoriesManagement,

    // Services
    '/services/categories':  ServiceCategoriesPage,
    '/services':             ServicesPage,
    '/customer/services':    CustomerServicesPage,
    '/service-submission':   ServiceSubmissionPage,
    '/services/review':      ReviewBookingsPage,
    '/services/queue':       QueueManagementPage,

    // Users
    '/users/all':            AllUsersPage,
    '/users/add':            AddNewUserPage,
    '/users/edit/:userId':   EditUserPage,
    '/users/manage-employees': ManageEmployeesPage,
    '/users/roles':          RolesPermissionsPage,
};

// ─────────────────────────────────────────────────────────
// Role → allowed paths map
// ─────────────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<number, string[]> = {
    [ROLES.ADMIN]: [
        '/dashboard/overview', '/dashboard/analytics',
        '/categories',
        '/services/categories', '/services', '/service-submission',
        '/services/review', '/services/queue',
        '/users/all', '/users/add', '/users/edit/:userId',
        '/users/manage-employees', '/users/roles',
        '/customer/services',
    ],
    [ROLES.MANAGER]: [
        '/dashboard/overview', '/dashboard/analytics',
        '/categories',
        '/services/categories', '/services',
        '/services/review', '/services/queue',
        '/users/manage-employees',
    ],
    [ROLES.BARBER]: [
        '/dashboard/overview',
        '/services', '/services/queue',
    ],
    [ROLES.RECEPTIONIST]: [
        '/dashboard/overview',
        '/services/review', '/services/queue',
        '/customer/services',
    ],
    [ROLES.CUSTOMER]: [
        '/dashboard/overview',
        '/customer/services',
    ],
};

// ─────────────────────────────────────────────────────────
// Role → URL prefix map
// ─────────────────────────────────────────────────────────
const ROLE_PREFIX: Record<number, string> = {
    [ROLES.ADMIN]: 'admin',
    [ROLES.MANAGER]: 'manager',
    [ROLES.BARBER]: 'barber',
    [ROLES.RECEPTIONIST]: 'receptionist',
    [ROLES.CUSTOMER]: 'customer',
};

// ─────────────────────────────────────────────────────────
// Dashboard Component selector per role
// ─────────────────────────────────────────────────────────
function RoleDashboard({ roleId }: { roleId: number }) {
    switch (roleId) {
        case ROLES.MANAGER:      return <ManagerDashboard />;
        case ROLES.BARBER:       return <BarberDashboard />;
        case ROLES.RECEPTIONIST: return <ReceptionistDashboard />;
        default:                 return <DashboardOverview />;
    }
}

// ─────────────────────────────────────────────────────────
// DynamicRoutes Component
// ─────────────────────────────────────────────────────────
const DynamicRoutes: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Small delay to allow auth to settle
        const t = setTimeout(() => setLoading(false), 300);
        return () => clearTimeout(t);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-900/50 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const roleId = user ? Number(user.role_id) : 0;
    const allowedPaths = new Set<string>(ROLE_PERMISSIONS[roleId] || []);
    const rolePrefix = ROLE_PREFIX[roleId] || 'user';

    // Always ensure sub-routes are accessible if parent is allowed
    if (allowedPaths.has('/users/all')) {
        allowedPaths.add('/users/edit/:userId');
        allowedPaths.add('/users/add');
    }

    return (
        <Routes>
            {/* Root redirect to role-based dashboard */}
            <Route index element={<Navigate to={`/${rolePrefix}/dashboard/overview`} replace />} />

            {/* Legacy routes without role prefix - redirect to role-based */}
            <Route path="/dashboard/overview" element={<Navigate to={`/${rolePrefix}/dashboard/overview`} replace />} />
            <Route path="/dashboard/analytics" element={<Navigate to={`/${rolePrefix}/dashboard/analytics`} replace />} />

            {/* Role-based dashboard routes */}
            <Route path={`/${rolePrefix}/dashboard/overview`} element={<RoleDashboard roleId={roleId} />} />
            
            {/* Analytics only for Admin and Manager */}
            {(roleId === ROLES.ADMIN || roleId === ROLES.MANAGER) && (
                <Route path={`/${rolePrefix}/dashboard/analytics`} element={<DashboardAnalytics />} />
            )}

            {/* Map all other permitted routes with role prefix */}
            {Object.entries(routeConfig).map(([path, Component]) => {
                if (path.startsWith('/dashboard/')) return null; // handled above
                if (!allowedPaths.has(path)) return null;
                
                const rolePath = `/${rolePrefix}${path}`;
                return <Route key={rolePath} path={rolePath} element={<Component />} />;
            })}

            {/* Legacy service routes - redirect to role-based */}
            <Route path="/services/*" element={<Navigate to={`/${rolePrefix}/services`} replace />} />
            <Route path="/users/*" element={<Navigate to={`/${rolePrefix}/users/all`} replace />} />

            {/* Services sub-routes with role prefix */}
            {allowedPaths.has('/services') && (
                <Route path={`/${rolePrefix}/services/*`} element={
                    <Routes>
                        <Route index element={<ServicesPage />} />
                        <Route path="review" element={allowedPaths.has('/services/review') ? <ReviewBookingsPage /> : <Navigate to={`/${rolePrefix}/services`} replace />} />
                        <Route path="queue"  element={allowedPaths.has('/services/queue')  ? <QueueManagementPage /> : <Navigate to={`/${rolePrefix}/services`} replace />} />
                        <Route path="categories" element={allowedPaths.has('/services/categories') ? <ServiceCategoriesPage /> : <Navigate to={`/${rolePrefix}/services`} replace />} />
                        <Route path="*"      element={<Navigate to={`/${rolePrefix}/services`} replace />} />
                    </Routes>
                } />
            )}

            {/* Categories Management (separate route for Admin/Manager) */}
            {allowedPaths.has('/categories') && (
                <Route path={`/${rolePrefix}/categories`} element={<CategoriesManagement />} />
            )}

            {/* Users sub-routes with role prefix */}
            {allowedPaths.has('/users/all') && (
                <Route path={`/${rolePrefix}/users/*`} element={
                    <Routes>
                        <Route index element={<Navigate to={`/${rolePrefix}/users/all`} replace />} />
                        <Route path="all" element={<AllUsersPage />} />
                        <Route path="add" element={<AddNewUserPage />} />
                        <Route path="edit/:userId" element={<EditUserPage />} />
                        <Route path="manage-employees" element={allowedPaths.has('/users/manage-employees') ? <ManageEmployeesPage /> : <Navigate to={`/${rolePrefix}/users/all`} replace />} />
                        <Route path="roles" element={allowedPaths.has('/users/roles') ? <RolesPermissionsPage /> : <Navigate to={`/${rolePrefix}/users/all`} replace />} />
                        <Route path="*" element={<Navigate to={`/${rolePrefix}/users/all`} replace />} />
                    </Routes>
                } />
            )}

            {/* Customer services route */}
            {allowedPaths.has('/customer/services') && (
                <Route path={`/${rolePrefix}/customer/services`} element={<CustomerServicesPage />} />
            )}

            {/* Service submission */}
            {allowedPaths.has('/service-submission') && (
                <Route path={`/${rolePrefix}/service-submission`} element={<ServiceSubmissionPage />} />
            )}

            {/* Access Denied Fallback */}
            <Route
                path="*"
                element={
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-red-100 dark:border-red-900/30 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">
                                You do not have permission to access this module. Please contact your system administrator if you believe this is an error.
                            </p>
                            <a
                                href={`/${rolePrefix}/dashboard/overview`}
                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30"
                            >
                                Return to Dashboard
                            </a>
                        </div>
                    </div>
                }
            />
        </Routes>
    );
};

export default DynamicRoutes;
