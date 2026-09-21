import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaClock, FaSpinner, FaChevronRight, FaPlay, 
  FaCheckDouble, FaUsers, FaUserClock, FaCheckCircle, FaUserCheck 
} from 'react-icons/fa';
import { queueApi, QueueEntry } from '../../services/serviceService';

interface QueueStats {
  waiting_count: number;
  serving_count: number;
  completed_count: number;
  not_started_count: number;
  avg_wait_time: number;
}

const QueueManagementPage: React.FC = () => {
  const [queues, setQueues] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    waiting_count: 0,
    serving_count: 0,
    completed_count: 0,
    not_started_count: 0,
    avg_wait_time: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [queuesRes, statsRes] = await Promise.all([
        queueApi.getQueues(),
        queueApi.getStats()
      ]);

      if (queuesRes.success) {
        setQueues(queuesRes.data);
      } else {
        setError('Failed to fetch active queue entries');
      }

      if (statsRes.success && statsRes.data) {
        // Handle MySQL raw fields or defaults
        setStats({
          waiting_count: Number(statsRes.data.waiting_count) || 0,
          serving_count: Number(statsRes.data.serving_count) || 0,
          completed_count: Number(statsRes.data.completed_count) || 0,
          not_started_count: Number(statsRes.data.not_started_count) || 0,
          avg_wait_time: Math.round(Number(statsRes.data.avg_wait_time)) || 0
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading queue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh queue board every 15 seconds to keep it fresh
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const res = await queueApi.callNextOverall();
      if (res.success) {
        // Reload all data to ensure position and status are fully aligned
        await fetchData();
      } else {
        alert(res.message || 'No customers waiting in queue');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while calling next customer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: 'queued' | 'serving' | 'completed') => {
    setActionLoading(true);
    try {
      const res = await queueApi.updateStatus(id, newStatus);
      if (res.success) {
        await fetchData();
      } else {
        alert(res.message || 'Failed to update queue status');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while updating status');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'N/A';
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-2">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
            <h1 className="text-3xl font-heading font-black tracking-tight text-slate-900 dark:text-white">
              Queue Management Board
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time salon queue workflow. Monitor waiting clients, serve the next customer, and update service stages.
          </p>
        </div>
        
        {/* Dominant Call Next Customer Button */}
        <button
          onClick={handleCallNext}
          disabled={actionLoading || stats.waiting_count === 0}
          className={`btn-modern-primary text-sm px-6 py-3 tracking-wide uppercase font-bold flex items-center gap-2.5 ${
            stats.waiting_count === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {actionLoading ? (
            <FaSpinner className="animate-spin text-sm" />
          ) : (
            <FaPlay className="text-xs" />
          )}
          <span>Call Next Customer</span>
        </button>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
            <FaUserClock className="text-xl" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Waiting</p>
            <h4 className="text-3xl font-heading font-black mt-1 text-slate-900 dark:text-white">{stats.waiting_count}</h4>
          </div>
        </div>

        <div className="glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <FaSpinner className="text-xl animate-spin" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Serving</p>
            <h4 className="text-3xl font-heading font-black mt-1 text-amber-600 dark:text-amber-400">{stats.serving_count}</h4>
          </div>
        </div>

        <div className="glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <FaCheckCircle className="text-xl" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Completed</p>
            <h4 className="text-3xl font-heading font-black mt-1 text-emerald-600 dark:text-emerald-400">{stats.completed_count}</h4>
          </div>
        </div>

        <div className="glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-inner">
            <FaClock className="text-xl" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Wait</p>
            <h4 className="text-3xl font-heading font-black mt-1 text-slate-900 dark:text-white">{stats.avg_wait_time} <span className="text-sm font-normal text-slate-400">min</span></h4>
          </div>
        </div>
      </div>

      {/* Main Board Flow */}
      {loading && queues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card">
          <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Synchronizing live queue board...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-center">
          <p className="text-rose-600 dark:text-rose-400 font-semibold">{error}</p>
          <button 
            onClick={fetchData}
            className="btn-modern-secondary mt-4 text-xs"
          >
            Reload Board
          </button>
        </div>
      ) : queues.length === 0 ? (
        <div className="py-20 text-center glass-card">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
            <FaUsers className="text-3xl" />
          </div>
          <p className="text-slate-800 dark:text-slate-200 text-base font-heading font-bold">No active customers in the queue.</p>
          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">Submit or approve client bookings to populate the queue board.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-base font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            Active Queue Flow
          </h2>
          
          <div className="space-y-3">
            <AnimatePresence>
              {queues.map((entry) => {
                const isServing = entry.queue_status === 'serving';
                const isCompleted = entry.queue_status === 'completed';
                
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className={`glass-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all duration-200 ${
                      isServing 
                        ? 'border-amber-400 dark:border-amber-500/60 shadow-lg shadow-amber-500/10' 
                        : isCompleted 
                          ? 'opacity-60' 
                          : ''
                    }`}
                  >
                    {/* Left: Position & Ref */}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl font-heading font-black text-lg flex items-center justify-center shrink-0 ${
                        isServing 
                          ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/30' 
                          : isCompleted 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' 
                            : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
                      }`}>
                        #{entry.queue_position}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-heading font-bold text-slate-900 dark:text-white text-base">{entry.customer_name}</h4>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono font-semibold rounded-md border border-slate-200 dark:border-slate-700">
                            {entry.reference_number}
                          </span>
                          <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                            isServing 
                              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' 
                              : isCompleted 
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' 
                                : 'badge-indigo'
                          }`}>
                            {entry.queue_status}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                          {entry.service_name} • <span className="text-slate-400 dark:text-slate-500">{entry.barber_name || 'Global (Any Barber)'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Middle: Appointment Time */}
                    <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-medium">
                        <FaClock className="text-indigo-500" />
                        <span>Slot: {formatTime(entry.appointment_time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <FaClock className="text-amber-500" />
                        <span>Est. Wait: {entry.estimated_wait_time} min</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {!isCompleted && (
                        <>
                          {!isServing && (
                            <button
                              onClick={() => handleUpdateStatus(entry.id, 'serving')}
                              disabled={actionLoading}
                              className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                            >
                              <FaPlay className="text-[10px]" />
                              <span>Start Service</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleUpdateStatus(entry.id, 'completed')}
                            disabled={actionLoading}
                            className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                          >
                            <FaCheckDouble className="text-[10px]" />
                            <span>Done</span>
                          </button>
                        </>
                      )}
                      
                      {isCompleted && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <FaCheckCircle className="text-emerald-500" />
                          Completed
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManagementPage;
