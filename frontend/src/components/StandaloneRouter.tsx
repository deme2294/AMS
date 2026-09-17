import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import ServicesListingPage from '../pages/standalone/ServicesListingPage';
import ServiceBookingPage from '../pages/standalone/ServiceBookingPage';
import PublicHomepage from '../pages/standalone/PublicHomepage';
import CustomerRegister from '../pages/standalone/CustomerRegister';
import LoginPage from '../components/demo components/login';
import QueueTrackingPage from '../pages/dashboard/QueueTracking';
import RateServicePage from '../pages/standalone/RateServicePage';

const StandaloneRouter: React.FC = () => {
  return (
    <PublicLayout>
      <Routes>
        {/* Public Homepage - Services Display */}
        <Route path="/" element={<PublicHomepage />} />
        
        {/* Legacy Routes */}
        <Route path="/services" element={<ServicesListingPage />} />
        <Route path="/services/book/:serviceId" element={<ServiceBookingPage />} />
        
         {/* Customer Auth Routes */}
         <Route path="/register" element={<CustomerRegister />} />
         <Route path="/login" element={<LoginPage />} />
        
         {/* Service Rating */}
         <Route path="/rate-services" element={<RateServicePage />} />
         <Route path="/rate-service/:id" element={<RateServicePage />} />
        
        {/* Queue Tracking */}
        <Route path="/queues/track/:referenceNumber" element={<QueueTrackingPage />} />
        <Route path="/queues/track" element={<QueueTrackingPage />} />
      </Routes>
    </PublicLayout>
  );
};

export default StandaloneRouter;
