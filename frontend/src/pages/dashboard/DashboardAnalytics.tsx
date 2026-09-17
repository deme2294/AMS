import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, 
  ArcElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { analyticsApi, ServiceStats, DailyBooking, MonthlyBooking, CategoryBreakdown, ServiceBreakdown, BarberPerformance, StatusDistribution, RevenueStats } from '../../services/serviceService';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, 
  ArcElement, Title, Tooltip, Legend, Filler
);

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const DashboardAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Service Analytics State
  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null);
  const [dailyBookings, setDailyBookings] = useState<DailyBooking[]>([]);
  const [monthlyBookings, setMonthlyBookings] = useState<MonthlyBooking[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [barberPerformance, setBarberPerformance] = useState<BarberPerformance[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'monthly' | 'services' | 'barbers' | 'revenue'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        statsRes, 
        dailyRes, 
        monthlyRes, 
        categoryRes, 
        serviceRes, 
        barberRes, 
        statusRes,
        revenueRes
      ] = await Promise.all([
        analyticsApi.getServiceStats(),
        analyticsApi.getDailyBookings(30),
        analyticsApi.getMonthlyBookings(12),
        analyticsApi.getCategoryBreakdown(),
        analyticsApi.getServiceBreakdown(),
        analyticsApi.getBarberPerformance(),
        analyticsApi.getStatusDistribution(),
        analyticsApi.getRevenueStats()
      ]);

      if (statsRes.success) setServiceStats(statsRes.data);
      if (dailyRes.success) setDailyBookings(dailyRes.data);
      if (monthlyRes.success) setMonthlyBookings(monthlyRes.data);
      if (categoryRes.success) setCategoryBreakdown(categoryRes.data);
      if (serviceRes.success) setServiceBreakdown(serviceRes.data);
      if (barberRes.success) setBarberPerformance(barberRes.data);
      if (statusRes.success) setStatusDistribution(statusRes.data);
      if (revenueRes.success) setRevenueStats(revenueRes.data);

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Analytics</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const dailyChartData = {
    labels: dailyBookings.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      { label: 'Total', data: dailyBookings.map(d => d.total), backgroundColor: '#6366f1' },
      { label: 'Approved', data: dailyBookings.map(d => d.approved), backgroundColor: '#10b981' },
      { label: 'Pending', data: dailyBookings.map(d => d.pending), backgroundColor: '#f59e0b' },
      { label: 'Completed', data: dailyBookings.map(d => d.completed), backgroundColor: '#3b82f6' }
    ]
  };

  const monthlyChartData = {
    labels: monthlyBookings.map(m => m.month_name),
    datasets: [
      { label: 'Total', data: monthlyBookings.map(m => m.total), borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.4 },
      { label: 'Approved', data: monthlyBookings.map(m => m.approved), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 },
      { label: 'Completed', data: monthlyBookings.map(m => m.completed), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true, tension: 0.4 }
    ]
  };

  const statusChartData = {
    labels: statusDistribution?.approval_status.map(s => s.status) || [],
    datasets: [{
      data: statusDistribution?.approval_status.map(s => s.count) || [],
      backgroundColor: COLORS
    }]
  };

  const categoryChartData = {
    labels: categoryBreakdown.map(c => c.category || 'Unknown'),
    datasets: [{
      label: 'Bookings',
      data: categoryBreakdown.map(c => c.total_bookings || 0),
      backgroundColor: COLORS
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Service bookings, revenue, and performance analytics</p>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm border border-gray-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'daily', label: 'Daily Trends' },
          { id: 'monthly', label: 'Monthly Trends' },
          { id: 'services', label: 'Services' },
          { id: 'barbers', label: 'Barbers' },
          { id: 'revenue', label: 'Revenue' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{serviceStats?.total || 0}</p>
              <p className="text-sm text-green-600 mt-2">All time</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{serviceStats?.thisMonth || 0}</p>
              <p className="text-sm text-blue-600 mt-2">Bookings</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{serviceStats?.completed || 0}</p>
              <p className="text-sm text-emerald-600 mt-2">All time</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">In Queue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{serviceStats?.inQueue || 0}</p>
              <p className="text-sm text-amber-600 mt-2">Currently waiting</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Status Distribution</h3>
              <div className="h-64">
                <Pie data={statusChartData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Bookings (Last 6 Months)</h3>
              <div className="h-64">
                <Line data={{
                  labels: monthlyBookings.slice(-6).map(m => m.month_name),
                  datasets: [
                    { label: 'Total', data: monthlyBookings.slice(-6).map(m => m.total), borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.4 },
                    { label: 'Completed', data: monthlyBookings.slice(-6).map(m => m.completed), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 }
                  ]
                }} options={chartOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Daily Trends Tab */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Bookings (Last 30 Days)</h3>
          <div className="h-96">
            <Bar data={dailyChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Monthly Trends Tab */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Bookings (Last 12 Months)</h3>
          <div className="h-96">
            <Line data={monthlyChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Bookings by Category</h3>
            <div className="h-80">
              <Doughnut data={categoryChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Services</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {serviceBreakdown.slice(0, 10).map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{service.service}</p>
                      <p className="text-sm text-gray-500">{service.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{service.total_bookings}</p>
                    <p className="text-sm text-gray-500">ETB {Number(service.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Barbers Tab */}
      {activeTab === 'barbers' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Barber Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barberPerformance.map((barber, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {barber.barber_name?.charAt(0) || 'B'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{barber.barber_name}</p>
                    <p className="text-sm text-gray-500">Barber</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{barber.total_bookings}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{barber.completed_bookings}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-500">Avg. Service Price</p>
                  <p className="text-xl font-bold text-indigo-600">ETB {Number(barber.avg_service_price || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <p className="text-emerald-100 text-sm font-medium">Today's Revenue</p>
              <p className="text-3xl font-bold mt-1">ETB {revenueStats?.today?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <p className="text-blue-100 text-sm font-medium">This Week</p>
              <p className="text-3xl font-bold mt-1">ETB {revenueStats?.thisWeek?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <p className="text-purple-100 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold mt-1">ETB {revenueStats?.thisMonth?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
              <p className="text-amber-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">ETB {revenueStats?.total?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trend (Last 6 Months)</h3>
            <div className="h-80">
              <Bar data={{
                labels: monthlyBookings.slice(-6).map(m => m.month_name),
                datasets: [{
                  label: 'Completed Bookings Revenue',
                  data: monthlyBookings.slice(-6).map(m => m.completed * 500), // Approximate revenue
                  backgroundColor: '#10b981'
                }]
              }} options={chartOptions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardAnalytics;