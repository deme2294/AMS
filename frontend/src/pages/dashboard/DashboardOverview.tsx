import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../../services/apiService';
import { analyticsApi, ServiceStats, DailyBooking, MonthlyBooking } from '../../services/serviceService';
import { useAuth } from '../../components/Auth/AuthContext';

interface DashboardStats {
  totalUsers: number;
  activeSubscribers: number;
  totalPosts: number;
  totalComments: number;
  pendingComments: number;
  pendingInquiries: number;
  newMessages: number;
}

// Service Booking Stats Interface
interface ServiceBookingStats extends ServiceStats {
  recentBookings: any[];
  dailyBookings: DailyBooking[];
}

interface ComplaintStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
  approved?: number;
  assigned?: number;
  high_priority?: number;
  medium_priority?: number;
  low_priority?: number;
}

interface ComplaintAnalytics {
  total: number;
  statusBreakdown: Array<{ status: string; count: number }>;
  priorityBreakdown: Array<{ priority: string; count: number }>;
  typeBreakdown: Array<{ complaint_type: string; count: number }>;
  categoryBreakdown: Array<{ name: string; count: number }>;
  recentComplaints: Array<{
    complaint_id: number;
    title: string;
    status: string;
    priority: string;
    created_at: string;
  }>;
}

const DashboardOverview: React.FC = () => {
  const { user, isAdmin, isManager, isBarber, isReceptionist, isCustomer } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [complaintAnalytics, setComplaintAnalytics] = useState<ComplaintAnalytics | null>(null);
  const [serviceStats, setServiceStats] = useState<ServiceBookingStats | null>(null);
  const [dashboardSlots, setDashboardSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Determine which data to load based on role
  const shouldLoadGeneralStats = isAdmin || isManager;
  const shouldLoadServiceStats = isAdmin || isManager || isBarber || isReceptionist;

  // Get role prefix for navigation
  const getRolePrefix = () => {
    if (isAdmin) return 'admin';
    if (isManager) return 'manager';
    if (isBarber) return 'barber';
    if (isReceptionist) return 'receptionist';
    if (isCustomer) return 'customer';
    return 'user';
  };
  const rolePrefix = getRolePrefix();

  useEffect(() => {
    if (user) {
      console.log('[Dashboard] Loading data for user:', user.name, 'Role:', user.role_name || `ID ${user.role_id}`);
      loadDashboardData();
    } else {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user]);

    const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const promises: Promise<any>[] = [];

      // General stats (Admin/Manager only)
      if (shouldLoadGeneralStats) {
        promises.push(
          request<{ success: boolean; data: DashboardStats }>('/analytics/stats', { method: 'GET' })
            .catch(err => {
              console.warn('Failed to load general stats:', err.message);
              return null;
            })
        );
        promises.push(
          request<{ success: boolean; data: ComplaintAnalytics }>('/complaints/analytics', { method: 'GET' })
            .catch(err => {
              console.warn('Failed to load complaint analytics:', err.message);
              return null;
            })
        );
      } else {
        promises.push(null, null);
      }

      // Availability slots (all roles)
      promises.push(
        request<{ success: boolean; data: any[] }>('/availability', { method: 'GET' })
          .catch(err => {
            console.warn('Failed to load availability slots:', err.message);
            return null;
          })
      );

      // Service stats (Admin/Manager/Barber/Receptionist)
      if (shouldLoadServiceStats) {
        promises.push(
          analyticsApi.getServiceStats().catch(err => {
            console.warn('Failed to load service stats:', err.message);
            return null;
          })
        );
        promises.push(
          analyticsApi.getDailyBookings(7).catch(err => {
            console.warn('Failed to load daily bookings:', err.message);
            return null;
          })
        );
        promises.push(
          analyticsApi.getRecentBookings(5).catch(err => {
            console.warn('Failed to load recent bookings:', err.message);
            return null;
          })
        );
      } else {
        promises.push(null, null, null);
      }

      const [dashboardRes, analyticsRes, slotsRes, serviceStatsRes, dailyBookingsRes, recentBookingsRes] = await Promise.all(promises);

      if (dashboardRes?.success) {
        setDashboardStats(dashboardRes.data);
      }

      if (analyticsRes?.success) {
        // Map API response structure to expected interface
        const data = analyticsRes.data;
        setComplaintAnalytics({
          total: data.statusDistribution?.reduce((sum: number, s: any) => sum + s.count, 0) || 0,
          statusBreakdown: data.statusDistribution || [],
          priorityBreakdown: data.priorityDistribution || [],
          typeBreakdown: data.typeDistribution || [],
          categoryBreakdown: [],
          recentComplaints: data.recentComplaints || []
        });
      }

      if (slotsRes?.success && slotsRes.data) {
        setDashboardSlots(slotsRes.data);
      }

      // Set service stats
      if (serviceStatsRes?.success) {
        setServiceStats({
          ...serviceStatsRes.data,
          dailyBookings: dailyBookingsRes?.data || [],
          recentBookings: recentBookingsRes?.data || []
        });
      }

      setLastRefresh(new Date());

    } catch (error: any) {
      console.error('Dashboard data load error:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleExport = () => {
    const data = {
      dashboardStats,
      complaintAnalytics,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-4"></div>
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="mb-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded animate-pulse w-full"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <svg className="h-16 w-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Unable to Load Dashboard</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => loadDashboardData()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600">
              {isAdmin && 'Admin Dashboard - Full system access'}
              {isManager && 'Manager Dashboard - System overview and analytics'}
              {isBarber && 'Barber Dashboard - Your services and queue'}
              {isReceptionist && 'Receptionist Dashboard - Customer service operations'}
              {isCustomer && 'Customer Dashboard - Your bookings and services'}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm text-gray-700">Refresh</span>
            </button>
            {(isAdmin || isManager) && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-sm text-gray-700">Export</span>
            </button>
            )}
          </div>
        </div>
        {lastRefresh && (
          <p className="text-xs text-gray-500">Last updated: {lastRefresh.toLocaleString()}</p>
        )}
      </div>

      {/* Quick Actions - Role Based */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Admin/Manager/Receptionist: Review Bookings */}
          {(isAdmin || isManager || isReceptionist) && (
            <Link to={`/${rolePrefix}/services/review`} className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all group">
              <div className="bg-blue-100 rounded-full p-3 mb-2 group-hover:bg-blue-200 transition-colors">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Review Bookings</span>
            </Link>
          )}

          {/* Admin/Manager/Receptionist/Barber: Manage Queue */}
          {(isAdmin || isManager || isReceptionist || isBarber) && (
            <Link to={`/${rolePrefix}/services/queue`} className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-all group">
              <div className="bg-green-100 rounded-full p-3 mb-2 group-hover:bg-green-200 transition-colors">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Manage Queue</span>
            </Link>
          )}

          {/* All: View Services */}
          <Link to={`/${rolePrefix}/services`} className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-all group">
            <div className="bg-purple-100 rounded-full p-3 mb-2 group-hover:bg-purple-200 transition-colors">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Services</span>
          </Link>

          {/* Admin/Manager: View Analytics */}
          {(isAdmin || isManager) && (
            <Link to={`/${rolePrefix}/dashboard/analytics`} className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-all group">
              <div className="bg-orange-100 rounded-full p-3 mb-2 group-hover:bg-orange-200 transition-colors">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Analytics</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Statistics Cards - Admin/Manager Only */}
      {shouldLoadGeneralStats && dashboardStats && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Users Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold mt-1">{dashboardStats?.totalUsers || 0}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-100">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>+12% from last month</span>
          </div>
        </div>

        {/* Subscribers Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Subscribers</p>
              <p className="text-3xl font-bold mt-1">{dashboardStats?.activeSubscribers || 0}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-100">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>+8% from last month</span>
          </div>
        </div>

        {/* Complaints Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Complaints</p>
              <p className="text-3xl font-bold mt-1">{complaintAnalytics?.total || 0}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-orange-100">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            <span>-5% from last month</span>
          </div>
        </div>

        {/* Pending Complaints Card */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending Complaints</p>
              <p className="text-3xl font-bold mt-1">
                {complaintAnalytics?.statusBreakdown?.find(s => s.status === 'Pending')?.count || 0}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-yellow-100">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Requires attention</span>
          </div>
        </div>
      </div>
      )}

      {/* Service Booking Statistics Cards */}
      {shouldLoadServiceStats && serviceStats && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Service Bookings Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Bookings */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Bookings</p>
                  <p className="text-3xl font-bold mt-1">{serviceStats.total || 0}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-indigo-100">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>All time</span>
              </div>
            </div>

            {/* Today's Bookings */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Today's Bookings</p>
                  <p className="text-3xl font-bold mt-1">{serviceStats.today || 0}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-100">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Today</span>
              </div>
            </div>

            {/* Pending Approval */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Pending Approval</p>
                  <p className="text-3xl font-bold mt-1">{serviceStats.pending || 0}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-amber-100">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Requires review</span>
              </div>
            </div>

            {/* In Queue */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">In Queue</p>
                  <p className="text-3xl font-bold mt-1">{serviceStats.inQueue || 0}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-teal-100">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Currently waiting</span>
              </div>
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* This Week */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{serviceStats.thisWeek || 0}</p>
                </div>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{serviceStats.thisMonth || 0}</p>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{serviceStats.completed || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaints Status Distribution - Admin/Manager Only */}
      {shouldLoadGeneralStats && complaintAnalytics && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Complaints Status Distribution
          </h3>
          {complaintAnalytics ? (
            <div className="space-y-5">
              {complaintAnalytics.statusBreakdown.map((status) => {
                const colors: { [key: string]: { bg: string; text: string } } = {
                  'Pending': { bg: 'bg-yellow-500', text: 'text-yellow-600' },
                  'In Progress': { bg: 'bg-blue-500', text: 'text-blue-600' },
                  'Resolved': { bg: 'bg-green-500', text: 'text-green-600' },
                  'Closed': { bg: 'bg-gray-500', text: 'text-gray-600' },
                  'Approved': { bg: 'bg-purple-500', text: 'text-purple-600' },
                  'Assigned': { bg: 'bg-indigo-500', text: 'text-indigo-600' }
                };
                const color = colors[status.status] || { bg: 'bg-gray-400', text: 'text-gray-600' };
                const percentage = complaintAnalytics.total > 0 ? ((status.count / complaintAnalytics.total) * 100).toFixed(1) : 0;
                return (
                  <div key={status.status}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">{status.status}</span>
                      <span className="text-sm font-bold text-gray-900">{status.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`${color.bg} h-3 rounded-full transition-all duration-500 ease-out`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No status data available</div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Complaints by Category
          </h3>
          <div className="space-y-4">
            {complaintAnalytics?.categoryBreakdown?.slice(0, 6).map((category, index) => {
              const maxCount = Math.max(...complaintAnalytics.categoryBreakdown.map(c => c.count));
              const percentage = maxCount > 0 ? ((category.count / maxCount) * 100).toFixed(1) : 0;
              const categoryColors = [
                'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-teal-500', 'bg-cyan-500'
              ];
              const bgColor = categoryColors[index % categoryColors.length];
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 truncate">{category.name}</span>
                    <span className="text-sm font-bold text-gray-900">{category.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`${bgColor} h-3 rounded-full transition-all duration-500 ease-out`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {(!complaintAnalytics?.categoryBreakdown || complaintAnalytics.categoryBreakdown.length === 0) && (
              <div className="text-center py-8 text-gray-500">No category data available</div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Priority and Type Breakdown - Admin/Manager Only */}
      {shouldLoadGeneralStats && complaintAnalytics && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Complaints by Priority
          </h3>
          <div className="space-y-4">
            {complaintAnalytics?.priorityBreakdown?.map((priority) => {
              const colors: { [key: string]: { bg: string; text: string } } = {
                'High': { bg: 'bg-red-500', text: 'text-red-600' },
                'Medium': { bg: 'bg-yellow-500', text: 'text-yellow-600' },
                'Low': { bg: 'bg-green-500', text: 'text-green-600' }
              };
              const color = colors[priority.priority] || { bg: 'bg-gray-400', text: 'text-gray-600' };
              const percentage = complaintAnalytics.total > 0 ? ((priority.count / complaintAnalytics.total) * 100).toFixed(1) : 0;
              return (
                <div key={priority.priority}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">{priority.priority}</span>
                    <span className="text-sm font-bold text-gray-900">{priority.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`${color.bg} h-3 rounded-full transition-all duration-500 ease-out`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {(!complaintAnalytics?.priorityBreakdown || complaintAnalytics.priorityBreakdown.length === 0) && (
              <div className="text-center py-8 text-gray-500">No priority data available</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Complaints by Type
          </h3>
          <div className="space-y-4">
            {complaintAnalytics?.typeBreakdown?.map((type) => {
              const percentage = complaintAnalytics.total > 0 ? ((type.count / complaintAnalytics.total) * 100).toFixed(1) : 0;
              return (
                <div key={type.complaint_type}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">{type.complaint_type}</span>
                    <span className="text-sm font-bold text-gray-900">{type.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-teal-500 h-3 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {(!complaintAnalytics?.typeBreakdown || complaintAnalytics.typeBreakdown.length === 0) && (
              <div className="text-center py-8 text-gray-500">No type data available</div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Recent Complaints */}
      {shouldLoadGeneralStats && complaintAnalytics && (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Complaints
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaintAnalytics?.recentComplaints?.slice(0, 5).map((complaint) => (
                <tr key={complaint.complaint_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{complaint.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      complaint.priority === 'High' ? 'bg-red-100 text-red-800' :
                      complaint.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(complaint.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {(!complaintAnalytics?.recentComplaints || complaintAnalytics.recentComplaints.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No recent complaints</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Availability Slots Overview Widget */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-600 rounded-xl p-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Upcoming Availability Slots</h3>
              <p className="text-sm text-gray-500 mt-0.5">Summary of barber schedules and active slot configurations</p>
            </div>
          </div>
          <Link
            to="/services/availability"
            className="mt-3 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-md hover:shadow-lg font-bold text-sm tracking-tight transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Manage Availability
          </Link>
        </div>

        {dashboardSlots.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h4 className="font-bold text-gray-800 text-base mb-1">No Upcoming Availability Scheduled</h4>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">There are no availability slot configurations active. Click "Manage Availability" above to add new slots.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time Window</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Barber</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-150">
                {dashboardSlots.slice(0, 5).map((slot) => {
                  const formatTime = (timeStr: string, ampmStr?: string) => {
                    if (!timeStr) return '';
                    const parts = timeStr.split(':');
                    const hh = Number(parts[0]);
                    const mm = parts[1] || '00';
                    if (ampmStr) {
                      const h12 = hh % 12 === 0 ? 12 : hh % 12;
                      return `${String(h12).padStart(2, '0')}:${mm} ${ampmStr}`;
                    }
                    const ampm = hh >= 12 ? 'PM' : 'AM';
                    const h12 = hh % 12 === 0 ? 12 : hh % 12;
                    return `${String(h12).padStart(2, '0')}:${mm} ${ampm}`;
                  };

                  const formattedDate = slot.availability_date
                    ? new Date(slot.availability_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={slot.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        {formatTime(slot.start_time, slot.start_time_ampm)} - {formatTime(slot.end_time, slot.end_time_ampm)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {slot.service_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {slot.barber_id ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            {slot.barber_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Global (Any Barber)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                        {slot.max_bookings}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                          slot.slot_status === 'open'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {slot.slot_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Posts</p>
              <p className="text-3xl font-bold mt-1">{dashboardStats?.totalPosts || 0}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6M7 12h6" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm font-medium">Pending Comments</p>
              <p className="text-3xl font-bold mt-1">{dashboardStats?.pendingComments || 0}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">New Messages</p>
              <p className="text-3xl font-bold mt-1">{dashboardStats?.newMessages || 0}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
