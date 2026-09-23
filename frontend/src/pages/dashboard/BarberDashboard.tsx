import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarDay, FaUsers, FaCheckCircle, FaClock, FaSpinner, FaCut, FaStar } from 'react-icons/fa';
import { queueApi, bookingApi } from '../../services/serviceService';
import { useAuth } from '../../components/Auth/AuthContext';

interface Stats {
  todayBookings: number;
  completedToday: number;
  inQueue: number;
  avgRating: number;
}

const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    todayBookings: 0,
    completedToday: 0,
    inQueue: 0,
    avgRating: 0
  });
  const [myQueue, setMyQueue] = useState<any[]>([]);
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
      
      // Get today's bookings for this barber
      const bookingsRes = await bookingApi.getBookings({ 
        date: today, 
        barber_id: user?.user_id ? Number(user.user_id) : undefined 
      });
      
      // Get queue for this barber
      const queueRes = await queueApi.getQueues({ 
        barber_id: user?.user_id ? Number(user.user_id) : undefined,
        queue_status: 'queued'
      });

      if (bookingsRes.success) {
        const bookings = bookingsRes.data;
        setStats({
          todayBookings: bookings.length,
          completedToday: bookings.filter((b: any) => b.status === 'completed').length,
          inQueue: bookings.filter((b: any) => b.queue_status === 'queued').length,
          avgRating: 4.8 // Placeholder - would come from reviews API
        });
      }

      if (queueRes.success) {
        setMyQueue(queueRes.data);
      }
    } catch (error) {
      console.error('Failed to load barber dashboard:', error);
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
            Barber Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back! Here's your today's overview and queue.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <FaCalendarDay className="text-2xl text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Today's Bookings</p>
                <p className="text-2xl font-black text-slate-100">{stats.todayBookings}</p>
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
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <FaCheckCircle className="text-2xl text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Completed</p>
                <p className="text-2xl font-black text-slate-100">{stats.completedToday}</p>
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
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <FaUsers className="text-2xl text-amber-400" />
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
            transition={{ delay: 0.3 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <FaStar className="text-2xl text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Avg Rating</p>
                <p className="text-2xl font-black text-slate-100">{stats.avgRating.toFixed(1)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* My Queue */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              <FaCut className="text-blue-400" />
              My Queue
            </h2>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold text-slate-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          {myQueue.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FaUsers className="text-4xl mx-auto mb-4 text-slate-700" />
              <p>No customers in your queue right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myQueue.map((entry, index) => (
                <div
                  key={entry.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{entry.customer_name}</h4>
                      <p className="text-sm text-slate-400">{entry.service_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Est. wait</p>
                    <p className="font-bold text-slate-300">{entry.estimated_wait_time} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarberDashboard;
