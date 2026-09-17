import React from 'react';
import WeeklySalesWidget from './nav/WeeklySalesWidget';

// Import demo components using PascalCase
import Demo from './demo components/demo';
import Table1 from './demo components/table1';
import Form1 from './demo components/form1';
import BarChart from './demo components/barchart';
import LineChart from './demo components/linechart';
import DoughnutChart from './demo components/DoughnutChart';
import PieChart from './demo components/PieChart';
import Alert from './demo components/alert';

const TotalOrderCard: React.FC = () => (
  <div className="card h-100 shadow-sm border-0">
    <div className="card-body p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="text-muted mb-0 fw-semibold">Total Orders</h6>
        <span className="badge bg-success-subtle text-success">+14.2%</span>
      </div>
      <h3 className="fw-bold mb-1">1,248</h3>
      <p className="text-muted small mb-0">Compared to last month</p>
    </div>
  </div>
);

const MarketShareCard: React.FC = () => (
  <div className="card h-100 shadow-sm border-0">
    <div className="card-body p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="text-muted mb-0 fw-semibold">Market Share</h6>
        <span className="badge bg-primary-subtle text-primary">Active</span>
      </div>
      <h3 className="fw-bold mb-1">42.8%</h3>
      <p className="text-muted small mb-0">Top performing region</p>
    </div>
  </div>
);

const WeatherCard: React.FC = () => (
  <div className="card h-100 shadow-sm border-0">
    <div className="card-body p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="text-muted mb-0 fw-semibold">Daily Appointments</h6>
        <span className="badge bg-info-subtle text-info">Today</span>
      </div>
      <h3 className="fw-bold mb-1">24 Bookings</h3>
      <p className="text-muted small mb-0">8 pending confirmations</p>
    </div>
  </div>
);

// --- Component: DashboardWidgets ---
const DashboardWidgets: React.FC = () => {
  return (
    <>
      {/* First row: Top Widgets */}
      <div className="row g-3 mb-3">
        <div className="col-md-6 col-xxl-3">
          <WeeklySalesWidget />
        </div>
        <div className="col-md-6 col-xxl-3">
          <TotalOrderCard />
        </div>
        <div className="col-md-6 col-xxl-3">
          <MarketShareCard />
        </div>
        <div className="col-md-6 col-xxl-3">
          <WeatherCard />
        </div>
      </div>

      {/* Second row: Demo Table and Placeholder */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <Table1 />
        </div>
        <div className="col-md-6">
          <Demo />
        </div>
      </div>

      {/* Third row: Form and Alert */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <Form1 />
        </div>
        <div className="col-md-6">
          <Alert
            type="info"
            message="This is an example alert message."
            dismissible
          />
        </div>
      </div>

      {/* Fourth row: Charts (Bar and Line) */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <BarChart />
        </div>
        <div className="col-md-6">
          <LineChart />
        </div>
      </div>

      {/* Fifth row: Charts (Doughnut and Pie) */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <DoughnutChart />
        </div>
        <div className="col-md-6">
          <PieChart />
        </div>
      </div>
    </>
  );
};

export default DashboardWidgets;