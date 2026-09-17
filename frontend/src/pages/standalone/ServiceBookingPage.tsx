import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicServiceApi, bookingApi, Service } from '../../services/serviceService';
import { request } from '../../services/apiService';
import { motion } from 'framer-motion';
import {
  FaCalendarAlt, FaClock, FaUser, FaPhone, FaEnvelope, FaCheckCircle,
  FaArrowLeft, FaCut, FaStickyNote
} from 'react-icons/fa';
import { useAuth } from '../../components/Auth/AuthContext';

const ServiceBookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [barbers, setBarbers] = useState<Array<{ id: number; full_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBarber, setSelectedBarber] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
  });

  // Redirect unauthenticated users to the basic /login page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/services/book/${serviceId}` } });
    }
  }, [isAuthenticated, navigate, serviceId]);

  // Fetch service details and barbers on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [serviceRes, barbersRes] = await Promise.all([
          publicServiceApi.getById(Number(serviceId)),
          publicServiceApi.getBarbers()
        ]);
        if (serviceRes.success) setService(serviceRes.data);
        if (barbersRes.success) setBarbers(barbersRes.data);
      } catch (err: any) {
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [serviceId]);

  // Update customer form inputs when authenticated user details are available
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.name || '',
        customer_phone: (user as any).phone || (user as any).customer_phone || '',
        customer_email: user.email || '',
      }));
    }
  }, [isAuthenticated, user]);

  // Fetch available slots when date or barber changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !serviceId) return;
      try {
        const res = await bookingApi.getAvailableSlots(
          Number(serviceId),
          selectedDate,
          selectedBarber || undefined
        );
        if (res.success) {
          setAvailableSlots(res.data.available_slots);
        }
      } catch (err) {
        console.error('Failed to fetch slots:', err);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedBarber, serviceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };


  const [createdRef, setCreatedRef] = useState<string | null>(null);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        service_id: Number(serviceId),
        barber_id: selectedBarber || undefined,
        booking_date: selectedDate,
        time_slot: selectedSlot,
        ...formData,
      };
      const res = await bookingApi.createBooking(payload);
      if (res.success) {
        setCreatedRef(res.data?.reference_number || null);
        setSuccess(true);
      } else {
        setError(res.message || 'Booking failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSlotTime = (slot: string) => {
    const [h, m] = slot.split(':');
    const date = new Date();
    date.setHours(parseInt(h), parseInt(m));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-md w-full"
        >
          <div className="mb-4 text-emerald-400 flex justify-center">
            <FaCheckCircle size={64} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Booking Submitted!</h2>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-full inline-block mb-4">
            Pending Admin Approval
          </span>
          {createdRef && (
            <div className="mb-4 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Your Reference Code:</span>
              <span className="text-lg font-mono font-black text-blue-400 tracking-wider">{createdRef}</span>
            </div>
          )}
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            Your booking request has been sent to the Admin. Once approved, you will be automatically assigned a live queue position.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/dashboard/queue-tracking')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-md"
            >
              Track My Queue / Bookings
            </button>
            <button
              onClick={() => navigate('/services')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
            >
              Back to Services
            </button>
          </div>
        </motion.div>
      </div>
    );
  }


  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl max-w-md text-center">
          <h3 className="font-bold text-lg mb-2">Service Not Found</h3>
          <p className="text-sm">The requested service is unavailable or does not exist.</p>
          <button onClick={() => navigate('/services')} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all">
            Browse Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent text-slate-100 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-all"
      >
        <FaArrowLeft /> <span>Back to Services</span>
      </button>

      {/* Service Details Card (Glassmorphic) */}
      <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl mb-8 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 relative h-48 md:h-auto bg-slate-950/40">
            {service.service_image ? (
              <img
                src={service.service_image.startsWith('http') ? service.service_image : `http://localhost:5005/${service.service_image}`}
                alt={service.service_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-950/20">
                <FaCut className="text-6xl text-slate-700" />
              </div>
            )}
            {service.is_featured && (
              <span className="absolute top-3 left-3 bg-yellow-500/90 backdrop-blur-sm text-slate-950 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                Featured
              </span>
            )}
          </div>
          <div className="p-6 md:p-8 md:w-2/3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{service.service_name}</h1>
                <span className="text-xs font-bold text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded">
                  {service.category_name || 'General'}
                </span>
              </div>
              <p className="text-slate-400 font-light leading-relaxed mb-6">
                {service.description || 'Professional barber service designed for premium outcomes.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/60 pt-4">
              <div className="flex items-center gap-2">
                <FaClock className="text-blue-500 text-lg" />
                <div>
                  <span className="text-xs text-slate-500 block">Duration</span>
                  <span className="text-sm font-semibold text-white">{Math.floor(service.duration_minutes / 60)}h {service.duration_minutes % 60}m</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 block text-right">Price</span>
                {service.discount_price ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 line-through">{service.price} ETB</span>
                    <span className="text-xl font-black text-green-400">{service.discount_price} ETB</span>
                  </div>
                ) : (
                  <span className="text-xl font-black text-blue-400">{service.price} ETB</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Flow (Booking Fields) */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8"
        >
    
          <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4 mb-6">
            <div className="bg-blue-600/15 border border-blue-500/30 p-2.5 rounded-xl text-blue-400">
              <FaCalendarAlt className="text-xl" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-0.5">Complete Your Booking</h4>
              <p className="text-xs text-slate-500">Provide details and select slot below.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitBooking} className="space-y-6">

            {/* 1. Choose Barber */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">1. Choose a Barber (Optional)</label>
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="">No Preference (Recommended)</option>
                {barbers.map(b => (
                  <option key={b.id} value={b.id}>{b.full_name}</option>
                ))}
              </select>
            </div>

            {/* 2. Select Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">2. Select Appointment Date</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* 3. Time Slots */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3">3. Available Slots for {new Date(selectedDate).toLocaleDateString()}</label>
              {availableSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 text-center text-slate-500 text-sm font-light">
                  No available slots for the selected date. Please pick another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${selectedSlot === slot
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                    >
                      {formatSlotTime(slot)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Details */}
            <div className="border-t border-slate-800/60 pt-6">
              <label className="block text-xs font-semibold text-slate-300 mb-4">4. Client Information</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Full Name *</label>
                  <div className="relative">
                    <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Phone Number *</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder="+251 9XX XXX XXX"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Email (Optional)</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Special Notes</label>
                  <div className="relative">
                    <FaStickyNote className="absolute left-3.5 top-4 text-slate-500" />
                    <textarea
                      rows={3}
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Mention any custom specifications, requests, or instructions..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Summary Box */}
            {selectedSlot && selectedDate && (
              <div className="p-5 rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-md">
                <h5 className="text-white font-bold text-sm mb-3 border-b border-blue-500/10 pb-2">Appointment Summary</h5>
                <div className="grid grid-cols-2 gap-y-2 text-xs font-light text-slate-300">
                  <div><strong className="font-semibold text-white">Service:</strong></div>
                  <div>{service.service_name}</div>

                  <div><strong className="font-semibold text-white">Date:</strong></div>
                  <div>{new Date(selectedDate).toLocaleDateString()}</div>

                  <div><strong className="font-semibold text-white">Time:</strong></div>
                  <div>{formatSlotTime(selectedSlot)}</div>

                  <div><strong className="font-semibold text-white">Duration:</strong></div>
                  <div>{Math.floor(service.duration_minutes / 60)}h {service.duration_minutes % 60}m</div>

                  <div><strong className="font-semibold text-white">Price:</strong></div>
                  <div className="text-green-400 font-bold">{service.discount_price ? `${service.discount_price} ETB` : `${service.price} ETB`}</div>
                </div>
              </div>
            )}

            {/* Submit Booking */}
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${submitting || !selectedSlot
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700'
                }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Scheduling Appointment...</span>
                </>
              ) : (
                <>
                  <FaCalendarAlt />
                  <span>Confirm Appointment</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

    </div>
  );
};

export default ServiceBookingPage;
