import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import StandaloneRouter from './components/StandaloneRouter';
import { initializeTheme } from './services/themeService';

const AppStandalone: React.FC = () => {
  // Initialize theme on mount
  React.useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <BrowserRouter basename="/">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StandaloneRouter />
      </div>
    </BrowserRouter>
  );
};

export default AppStandalone;
