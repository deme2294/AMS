import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaClipboardList, FaUserClock, FaCheckCircle, FaExclamationTriangle, 
  FaSpinner, FaCalendarAlt, FaUsers, FaChartLine 
} from 'react-icons/fa';
import { bookingApi, queueApi } from '../../services/serviceService';

interface DashboardStats {
  pendingApprovals: number;
  inQueue: number;
  completedToday: number;
  todayAppointments: number;
}

const ReceptionistDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    pendingApprovals: 0,
    inQueue: 0,
    completedToday: 0,
    todayAppointments: 0
  });
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const [bookingsRes, queueRes, queueStatsRes] = await Promise.all([
        bookingApi.getBookings({ approval_status: 'waiting' }),
        bookingApi.getBookings({ date: today }),
        queueApi.getStats({ date: today })
      ]);

      if (bookingsRes.success) {
        setPendingBookings(bookingsRes.data.slice(0, 5)); // Top 5
        setStats(prev => ({
          ...prev,
          pendingApprovals: bookingsRes.data.length
        }));
      }

      if (queueRes.success) {
        setStats(prev => ({
          ...prev,
          todayAppointments: queueRes.data.length,
          completedToday: queueRes.data.filter((b: any) => b.status === 'completed').length
        }));
      }

      if (queueStatsRes.success) {
        setStats(prev => ({
          ...prev,
          inQueue: queueStatsRes.data.waiting_count || 0
        }));
      }
    } catch (error) {
      console.error('Failed to load receptionist dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Receptionist Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage bookings, queue, and customer check-ins.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/services/review"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
          >
            <FaClipboardList className="text-3xl mb-2" />
            <span className="font-bold text-sm">Review Bookings</span>
          </Link>

          <Link
            to="/services/queue"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg hover:shadow-xl"
          >
            <FaUsers className="text-3xl mb-2" />
            <span className="font-bold text-sm">Manage Queue</span>
          </Link>

          <Link
            to="/services"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl"
          >
            <FaCalendarAlt className="text-3xl mb-2" />
            <span className="font-bold text-sm">Services</span>
          </Link>

          <Link
            to="/dashboard/analytics"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl"
          >
            <FaChartLine className="text-3xl mb-2" />
            <span className="font-bold text-sm">Analytics</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <FaExclamationTriangle className="text-2xl text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Pending Approval</p>
                <p className="text-2xl font-black text-slate-100">{stats.pendingApprovals}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <FaUserClock className="text-2xl text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">In Queue</p>
                <p className="text-2xl font-black text-slate-100">{stats.inQueue}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <FaCheckCircle className="text-2xl text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Completed Today</p>
                <p className="text-2xl font-black text-slate-100">{stats.completedToday}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <FaCalendarAlt className="text-2xl text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Today's Appointments</p>
                <p className="text-2xl font-black text-slate-100">{stats.todayAppointments}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pending Bookings */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              <FaClipboardList className="text-amber-400" />
              Recent Pending Bookings
            </h2>
            <Link
              to="/services/review"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-colors"
            >
              View All
            </Link>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FaCheckCircle className="text-4xl mx-auto mb-4 text-slate-700" />
              <p>No pending bookings to review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <h4 className="font-bold text-slate-200">{booking.customer_name}</h4>
                    <p className="text-sm text-slate-400">
                      {booking.service_name} • {new Date(booking.booking_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
