import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { initializeTheme } from './services/themeService';
import { useTranslation } from 'react-i18next';

// Auth Context
import { AuthProvider, useAuth } from './components/Auth/AuthContext';

// Layout Components
import MainLayout from './layouts/MainLayout';

// Login & Public Pages
import LoginPage from './components/demo components/login';
import DynamicRoutes from './components/DynamicRoutes';
import StandaloneRouter from './components/StandaloneRouter';
import { ComplaintResponsePage, ResponseComplaintPage } from './pages/complaints/ComplaintResponsePage';

// Loading Component
const LoadingIndicator: React.FC = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    </div>
);

// Helper: Resolve role prefix for currently authenticated user
const getRolePrefixFromUser = (user: any): string => {
    if (!user) return 'customer';
    const roleId = Number(user.role_id);
    if (roleId === 1) return 'admin';
    if (roleId === 2) return 'barber';
    if (roleId === 3) return 'customer';
    if (roleId === 4) return 'manager';
    if (roleId === 5) return 'receptionist';

    const roleName = user.role_name?.toLowerCase() || '';
    if (roleName.includes('admin')) return 'admin';
    if (roleName.includes('barber')) return 'barber';
    if (roleName.includes('customer')) return 'customer';
    if (roleName.includes('manager')) return 'manager';
    if (roleName.includes('receptionist')) return 'receptionist';

    return 'customer';
};

// Component to redirect un-prefixed paths to role-prefixed paths
const RoleRedirect: React.FC<{ to: (rolePrefix: string, params: Record<string, string | undefined>) => string }> = ({ to }) => {
    const { user } = useAuth();
    const params = useParams();
    const rolePrefix = getRolePrefixFromUser(user);
    return <Navigate to={to(rolePrefix, params)} replace />;
};

// AppContent Component (Handles auth state and renders routes/layout)
const AppContent: React.FC = () => {
    const { i18n } = useTranslation();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [settingsLoading, setSettingsLoading] = useState(true);

    // Sync HTML lang attribute with current language
    useEffect(() => {
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    // Initialize global aesthetic settings from the database & localStorage
    useEffect(() => {
        const initializeSystemSettings = async () => {
            try {
                await initializeTheme(isAuthenticated);
            } catch (err) {
                console.error("Non-critical: Global appearance sync failed", err);
            } finally {
                setSettingsLoading(false);
            }
        };

        initializeSystemSettings();
    }, [isAuthenticated]);

    if (authLoading || settingsLoading) {
        return <LoadingIndicator />;
    }

    return (
        <>
            {isAuthenticated ? (
                <MainLayout>
                    <Routes>
                        {/* Un-prefixed redirects to role-prefixed equivalents */}
                        <Route path="/panal" element={<RoleRedirect to={(p) => `/${p}/dashboard/overview`} />} />
                        <Route path="/customer/dashboard" element={<RoleRedirect to={(p) => `/${p}/dashboard/overview`} />} />
                        <Route path="/customer/dashboard/overview" element={<RoleRedirect to={(p) => `/${p}/dashboard/overview`} />} />
                        <Route path="/dashboard/overview" element={<RoleRedirect to={(p) => `/${p}/dashboard/overview`} />} />
                        <Route path="/dashboard/analytics" element={<RoleRedirect to={(p) => `/${p}/dashboard/analytics`} />} />

                        <Route path="/customer/services" element={<RoleRedirect to={(p) => `/${p}/customer/services`} />} />
                        <Route path="/service-submission" element={<RoleRedirect to={(p) => `/${p}/service-submission`} />} />

                        <Route path="/services" element={<RoleRedirect to={(p) => `/${p}/services`} />} />
                        <Route path="/services/:id" element={<RoleRedirect to={(p, params) => `/${p}/services/${params.id}`} />} />
                        <Route path="/services/details/:id" element={<RoleRedirect to={(p, params) => `/${p}/services/${params.id}`} />} />
                        <Route path="/services/book" element={<RoleRedirect to={(p) => `/${p}/services/book`} />} />
                        <Route path="/services/book/:serviceId" element={<RoleRedirect to={(p, params) => `/${p}/services/book/${params.serviceId}`} />} />
                        <Route path="/services/edit/:serviceId" element={<RoleRedirect to={(p, params) => `/${p}/services/edit/${params.serviceId}`} />} />
                        <Route path="/services/availability" element={<RoleRedirect to={(p) => `/${p}/services/availability`} />} />
                        <Route path="/services/queue" element={<RoleRedirect to={(p) => `/${p}/services/queue`} />} />
                        <Route path="/services/review" element={<RoleRedirect to={(p) => `/${p}/services/review`} />} />
                        <Route path="/services/categories" element={<RoleRedirect to={(p) => `/${p}/services/categories`} />} />
                        <Route path="/categories" element={<RoleRedirect to={(p) => `/${p}/categories`} />} />

                        <Route path="/users" element={<RoleRedirect to={(p) => `/${p}/users/all`} />} />
                        <Route path="/users/all" element={<RoleRedirect to={(p) => `/${p}/users/all`} />} />
                        <Route path="/users/add" element={<RoleRedirect to={(p) => `/${p}/users/add`} />} />
                        <Route path="/users/edit/:userId" element={<RoleRedirect to={(p, params) => `/${p}/users/edit/${params.userId}`} />} />
                        <Route path="/users/manage-employees" element={<RoleRedirect to={(p) => `/${p}/users/manage-employees`} />} />
                        <Route path="/users/roles" element={<RoleRedirect to={(p) => `/${p}/users/roles`} />} />
                        <Route path="/users/permissions" element={<RoleRedirect to={(p) => `/${p}/users/permissions`} />} />
                        <Route path="/permissions" element={<RoleRedirect to={(p) => `/${p}/permissions`} />} />

                        <Route path="/rate-services" element={<RoleRedirect to={(p) => `/${p}/rate-services`} />} />
                        <Route path="/rate-services/:id" element={<RoleRedirect to={(p, params) => `/${p}/rate-service/${params.id}`} />} />
                        <Route path="/rate-service/:id" element={<RoleRedirect to={(p, params) => `/${p}/rate-service/${params.id}`} />} />

                        <Route path="/queues/track" element={<RoleRedirect to={(p) => `/${p}/queues/track`} />} />
                        <Route path="/queues/track/:referenceNumber" element={<RoleRedirect to={(p, params) => `/${p}/queues/track/${params.referenceNumber}`} />} />
                        <Route path="/track-booking" element={<RoleRedirect to={(p) => `/${p}/track-booking`} />} />
                        <Route path="/track-booking/:referenceNumber" element={<RoleRedirect to={(p, params) => `/${p}/track-booking/${params.referenceNumber}`} />} />

                        {/* All role-prefixed routes handled by DynamicRoutes */}
                        <Route path="/*" element={<DynamicRoutes />} />
                    </Routes>
                </MainLayout>
            ) : (
                <Routes>
                    <Route path="/panal" element={<LoginPage />} />
                    <Route path="/respond" element={<ResponseComplaintPage />} />
                    <Route path="/complaints/respond/:token" element={<ComplaintResponsePage />} />
                    <Route path="/public/respond/:token" element={<ComplaintResponsePage />} />
                    <Route path="/*" element={<StandaloneRouter />} />
                </Routes>
            )}
        </>
    );
};

// Main App Component with Providers
const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter basename="/">
                <AppContent />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
