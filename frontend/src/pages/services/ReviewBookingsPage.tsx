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
    <div className="max-w-6xl mx-auto space-y-8 py-2">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
            <h1 className="text-3xl font-heading font-black tracking-tight text-slate-900 dark:text-white">
              Review Bookings
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Approve pending client appointments and send them directly into the live salon queue.
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-modern pl-10"
          />
        </div>
      </div>

      {/* Quick Accept Widget */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 border-l-4 border-l-emerald-500"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <FaCheck className="text-sm" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-slate-900 dark:text-white text-sm">Quick Accept by Reference Number</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scan or enter the customer's reference code to instantly admit them into the live queue.</p>
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
              className="input-modern font-mono"
              required
            />
          </div>
          <button
            type="submit"
            disabled={quickLoading}
            className="btn-modern-primary text-xs font-bold py-2.5 px-6 shrink-0 flex items-center justify-center gap-2"
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
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold leading-relaxed">
            {quickSuccess}
          </div>
        )}
        {quickError && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-semibold leading-relaxed">
            {quickError}
          </div>
        )}
      </motion.div>

      {/* Tab Filters */}
      <div className="flex flex-wrap gap-2 p-1.5 glass-panel w-fit">
        <button
          onClick={() => setActiveTab('waiting')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
            activeTab === 'waiting'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Pending ({bookings.filter(b => b.approval_status === 'waiting').length})
        </button>
        
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Approved ({bookings.filter(b => b.approval_status === 'approved').length})
        </button>
        
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
            activeTab === 'rejected'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Rejected ({bookings.filter(b => b.approval_status === 'rejected').length})
        </button>
        
        <button
          onClick={() => setActiveTab('changes_requested')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
            activeTab === 'changes_requested'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Changes ({bookings.filter(b => b.approval_status === 'changes_requested').length})
        </button>
      </div>

      {/* Loading / Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card">
          <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Fetching active bookings list...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-center">
          <p className="text-rose-600 dark:text-rose-400 font-semibold text-sm">{error}</p>
          <button 
            onClick={fetchBookings}
            className="btn-modern-secondary mt-4 text-xs"
          >
            Retry
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-20 text-center glass-card">
          <p className="text-slate-800 dark:text-slate-200 font-heading font-bold text-base">No appointments found matching this tab.</p>
          <p className="text-slate-400 text-xs mt-1">Select another tab or try searching for another name!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredBookings.map((booking) => (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="glass-card-hover p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Header: Service Name & Reference */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200 dark:border-slate-700">
                        {booking.category_name}
                      </span>
                      <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white mt-1.5">
                        {booking.service_name}
                      </h3>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-base font-heading font-black text-indigo-600 dark:text-indigo-400 block">{booking.price} ETB</span>
                      {booking.reference_number && (
                        <span className="text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 mt-1 block border border-slate-200 dark:border-slate-700">
                          {booking.reference_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="p-3.5 bg-slate-50/80 dark:bg-slate-850/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-2.5 text-xs">
                      <FaUser className="text-indigo-500 w-3.5 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-slate-100">{booking.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                      <FaPhone className="text-slate-400 w-3.5 shrink-0" />
                      <span>{booking.customer_phone}</span>
                    </div>
                    {booking.customer_email && (
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 overflow-hidden text-ellipsis">
                        <FaEnvelope className="text-slate-400 w-3.5 shrink-0" />
                        <span className="truncate">{booking.customer_email}</span>
                      </div>
                    )}
                  </div>

                  {/* Date / Time / Barber Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-indigo-500" />
                      <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-purple-500" />
                      <span>{formatTime(booking.time_slot)}</span>
                    </div>
                  </div>

                  {/* Notes if present */}
                  {booking.notes && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 flex gap-2">
                      <FaCommentAlt className="text-slate-400 mt-0.5 shrink-0" />
                      <p className="italic">"{booking.notes}"</p>
                    </div>
                  )}

                  {/* Show rejection reason if tab is rejected */}
                  {activeTab === 'rejected' && booking.rejection_reason && (
                    <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 flex gap-2">
                      <FaTimes className="text-rose-500 mt-0.5 shrink-0" />
                      <p><span className="font-bold">Reason:</span> {booking.rejection_reason}</p>
                    </div>
                  )}

                  {/* Show change requests if tab is changes_requested */}
                  {activeTab === 'changes_requested' && booking.approval_note && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40 flex gap-2">
                      <FaEdit className="text-amber-500 mt-0.5 shrink-0" />
                      <p><span className="font-bold">Requested:</span> {booking.approval_note}</p>
                    </div>
                  )}
                </div>

                {/* Actions Section */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {activeTab === 'waiting' ? (
                    rejectingId === booking.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Rejection reason..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="input-modern text-xs"
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(booking.id)}
                            disabled={actionLoadingId === booking.id}
                            className="btn-modern-danger flex-1 py-2 text-xs"
                          >
                            {actionLoadingId === booking.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>Confirm Reject</>
                            )}
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="btn-modern-secondary px-3 py-2 text-xs"
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
                          className="input-modern text-xs min-h-[70px]"
                          required
                        />
                        <textarea
                          placeholder="Internal note (optional, staff only)"
                          value={internalNote}
                          onChange={(e) => setInternalNote(e.target.value)}
                          className="input-modern text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRequestChanges(booking.id)}
                            disabled={actionLoadingId === booking.id}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl flex-1 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                          >
                            {actionLoadingId === booking.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>Send Request</>
                            )}
                          </button>
                          <button
                            onClick={() => setRequestingChangesId(null)}
                            className="btn-modern-secondary px-3 py-2 text-xs"
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
                          className="flex-1 py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
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
                          className="btn-modern-secondary py-2 px-3 text-xs"
                        >
                          <FaEdit className="text-amber-500" /> Changes
                        </button>
                        
                        <button
                          onClick={() => handleOpenReject(booking.id)}
                          disabled={actionLoadingId !== null}
                          className="btn-modern-secondary py-2 px-3 text-xs hover:border-rose-300 dark:hover:border-rose-800"
                        >
                          <FaTimes className="text-rose-500" /> Reject
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <FaTags />
                      <span>Status marked as: <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{booking.approval_status}</span></span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ReviewBookingsPage;
