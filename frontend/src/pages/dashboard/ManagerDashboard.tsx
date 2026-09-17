import React from 'react';
import DashboardOverview from './DashboardOverview';

/**
 * Manager Dashboard
 * Re-uses DashboardOverview as managers have access to all metrics
 */
const ManagerDashboard: React.FC = () => {
  return <DashboardOverview />;
};

export default ManagerDashboard;
