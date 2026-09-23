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
import CustomerDashboard    from "../pages/dashboard/CustomerDashboard";

// Services & Categories
import CategoriesManagement   from "../pages/categories/CategoriesManagement";
import ServiceCategoriesPage  from "../pages/services/ServiceCategoriesPage";
import ServicesPage           from "../pages/services/ServicesPage";
import ServiceDetailsPage     from "../pages/services/ServiceDetailsPage";
import EditServicePage        from "../pages/services/EditServicePage";
import CustomerServicesPage   from "../pages/services/CustomerServicesPage";
import ServiceSubmissionPage  from "../pages/standalone/ServiceSubmissionPage";
import ReviewBookingsPage     from "../pages/services/ReviewBookingsPage";
import QueueManagementPage    from "../pages/services/QueueManagementPage";
import ServiceBookingPage     from "../pages/standalone/ServiceBookingPage";
import RateServicePage        from "../pages/standalone/RateServicePage";
import AvailabilityManagementPage from "../pages/services/AvailabilityManagementPage";
import TrackMyBooking         from "../pages/standalone/TrackMyBooking";
import QueueTrackingPage      from "../pages/dashboard/QueueTracking";

// Users & Employees
import AllUsersPage           from "../pages/users/AllUsersPage";
import AddNewUserPage         from "../pages/users/AddNewUserPage";
import EditUserPage           from "../pages/users/EditUserPage";
import ManageEmployeesPage    from "../pages/users/ManageEmployeesPage";
import RolesPermissionsPage   from "../pages/users/RolesPermissionsPage";
import PermissionsManagementPage from "../pages/users/PermissionsManagementPage";

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
    '/services/availability': AvailabilityManagementPage,
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
    '/users/permissions':    PermissionsManagementPage,
    '/permissions':          PermissionsManagementPage,
    '/rate-services':        RateServicePage,
    '/rate-service/:id':     RateServicePage,
};

// ─────────────────────────────────────────────────────────
// Role → allowed paths map
// ─────────────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<number, string[]> = {
    [ROLES.ADMIN]: [
        '/dashboard/overview', '/dashboard/analytics',
        '/categories',
        '/services/categories', '/services', '/services/availability', '/service-submission',
        '/services/review', '/services/queue',
        '/users/all', '/users/add', '/users/edit/:userId',
        '/users/manage-employees', '/users/roles', '/users/permissions', '/permissions',
        '/customer/services',
        '/rate-services', '/rate-service/:id',
    ],
    [ROLES.MANAGER]: [
        '/dashboard/overview', '/dashboard/analytics',
        '/categories',
        '/services/categories', '/services', '/services/availability',
        '/services/review', '/services/queue',
        '/users/manage-employees',
        '/rate-services', '/rate-service/:id',
    ],
    [ROLES.BARBER]: [
        '/dashboard/overview',
        '/services', '/services/queue',
        '/rate-services', '/rate-service/:id',
    ],
    [ROLES.RECEPTIONIST]: [
        '/dashboard/overview',
        '/services', '/services/review', '/services/queue',
        '/customer/services',
        '/rate-services', '/rate-service/:id',
    ],
    [ROLES.CUSTOMER]: [
        '/dashboard/overview',
        '/services',
        '/customer/services',
        '/rate-services', '/rate-service/:id',
    ],
};

// ─────────────────────────────────────────────────────────
// Role → URL prefix map
// ─────────────────────────────────────────────────────────
const ROLE_PREFIX: Record<number, string> = {
    [ROLES.ADMIN]: 'admin',
    [ROLES.BARBER]: 'barber',
    [ROLES.CUSTOMER]: 'customer',
    [ROLES.MANAGER]: 'manager',
    [ROLES.RECEPTIONIST]: 'receptionist',
};

// ─────────────────────────────────────────────────────────
// Dashboard Component selector per role
// ─────────────────────────────────────────────────────────
function RoleDashboard({ roleId }: { roleId: number }) {
    switch (roleId) {
        case ROLES.MANAGER:      return <ManagerDashboard />;
        case ROLES.BARBER:       return <BarberDashboard />;
        case ROLES.RECEPTIONIST: return <ReceptionistDashboard />;
        case ROLES.CUSTOMER:     return <CustomerDashboard />;
        default:                 return <DashboardOverview />;
    }
}

import { getMyNavigation, Menu } from "../services/apiService";

// ─────────────────────────────────────────────────────────
// DynamicRoutes Component
// ─────────────────────────────────────────────────────────
const DynamicRoutes: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dynamicPaths, setDynamicPaths] = useState<string[]>([]);

    const roleId = user ? Number(user.role_id) : 0;
    const dynamicPrefix = user?.role_name ? user.role_name.toLowerCase().replace(/[^a-z0-9]/g, '') : null;
    const rolePrefix = ROLE_PREFIX[roleId] || dynamicPrefix || 'user';

    useEffect(() => {
        let isMounted = true;
        const fetchPermissions = async () => {
            try {
                // If Admin, grant all paths immediately
                if (roleId === ROLES.ADMIN) {
                    if (isMounted) {
                        setDynamicPaths(Object.keys(routeConfig));
                        setLoading(false);
                    }
                    return;
                }

                // Fetch permitted navigation for this user's dynamic role
                const myNav = await getMyNavigation();
                if (isMounted && Array.isArray(myNav)) {
                    const paths: string[] = [];
                    myNav.forEach((item: Menu) => {
                        if (item.path) {
                            paths.push(item.path.startsWith('/') ? item.path : `/${item.path}`);
                        }
                    });
                    setDynamicPaths(paths);
                }
            } catch (err) {
                console.warn("[DynamicRoutes] Failed to fetch dynamic navigation, falling back to static:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchPermissions();
        return () => { isMounted = false; };
    }, [roleId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-900/50 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Merge static baseline permissions with dynamic database menu permissions
    const staticAllowed = ROLE_PERMISSIONS[roleId] || [];
    const allowedPaths = new Set<string>([...staticAllowed, ...dynamicPaths]);

    // Admin always gets everything in routeConfig
    if (roleId === ROLES.ADMIN) {
        Object.keys(routeConfig).forEach(p => allowedPaths.add(p));
        allowedPaths.add('/dashboard/overview');
        allowedPaths.add('/dashboard/analytics');
    }

    // Always ensure dashboard overview is allowed
    allowedPaths.add('/dashboard/overview');

    // Always ensure sub-routes are accessible if parent is allowed
    if (allowedPaths.has('/users/all')) {
        allowedPaths.add('/users/edit/:userId');
        allowedPaths.add('/users/add');
    }
    if (allowedPaths.has('/services')) {
        allowedPaths.add('/services/categories');
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

            {/* Universal Booking & Services routes for ALL authenticated roles */}
            <Route path={`/${rolePrefix}/services/book`} element={roleId === ROLES.CUSTOMER ? <CustomerServicesPage /> : <ServicesPage />} />
            <Route path={`/${rolePrefix}/services/book/:serviceId`} element={<ServiceBookingPage />} />
            <Route path={`/${rolePrefix}/services/:id`} element={<ServiceDetailsPage />} />
            <Route path={`/${rolePrefix}/services/details/:id`} element={<ServiceDetailsPage />} />

            {/* Availability Route for Admin, Manager, and roles with permission */}
            {(roleId === ROLES.ADMIN || roleId === ROLES.MANAGER || allowedPaths.has('/services/availability')) && (
                <Route path={`/${rolePrefix}/services/availability`} element={<AvailabilityManagementPage />} />
            )}

            {/* Edit Service Route for Admin and Manager */}
            {(roleId === ROLES.ADMIN || roleId === ROLES.MANAGER) && (
                <Route path={`/${rolePrefix}/services/edit/:serviceId`} element={<EditServicePage />} />
            )}

            {/* Universal Tracking routes */}
            <Route path={`/${rolePrefix}/track-booking`} element={<TrackMyBooking />} />
            <Route path={`/${rolePrefix}/track-booking/:referenceNumber`} element={<TrackMyBooking />} />
            <Route path={`/${rolePrefix}/queues/track`} element={<QueueTrackingPage />} />
            <Route path={`/${rolePrefix}/queues/track/:referenceNumber`} element={<QueueTrackingPage />} />

            {/* Universal Rating routes */}
            <Route path={`/${rolePrefix}/rate-services`} element={<RateServicePage />} />
            <Route path={`/${rolePrefix}/rate-services/:id`} element={<RateServicePage />} />
            <Route path={`/${rolePrefix}/rate-service/:id`} element={<RateServicePage />} />

            {/* Customer services route */}
            <Route path={`/${rolePrefix}/customer/services`} element={<CustomerServicesPage />} />

            {/* Service submission */}
            {allowedPaths.has('/service-submission') && (
                <Route path={`/${rolePrefix}/service-submission`} element={<ServiceSubmissionPage />} />
            )}

            {/* Services sub-routes with role prefix */}
            {allowedPaths.has('/services') && (
                <Route path={`/${rolePrefix}/services/*`} element={
                    <Routes>
                        <Route index element={<ServicesPage />} />
                        <Route path="review" element={allowedPaths.has('/services/review') ? <ReviewBookingsPage /> : <Navigate to={`/${rolePrefix}/services`} replace />} />
                        <Route path="queue"  element={allowedPaths.has('/services/queue')  ? <QueueManagementPage /> : <Navigate to={`/${rolePrefix}/services`} replace />} />
                        <Route path="categories" element={allowedPaths.has('/services/categories') ? <ServiceCategoriesPage /> : <Navigate to={`/${rolePrefix}/services`} replace />} />
                        <Route path="availability" element={allowedPaths.has('/services/availability') ? <AvailabilityManagementPage /> : <Navigate to={`/${rolePrefix}/services`} replace />} />
                        <Route path="book" element={roleId === ROLES.CUSTOMER ? <CustomerServicesPage /> : <ServicesPage />} />
                        <Route path="book/:serviceId" element={<ServiceBookingPage />} />
                        <Route path="edit/:serviceId" element={<EditServicePage />} />
                        <Route path=":id"    element={<ServiceDetailsPage />} />
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
                        <Route path="permissions" element={allowedPaths.has('/users/permissions') ? <PermissionsManagementPage /> : <Navigate to={`/${rolePrefix}/users/all`} replace />} />
                        <Route path="*" element={<Navigate to={`/${rolePrefix}/users/all`} replace />} />
                    </Routes>
                } />
            )}

            {/* Direct Permissions Route */}
            {allowedPaths.has('/permissions') && (
                <Route path={`/${rolePrefix}/permissions`} element={<PermissionsManagementPage />} />
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
