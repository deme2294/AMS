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
    <div className="p-6 md:p-8 min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Queue Management Board
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live salon queue flow. Monitor waiting clients, serve the next client, and update visit stages.
            </p>
          </div>
          
          {/* Dominant Call Next Customer Button */}
          <button
            onClick={handleCallNext}
            disabled={actionLoading || stats.waiting_count === 0}
            className={`px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-850 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-98 transition-all duration-200 ${
              stats.waiting_count === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            {actionLoading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaPlay className="text-sm" />
            )}
            <span>Call Next Customer</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <FaUserClock className="text-2xl" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Waiting</p>
              <h4 className="text-2xl font-black mt-1 text-blue-400">{stats.waiting_count}</h4>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <FaSpinner className="text-2xl animate-spin" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Serving</p>
              <h4 className="text-2xl font-black mt-1 text-amber-400">{stats.serving_count}</h4>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <FaCheckCircle className="text-2xl" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Completed</p>
              <h4 className="text-2xl font-black mt-1 text-emerald-400">{stats.completed_count}</h4>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <FaClock className="text-2xl" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Wait</p>
              <h4 className="text-2xl font-black mt-1 text-indigo-400">{stats.avg_wait_time} min</h4>
            </div>
          </div>
        </div>

        {/* Main Board Flow */}
        {loading && queues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
            <p className="text-slate-400 font-medium">Synchronizing live queue board...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-2xl text-center">
            <p className="text-red-400 font-semibold">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-6 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl font-semibold text-sm"
            >
              Reload Board
            </button>
          </div>
        ) : queues.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/20 border border-slate-900/60 rounded-2xl">
            <FaUsers className="text-5xl text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No active customers in the queue.</p>
            <p className="text-slate-600 text-sm mt-1">Submit or approve client bookings to populate the queue board.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-slate-300">Active Queue Flow</h2>
            
            <div className="space-y-4">
              <AnimatePresence>
                {queues.map((entry) => {
                  const isServing = entry.queue_status === 'serving';
                  const isCompleted = entry.queue_status === 'completed';
                  
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className={`bg-slate-900/60 backdrop-blur-md border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-200 ${
                        isServing 
                          ? 'border-amber-500/50 shadow-md shadow-amber-950/10' 
                          : isCompleted 
                            ? 'border-slate-850 opacity-60' 
                            : 'border-slate-850'
                      }`}
                    >
                      {/* Left: Position & Ref */}
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl font-black text-lg flex items-center justify-center ${
                          isServing 
                            ? 'bg-amber-500/20 text-amber-400' 
                            : isCompleted 
                              ? 'bg-slate-800 text-slate-500' 
                              : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          #{entry.queue_position}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-200 text-base">{entry.customer_name}</h4>
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs font-mono font-semibold rounded">
                              {entry.reference_number}
                            </span>
                            <span className={`px-2 py-0.5 text-2xs uppercase tracking-wider font-extrabold rounded ${
                              isServing 
                                ? 'bg-amber-500/20 text-amber-400' 
                                : isCompleted 
                                  ? 'bg-slate-800 text-slate-500' 
                                  : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {entry.queue_status}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-400 mt-1 font-semibold">
                            {entry.service_name} • <span className="text-slate-500 font-normal">{entry.barber_name || 'Not assigned'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Middle: Appointment Time */}
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <FaClock className="text-slate-500" />
                          <span>Slot: {formatTime(entry.appointment_time)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaClock className="text-slate-500" />
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
                                className="flex-1 md:flex-none px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <FaPlay className="text-3xs" />
                                <span>Start Service</span>
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleUpdateStatus(entry.id, 'completed')}
                              disabled={actionLoading}
                              className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <FaCheckDouble className="text-2xs" />
                              <span>Done</span>
                            </button>
                          </>
                        )}
                        
                        {isCompleted && (
                          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                            <FaCheckCircle className="text-slate-600" />
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
    </div>
  );
};

export default QueueManagementPage;
