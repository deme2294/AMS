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
        promises.push(Promise.resolve(null), Promise.resolve(null));
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
        promises.push(Promise.resolve(null), Promise.resolve(null), Promise.resolve(null));
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
          typeBreakdown: (data.typeDistribution || []).map((t: any) => ({
            complaint_type: t.complaint_type || t.type || 'Unknown',
            count: t.count || 0
          })),
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
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {/* Welcome Hero Banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden bg-gradient-to-r from-indigo-900/90 via-slate-900/95 to-slate-900 text-white border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Operations
            </div>
            <h1 className="text-2xl md:text-4xl font-heading font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-2 max-w-xl">
              {isAdmin && 'System Administration & Full Operational Control Center.'}
              {isManager && 'Branch Analytics, Booking Approvals & Queue Overview.'}
              {isBarber && 'Your Service Schedule, Assigned Queue & Performance.'}
              {isReceptionist && 'Customer Reception, Walk-in Check-in & Queue Monitoring.'}
              {isCustomer && 'Your Bookings, Available Barber Slots & Service Reviews.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-md border border-white/10 active:scale-95 transition-all shadow-sm"
            >
              <svg className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            {(isAdmin || isManager) && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export Data</span>
              </button>
            )}
          </div>
        </div>

        {lastRefresh && (
          <p className="text-[11px] text-slate-400 mt-4">
            Last synchronized: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}
      </div>

      {/* Quick Actions - Role Based */}
      <div>
        <h2 className="text-base font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Admin/Manager/Receptionist: Review Bookings */}
          {(isAdmin || isManager || isReceptionist) && (
            <Link to={`/${rolePrefix}/services/review`} className="glass-card-hover p-5 flex flex-col items-center justify-center text-center group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Review Bookings</span>
            </Link>
          )}

          {/* Admin/Manager/Receptionist/Barber: Manage Queue */}
          {(isAdmin || isManager || isReceptionist || isBarber) && (
            <Link to={`/${rolePrefix}/services/queue`} className="glass-card-hover p-5 flex flex-col items-center justify-center text-center group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Live Queue</span>
            </Link>
          )}

          {/* All: View Services */}
          <Link to={`/${rolePrefix}/services`} className="glass-card-hover p-5 flex flex-col items-center justify-center text-center group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">All Services</span>
          </Link>

          {/* Admin/Manager: View Analytics */}
          {(isAdmin || isManager) && (
            <Link to={`/${rolePrefix}/dashboard/analytics`} className="glass-card-hover p-5 flex flex-col items-center justify-center text-center group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Analytics</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Statistics Cards - Admin/Manager Only */}
      {shouldLoadGeneralStats && dashboardStats && (
      <div>
        <h2 className="text-base font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
          Key Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Users Card */}
          <div className="glass-card-hover p-5 relative overflow-hidden border-t-2 border-t-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Users</p>
                <p className="text-3xl font-heading font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">{dashboardStats?.totalUsers || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                +12%
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </div>

          {/* Subscribers Card */}
          <div className="glass-card-hover p-5 relative overflow-hidden border-t-2 border-t-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Subscribers</p>
                <p className="text-3xl font-heading font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">{dashboardStats?.activeSubscribers || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-inner">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                +8%
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </div>

          {/* Complaints Card */}
          <div className="glass-card-hover p-5 relative overflow-hidden border-t-2 border-t-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Complaints</p>
                <p className="text-3xl font-heading font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">{complaintAnalytics?.total || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                -5%
              </span>
              <span className="text-slate-400">reduced issues</span>
            </div>
          </div>

          {/* Pending Complaints Card */}
          <div className="glass-card-hover p-5 relative overflow-hidden border-t-2 border-t-rose-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Issues</p>
                <p className="text-3xl font-heading font-black text-rose-600 dark:text-rose-400 mt-1.5 tracking-tight">
                  {complaintAnalytics?.statusBreakdown?.find(s => s.status === 'Pending')?.count || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="inline-flex items-center text-rose-500 font-semibold gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                Action Needed
              </span>
              <span className="text-slate-400">Needs review</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Service Booking Statistics Cards */}
      {shouldLoadServiceStats && serviceStats && (
        <div className="mb-8">
          <h2 className="text-base font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
            Booking Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Bookings */}
            <div className="glass-card-hover p-5 border-t-2 border-t-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Bookings</p>
                  <p className="text-3xl font-heading font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">{serviceStats.total || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                Lifetime booking records
              </div>
            </div>

            {/* Today's Bookings */}
            <div className="glass-card-hover p-5 border-t-2 border-t-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's Bookings</p>
                  <p className="text-3xl font-heading font-black text-blue-600 dark:text-blue-400 mt-1.5 tracking-tight">{serviceStats.today || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                Scheduled for today
              </div>
            </div>

            {/* Pending Approval */}
            <div className="glass-card-hover p-5 border-t-2 border-t-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Approval</p>
                  <p className="text-3xl font-heading font-black text-amber-600 dark:text-amber-400 mt-1.5 tracking-tight">{serviceStats.pending || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                Awaiting staff confirmation
              </div>
            </div>

            {/* In Queue */}
            <div className="glass-card-hover p-5 border-t-2 border-t-teal-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Currently In Queue</p>
                  <p className="text-3xl font-heading font-black text-teal-600 dark:text-teal-400 mt-1.5 tracking-tight">{serviceStats.inQueue || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                Customers waiting on site
              </div>
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">This Week</p>
                <p className="text-2xl font-heading font-black text-slate-900 dark:text-white mt-0.5">{serviceStats.thisWeek || 0}</p>
              </div>
            </div>

            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">This Month</p>
                <p className="text-2xl font-heading font-black text-slate-900 dark:text-white mt-0.5">{serviceStats.thisMonth || 0}</p>
              </div>
            </div>

            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{serviceStats.completed || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaints Status Distribution - Admin/Manager Only */}
      {shouldLoadGeneralStats && complaintAnalytics && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Complaints Status Distribution
            </h3>
            <span className="badge-indigo text-xs">{complaintAnalytics.total} total</span>
          </div>

          {complaintAnalytics ? (
            <div className="space-y-4">
              {complaintAnalytics.statusBreakdown.map((status, index) => {
                const colors: { [key: string]: { bg: string; text: string } } = {
                  'Pending': { bg: 'from-amber-400 to-amber-500', text: 'text-amber-600 dark:text-amber-400' },
                  'In Progress': { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-600 dark:text-blue-400' },
                  'Resolved': { bg: 'from-emerald-400 to-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
                  'Closed': { bg: 'from-slate-400 to-slate-600', text: 'text-slate-600 dark:text-slate-400' },
                  'Approved': { bg: 'from-purple-400 to-purple-600', text: 'text-purple-600 dark:text-purple-400' },
                  'Assigned': { bg: 'from-teal-400 to-teal-600', text: 'text-teal-600 dark:text-teal-400' }
                };
                const color = colors[status.status] || { bg: 'from-slate-400 to-slate-500', text: 'text-slate-600' };
                const percentage = complaintAnalytics.total > 0 ? ((status.count / complaintAnalytics.total) * 100).toFixed(1) : 0;
                return (
                  <div key={status.status || index}>
                    <div className="flex justify-between items-center mb-1.5 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{status.status}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{status.count} <span className="text-slate-400 font-normal">({percentage}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`bg-gradient-to-r ${color.bg} h-2.5 rounded-full transition-all duration-700 ease-out`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No status data available</div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Complaints by Category
            </h3>
          </div>
          <div className="space-y-4">
            {complaintAnalytics?.categoryBreakdown?.slice(0, 6).map((category, index) => {
              const maxCount = Math.max(...complaintAnalytics.categoryBreakdown.map(c => c.count));
              const percentage = maxCount > 0 ? ((category.count / maxCount) * 100).toFixed(1) : 0;
              const categoryGradients = [
                'from-indigo-500 to-indigo-600',
                'from-purple-500 to-purple-600',
                'from-pink-500 to-pink-600',
                'from-blue-500 to-blue-600',
                'from-teal-500 to-teal-600',
                'from-emerald-500 to-emerald-600'
              ];
              const gradient = categoryGradients[index % categoryGradients.length];
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{category.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{category.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`bg-gradient-to-r ${gradient} h-2.5 rounded-full transition-all duration-700 ease-out`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {(!complaintAnalytics?.categoryBreakdown || complaintAnalytics.categoryBreakdown.length === 0) && (
              <div className="text-center py-8 text-slate-400 text-sm">No category breakdown data available</div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Priority and Type Breakdown - Admin/Manager Only */}
      {shouldLoadGeneralStats && complaintAnalytics && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Complaints by Priority
          </h3>
          <div className="space-y-4">
            {complaintAnalytics?.priorityBreakdown?.map((priority, index) => {
              const colors: { [key: string]: { bg: string; text: string } } = {
                'High': { bg: 'from-rose-500 to-red-600', text: 'text-rose-600' },
                'Medium': { bg: 'from-amber-400 to-amber-500', text: 'text-amber-600' },
                'Low': { bg: 'from-emerald-400 to-emerald-600', text: 'text-emerald-600' }
              };
              const color = colors[priority.priority] || { bg: 'from-slate-400 to-slate-500', text: 'text-slate-600' };
              const percentage = complaintAnalytics.total > 0 ? ((priority.count / complaintAnalytics.total) * 100).toFixed(1) : 0;
              return (
                <div key={priority.priority || index}>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{priority.priority}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{priority.count} <span className="text-slate-400 font-normal">({percentage}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`bg-gradient-to-r ${color.bg} h-2.5 rounded-full transition-all duration-700 ease-out`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {(!complaintAnalytics?.priorityBreakdown || complaintAnalytics.priorityBreakdown.length === 0) && (
              <div className="text-center py-8 text-slate-400 text-sm">No priority data available</div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Complaints by Type
          </h3>
          <div className="space-y-4">
            {complaintAnalytics?.typeBreakdown?.map((type, index) => {
              const typeName = type.complaint_type || (type as any).type || `Type ${index + 1}`;
              const percentage = complaintAnalytics.total > 0 ? ((type.count / complaintAnalytics.total) * 100).toFixed(1) : 0;
              return (
                <div key={typeName || index}>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{typeName}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{type.count} <span className="text-slate-400 font-normal">({percentage}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-teal-400 to-teal-600 h-2.5 rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {(!complaintAnalytics?.typeBreakdown || complaintAnalytics.typeBreakdown.length === 0) && (
              <div className="text-center py-8 text-slate-400 text-sm">No type data available</div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Recent Complaints Table */}
      {shouldLoadGeneralStats && complaintAnalytics && (
      <div className="glass-card overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Complaints
          </h3>
          <Link to={`/${rolePrefix}/complaints`} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            View All &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {complaintAnalytics?.recentComplaints?.slice(0, 5).map((complaint, index) => (
                <tr key={complaint.complaint_id || (complaint as any).id || index}>
                  <td className="font-semibold text-slate-800 dark:text-slate-100">{complaint.title}</td>
                  <td>
                    <span className="badge-indigo">
                      {complaint.status}
                    </span>
                  </td>
                  <td>
                    <span className={
                      complaint.priority === 'High' ? 'badge-rose' :
                      complaint.priority === 'Medium' ? 'badge-amber' :
                      'badge-emerald'
                    }>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(complaint.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {(!complaintAnalytics?.recentComplaints || complaintAnalytics.recentComplaints.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">No recent complaints found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Availability Slots Overview Widget */}
      <div className="glass-card overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white">Upcoming Availability Slots</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Barber schedules and real-time slot capacity</p>
            </div>
          </div>
          <Link
            to="/services/availability"
            className="btn-modern-primary text-xs py-2 px-4 inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Manage Availability
          </Link>
        </div>

        {dashboardSlots.length === 0 ? (
          <div className="text-center py-12 p-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">No Upcoming Availability Scheduled</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">There are no availability slot configurations active. Click "Manage Availability" above to add new slots.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Window</th>
                  <th>Service Type</th>
                  <th>Barber</th>
                  <th>Capacity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardSlots.slice(0, 5).map((slot, index) => {
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
                    <tr key={slot.id || index}>
                      <td className="font-semibold text-slate-900 dark:text-slate-100">
                        {formattedDate}
                      </td>
                      <td className="text-slate-700 dark:text-slate-300 font-medium">
                        {formatTime(slot.start_time, slot.start_time_ampm)} - {formatTime(slot.end_time, slot.end_time_ampm)}
                      </td>
                      <td className="text-slate-700 dark:text-slate-300">
                        {slot.service_name}
                      </td>
                      <td>
                        {slot.barber_id ? (
                          <span className="badge-indigo">
                            {slot.barber_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Global (Any Barber)
                          </span>
                        )}
                      </td>
                      <td className="font-bold text-slate-900 dark:text-white">
                        {slot.max_bookings}
                      </td>
                      <td>
                        <span className={slot.slot_status === 'open' ? 'badge-emerald' : 'badge-rose'}>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card-hover p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Posts</p>
              <p className="text-2xl font-heading font-black text-slate-900 dark:text-white mt-1">{dashboardStats?.totalPosts || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6M7 12h6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-card-hover p-5 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Comments</p>
              <p className="text-2xl font-heading font-black text-slate-900 dark:text-white mt-1">{dashboardStats?.pendingComments || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-card-hover p-5 border-l-4 border-l-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Messages</p>
              <p className="text-2xl font-heading font-black text-slate-900 dark:text-white mt-1">{dashboardStats?.newMessages || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
