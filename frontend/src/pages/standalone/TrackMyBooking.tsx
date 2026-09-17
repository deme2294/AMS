// pages/standalone/TrackMyBooking.tsx
// Standalone page for customers to track their booking by reference number
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaUser, FaClock, FaCalendarAlt, FaSpinner, FaCheckCircle, 
    FaTimesCircle, FaExclamationTriangle, FaSearch, FaLayerGroup, FaCut, FaArrowLeft, FaRedo
} from 'react-icons/fa';
import { queueApi, QueueEntry } from '../../services/serviceService';

const TrackMyBooking: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [referenceNumber, setReferenceNumber] = useState('');
    const [queueData, setQueueData] = useState<QueueEntry | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Extract reference from URL query params
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const ref = urlParams.get('ref');
        if (ref) {
            setReferenceNumber(ref);
            fetchQueue(ref);
        }
    }, [location.search]);

    const fetchQueue = async (ref: string) => {
        if (!ref.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await queueApi.trackByReference(ref.trim());
            if (res.success && res.data) {
                setQueueData(res.data);
            } else {
                setError((res as any).message || 'Failed to fetch queue information');
                setQueueData(null);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while tracking the reference');
            setQueueData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!referenceNumber.trim()) {
            setError('Please enter a valid reference number');
            return;
        }
        fetchQueue(referenceNumber);
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

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString();
    };

    const getBookingStatusDisplay = (status?: string) => {
        const statusMap: { [key: string]: { text: string; color: string; icon: React.ReactNode } } = {
            pending: { text: 'Pending', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30', icon: <FaSpinner className="animate-spin" /> },
            confirmed: { text: 'Confirmed', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/30', icon: <FaCheckCircle /> },
            completed: { text: 'Completed', color: 'bg-green-500/10 text-green-400 border border-green-500/30', icon: <FaCheckCircle /> },
            cancelled: { text: 'Cancelled', color: 'bg-red-500/10 text-red-400 border border-red-500/30', icon: <FaTimesCircle /> },
            no_show: { text: 'No Show', color: 'bg-gray-500/10 text-gray-400 border border-gray-500/30', icon: <FaTimesCircle /> },
        };
        return statusMap[status || ''] || { text: status || 'Unknown', color: 'bg-slate-800 text-slate-300 border border-slate-700/50', icon: <FaExclamationTriangle /> };
    };

    const getQueueStatusDisplay = (status?: string) => {
        const statusMap: { [key: string]: { text: string; color: string; desc: string } } = {
            not_started: { text: 'Confirmed / Awaiting Queue', color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30', desc: 'Your appointment is approved and will enter the queue board shortly.' },
            queued: { text: 'In Queue', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/30', desc: 'You are currently in the queue. Please monitor your position below.' },
            serving: { text: 'Currently Serving', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/30', desc: 'Your turn is up! Please proceed to the service station immediately.' },
            completed: { text: 'Service Completed', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30', desc: 'Thank you for choosing AMS Barber Shop. We hope to see you again soon!' },
        };
        return statusMap[status || ''] || { text: status || 'Unknown', color: 'bg-slate-800 text-slate-300 border border-slate-700/50', desc: 'Your booking details are logged.' };
    };

    const statusInfo = queueData ? getQueueStatusDisplay(queueData.queue_status) : null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-lg space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 justify-between">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/85 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all"
                    >
                        <FaArrowLeft /> Home
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <FaCut className="text-white text-sm" />
                        </div>
                        <span className="font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 text-sm">
                            Track My Booking
                        </span>
                    </div>
                </div>

                {/* Reference Input Form */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-6 shadow-xl"
                >
                    <h2 className="text-xl font-extrabold text-slate-100">Find Your Appointment</h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Enter your booking reference number to track status and queue position.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <div className="relative">
                            <FaLayerGroup className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                placeholder="e.g. BRB-2026-0001"
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-200 placeholder-slate-650 text-sm font-mono tracking-wider"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="animate-spin" /> Tracking...
                                </>
                            ) : (
                                <>
                                    <FaSearch /> Track Booking
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-850">
                        <FaSpinner className="animate-spin text-3xl text-blue-500 mb-3" />
                        <p className="text-slate-400 text-sm font-medium">Fetching booking details...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-red-950/20 border border-red-900/30 rounded-2xl flex gap-3 items-start"
                    >
                        <FaExclamationTriangle className="text-red-500 text-lg mt-0.5" />
                        <div>
                            <h4 className="font-bold text-red-400 text-sm">Booking Not Found</h4>
                            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error}</p>
                            <p className="text-slate-500 text-3xs mt-2">
                                Please verify the reference number. Format: BRB-YYYY-NNNN
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Booking Details */}
                {!loading && queueData && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl p-6 space-y-6 shadow-2xl"
                    >
                        {/* Status Banner */}
                        <div className="flex items-center justify-between border-b border-slate-850 pb-4 gap-4 flex-wrap">
                            <div>
                                <span className="text-2xs font-bold text-slate-500 uppercase tracking-widest block">Reference</span>
                                <span className="text-lg font-mono font-extrabold text-blue-400 mt-0.5 block">{queueData.reference_number}</span>
                            </div>
                            
                            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${statusInfo?.color}`}>
                                {statusInfo?.text}
                            </div>
                        </div>

                        {/* Service & Time Details */}
                        <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-900/80 space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-slate-900 pb-2">
                                <span className="text-slate-500 font-semibold">Service</span>
                                <span className="font-extrabold text-slate-200">{queueData.service_name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-900 pb-2">
                                <span className="text-slate-500 font-semibold">Barber</span>
                                <span className="font-extrabold text-slate-200">{queueData.barber_name || 'Any Available'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-900 pb-2">
                                <span className="text-slate-500 font-semibold">Customer</span>
                                <span className="font-extrabold text-slate-200">{queueData.customer_name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-semibold">Appointment</span>
                                <span className="font-extrabold text-slate-200">
                                    {formatDate(queueData.appointment_date)} at {formatTime(queueData.appointment_time)}
                                </span>
                            </div>
                        </div>

                        {/* Queue Position (when queued/serving) */}
                        {queueData.queue_status === 'queued' || queueData.queue_status === 'serving' ? (
                            <div className="p-5 bg-blue-600/5 border border-blue-500/20 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">Queue Position</span>
                                        <span className="text-3xl font-black text-slate-100 mt-1 block">
                                            #{queueData.queue_position}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">Est. Wait Time</span>
                                        <span className="text-3xl font-black text-indigo-400 mt-1 block">
                                            {queueData.estimated_wait_time} <span className="text-xs font-bold text-slate-400">mins</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Status Description */}
                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-850 text-center">
                            <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                                {statusInfo?.desc}
                            </p>
                        </div>

                        {/* Refresh Button */}
                        <div className="text-center">
                            <button
                                onClick={() => fetchQueue(referenceNumber)}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all"
                            >
                                <FaRedo className={loading ? "animate-spin" : ""} />
                                Refresh Status
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default TrackMyBooking;