import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCalendarAlt, FaClock, FaUser, FaPhone, FaEnvelope, 
  FaCheck, FaTimes, FaUndo, FaSearch, FaSpinner, FaCommentAlt, FaTags, FaEdit 
} from 'react-icons/fa';
import { bookingApi, workflowApi } from '../../services/serviceService';

interface Booking {
  id: number;
  service_name: string;
  price: number;
  category_name: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  notes: string | null;
  booking_date: string;
  time_slot: string;
  status: string;
  approval_status: 'waiting' | 'approved' | 'rejected' | 'changes_requested';
  rejection_reason: string | null;
  approval_note: string | null;
  reference_number: string | null;
  barber_name: string | null;
  duration_minutes?: number;
}

const ReviewBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'waiting' | 'approved' | 'rejected' | 'changes_requested'>('waiting');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  
  // Rejection modal/input states
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Request Changes modal/input states
  const [requestingChangesId, setRequestingChangesId] = useState<number | null>(null);
  const [changeRequests, setChangeRequests] = useState('');
  const [internalNote, setInternalNote] = useState('');

  // Quick Accept states
  const [quickRef, setQuickRef] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);

  const handleQuickAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRef.trim()) {
      setQuickError('Please enter a valid reference number');
      return;
    }
    setQuickLoading(true);
    setQuickError(null);
    setQuickSuccess(null);
    try {
      const res = await bookingApi.approveBookingByReference(quickRef.trim());
      if (res.success) {
        setQuickSuccess(`Successfully approved booking ${quickRef.trim()} and accepted into live queue!`);
        setQuickRef('');
        await fetchBookings();
        setTimeout(() => setQuickSuccess(null), 6000);
      } else {
        setQuickError(res.message || 'Failed to approve booking by reference');
      }
    } catch (err: any) {
      setQuickError(err.message || 'An error occurred during reference approval');
    } finally {
      setQuickLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingApi.getBookings();
      if (res.success) {
        setBookings(res.data);
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleApprove = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await bookingApi.approveBooking(id);
      if (res.success) {
        // Update local state dynamically
        setBookings(prev => prev.map(b => b.id === id ? { ...b, approval_status: 'approved', status: 'confirmed' } : b));
      } else {
        alert(res.message || 'Failed to approve booking');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during approval');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReject = (id: number) => {
    setRejectingId(id);
    setRejectionReason('');
  };

  const handleReject = async (id: number) => {
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason');
      return;
    }
    
    setActionLoadingId(id);
    try {
      const res = await bookingApi.rejectBooking(id, rejectionReason.trim());
      if (res.success) {
        setBookings(prev => prev.map(b => b.id === id ? { 
          ...b, 
          approval_status: 'rejected', 
          status: 'cancelled',
          rejection_reason: rejectionReason.trim()
        } : b));
        setRejectingId(null);
      } else {
        alert(res.message || 'Failed to reject booking');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during rejection');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRequestChanges = (id: number) => {
    setRequestingChangesId(id);
    setChangeRequests('');
    setInternalNote('');
  };

  const handleRequestChanges = async (id: number) => {
    if (!changeRequests.trim()) {
      alert('Please specify what changes are needed');
      return;
    }
    
    setActionLoadingId(id);
    try {
      const res = await workflowApi.requestChanges(id, changeRequests.trim(), internalNote.trim() || undefined);
      if (res.success) {
        setBookings(prev => prev.map(b => b.id === id ? { 
          ...b, 
          approval_status: 'changes_requested', 
          approval_note: changeRequests.trim()
        } : b));
        setRequestingChangesId(null);
      } else {
        alert(res.message || 'Failed to request changes');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while requesting changes');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatTime = (timeStr: string) => {
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

  const filteredBookings = bookings.filter(booking => {
    const matchesTab = booking.approval_status === activeTab;
    const matchesSearch = 
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_phone.includes(searchTerm) ||
      booking.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.reference_number && booking.reference_number.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Review Bookings
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Approve pending service appointments and send them straight into the active salon queue.
            </p>
          </div>
          
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-200 placeholder-slate-500 text-sm"
            />
          </div>
        </div>

        {/* Quick Accept Widget */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-655 rounded-lg flex items-center justify-center text-white">
              <FaCheck className="text-sm" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">Quick Accept by Reference Number</h3>
              <p className="text-[10px] text-slate-500 font-light">Scan or enter the customer's reference code to instantly review and admit them into the live queue board.</p>
            </div>
          </div>

          <form onSubmit={handleQuickAccept} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. BRB-2026-0001"
                value={quickRef}
                onChange={(e) => {
                  setQuickRef(e.target.value);
                  if (quickError) setQuickError(null);
                }}
                className="w-full pl-4 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-200 placeholder-slate-700 text-xs font-mono tracking-wider"
                required
              />
            </div>
            <button
              type="submit"
              disabled={quickLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-800 disabled:to-slate-850 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              {quickLoading ? (
                <>
                  <FaSpinner className="animate-spin" /> Accepting...
                </>
              ) : (
                <>
                  <FaCheck /> Accept into Queue
                </>
              )}
            </button>
          </form>

          {quickSuccess && (
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold leading-relaxed">
              {quickSuccess}
            </div>
          )}
          {quickError && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold leading-relaxed">
              {quickError}
            </div>
          )}
        </motion.div>

        {/* Tab Filters */}
        <div className="flex gap-2 p-1.5 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800/60 w-fit">
          <button
            onClick={() => setActiveTab('waiting')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'waiting'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Pending Review ({bookings.filter(b => b.approval_status === 'waiting').length})
          </button>
          
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'approved'
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Approved ({bookings.filter(b => b.approval_status === 'approved').length})
          </button>
          
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'rejected'
                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Rejected ({bookings.filter(b => b.approval_status === 'rejected').length})
          </button>
          
          <button
            onClick={() => setActiveTab('changes_requested')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'changes_requested'
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Changes Requested ({bookings.filter(b => b.approval_status === 'changes_requested').length})
          </button>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
            <p className="text-slate-400 font-medium">Fetching active bookings list...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-2xl text-center">
            <p className="text-red-400 font-semibold">{error}</p>
            <button 
              onClick={fetchBookings}
              className="mt-4 px-6 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl font-semibold"
            >
              Retry
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/20 border border-slate-900/60 rounded-2xl">
            <p className="text-slate-400 text-lg">No appointments found matching this tab.</p>
            <p className="text-slate-600 text-sm mt-1">Sit back, relax, or try searching for another name!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-900/60 backdrop-blur-md border border-slate-850/80 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/60 transition-all duration-200 shadow-xl"
                >
                  <div className="space-y-4">
                    {/* Header: Service Name & Reference */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs font-semibold rounded uppercase tracking-wider">
                          {booking.category_name}
                        </span>
                        <h3 className="text-lg font-bold text-slate-100 mt-1">
                          {booking.service_name}
                        </h3>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-blue-400 block">${booking.price}</span>
                        {booking.reference_number && (
                          <span className="text-xs font-mono font-semibold bg-slate-800 px-2 py-0.5 rounded text-slate-400 mt-1 block">
                            {booking.reference_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 space-y-2">
                      <div className="flex items-center gap-2.5 text-sm">
                        <FaUser className="text-slate-500 w-3.5" />
                        <span className="font-semibold text-slate-200">{booking.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-slate-400">
                        <FaPhone className="text-slate-500 w-3.5" />
                        <span>{booking.customer_phone}</span>
                      </div>
                      {booking.customer_email && (
                        <div className="flex items-center gap-2.5 text-sm text-slate-400 overflow-hidden text-ellipsis">
                          <FaEnvelope className="text-slate-500 w-3.5" />
                          <span className="truncate">{booking.customer_email}</span>
                        </div>
                      )}
                    </div>

                    {/* Date / Time / Barber Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-500" />
                        <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock className="text-indigo-500" />
                        <span>{formatTime(booking.time_slot)}</span>
                      </div>
                    </div>

                    {/* Notes if present */}
                    {booking.notes && (
                      <div className="text-xs text-slate-400 bg-slate-950/20 p-2.5 rounded-lg border border-slate-900/50 flex gap-2">
                        <FaCommentAlt className="text-slate-500 mt-0.5" />
                        <p className="italic">"{booking.notes}"</p>
                      </div>
                    )}

                    {/* Show rejection reason if tab is rejected */}
                    {activeTab === 'rejected' && booking.rejection_reason && (
                      <div className="text-xs text-red-400 bg-red-950/15 p-2.5 rounded-lg border border-red-900/20 flex gap-2">
                        <FaTimes className="text-red-500 mt-0.5" />
                        <p><span className="font-semibold">Reason:</span> {booking.rejection_reason}</p>
                      </div>
                    )}

                    {/* Show change requests if tab is changes_requested */}
                    {activeTab === 'changes_requested' && booking.approval_note && (
                      <div className="text-xs text-amber-400 bg-amber-950/15 p-2.5 rounded-lg border border-amber-900/20 flex gap-2">
                        <FaEdit className="text-amber-500 mt-0.5" />
                        <p><span className="font-semibold">Requested Changes:</span> {booking.approval_note}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Section */}
                  <div className="mt-6 pt-4 border-t border-slate-800/40">
                    {activeTab === 'waiting' ? (
                      rejectingId === booking.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-red-500 focus:border-transparent text-sm text-slate-200"
                            required
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(booking.id)}
                              disabled={actionLoadingId === booking.id}
                              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                            >
                              {actionLoadingId === booking.id ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <>Confirm Reject</>
                              )}
                            </button>
                            <button
                              onClick={() => setRejectingId(null)}
                              className="px-3 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : requestingChangesId === booking.id ? (
                        <div className="space-y-3">
                          <textarea
                            placeholder="What changes are needed? (visible to customer)"
                            value={changeRequests}
                            onChange={(e) => setChangeRequests(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-transparent text-sm text-slate-200 min-h-[80px]"
                            required
                          />
                          <textarea
                            placeholder="Internal note (optional, staff only)"
                            value={internalNote}
                            onChange={(e) => setInternalNote(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-transparent text-sm text-slate-200"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRequestChanges(booking.id)}
                              disabled={actionLoadingId === booking.id}
                              className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                            >
                              {actionLoadingId === booking.id ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <>Send Request</>
                              )}
                            </button>
                            <button
                              onClick={() => setRequestingChangesId(null)}
                              className="px-3 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(booking.id)}
                            disabled={actionLoadingId !== null}
                            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 transition-all duration-200"
                          >
                            {actionLoadingId === booking.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>
                                <FaCheck /> Approve
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleOpenRequestChanges(booking.id)}
                            disabled={actionLoadingId !== null}
                            className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                          >
                            <FaEdit /> Changes
                          </button>
                          
                          <button
                            onClick={() => handleOpenReject(booking.id)}
                            disabled={actionLoadingId !== null}
                            className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-red-400 hover:text-red-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                          >
                            <FaTimes /> Reject
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <FaTags />
                        <span>Status marked as: <span className="font-bold text-slate-400 capitalize">{booking.approval_status}</span></span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewBookingsPage;
