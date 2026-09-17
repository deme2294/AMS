import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getSystemSettings } from './services/apiService';
import { useTranslation } from 'react-i18next';

// Auth Context
import { AuthProvider, useAuth } from './components/Auth/AuthContext';

// Layout Components
import MainLayout from './layouts/MainLayout';

// Login Page
import LoginPage from './components/demo components/login';
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import ServiceSubmissionPage from './pages/standalone/ServiceSubmissionPage';
import ServiceBookingPage from './pages/standalone/ServiceBookingPage';
import CustomerServicesPage from './pages/services/CustomerServicesPage';
import TrackMyBooking from './pages/standalone/TrackMyBooking';

// Dynamic Routes Component
import DynamicRoutes from './components/DynamicRoutes';
import StandaloneRouter from './components/StandaloneRouter';
import QueueTrackingPage from './pages/dashboard/QueueTracking';
import RateServicePage from './pages/standalone/RateServicePage';
import EditServicePage from './pages/services/EditServicePage';
import AvailabilityManagementPage from './pages/services/AvailabilityManagementPage';
import { ComplaintResponsePage, ResponseComplaintPage } from './pages/complaints/ComplaintResponsePage';



// Loading Component

const LoadingIndicator: React.FC = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    </div>
);

// AppContent Component (Handles auth state and renders routes/layout)
const AppContent: React.FC = () => {
    const { i18n } = useTranslation();
    const { isAuthenticated, user, isLoading: authLoading } = useAuth();
    const [settingsLoading, setSettingsLoading] = useState(true);

    const isCustomer = user && (user.role_name?.toLowerCase() === 'customer' || Number(user.role_id) === 5);
    const isBarber   = user && Number(user.role_id) === 3;
    const isStaff    = user && [1, 2, 3, 4].includes(Number(user.role_id));


    // Sync HTML lang attribute with current language
    useEffect(() => {
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    // Initialize global aesthetic settings from the database
    useEffect(() => {
        const initializeSystemSettings = async () => {
            try {
                const localMode = localStorage.getItem('lms_theme') || 'system';
                const root = document.documentElement;
                
                if (localMode === 'dark' || (localMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    root.classList.add('dark');
                }

                const sysSettings = await getSystemSettings();
                if (sysSettings) {
                    const dbMode = sysSettings.themeMode || 'system';
                    
                    if (sysSettings.primaryColor) localStorage.setItem('lms_color', sysSettings.primaryColor);
                    if (sysSettings.density) localStorage.setItem('lms_density', sysSettings.density);
                    if (sysSettings.fontFamily) localStorage.setItem('lms_font', sysSettings.fontFamily);
                    if (sysSettings.themeMode) localStorage.setItem('lms_theme', sysSettings.themeMode);
                    if (sysSettings.logoPreview) localStorage.setItem('lms_logo_preview', sysSettings.logoPreview);

                    if (dbMode === 'dark' || (dbMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                        root.classList.add('dark');
                    } else {
                        root.classList.remove('dark');
                    }
                }
            } catch (err) {
                console.error("Non-critical: Global appearance sync failed", err);
            } finally {
                setSettingsLoading(false);
            }
        };

        initializeSystemSettings();
    }, []);

    if (authLoading || settingsLoading) {
        return <LoadingIndicator />;
    }

    return (
        <>
            {isAuthenticated ? (
                <MainLayout>
                    <Routes>
                        <Route path="/panal" element={<Navigate to="/dashboard/overview" replace />} />
                        <Route path="/dashboard/overview/*" element={isCustomer ? <CustomerDashboard /> : <DynamicRoutes />} />
                        <Route path="/customer/services" element={<CustomerServicesPage />} />
                        <Route path="/service-submission" element={<ServiceSubmissionPage />} />
                        <Route path="/services/book/:serviceId" element={<ServiceBookingPage />} />
                        <Route path="/services/edit/:serviceId" element={<EditServicePage />} />
                        <Route path="/services/availability" element={<AvailabilityManagementPage />} />

                        <Route path="/rate-services" element={<RateServicePage />} />

                        <Route path="/rate-service/:id" element={<RateServicePage />} />

                        <Route path="/queues/track/:referenceNumber" element={<QueueTrackingPage />} />
                        <Route path="/queues/track" element={<QueueTrackingPage />} />
                        <Route path="/track-booking" element={<TrackMyBooking />} />
                        <Route path="/track-booking/:referenceNumber" element={<TrackMyBooking />} />
                        <Route path="*" element={<DynamicRoutes />} />
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
