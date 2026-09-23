import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicServiceApi, bookingApi, Service } from '../../services/serviceService';
import { BACKEND_URL } from '../../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCalendarAlt, FaClock, FaUser, FaPhone, FaEnvelope, FaCheckCircle,
  FaArrowLeft, FaCut, FaStickyNote, FaStar, FaShieldAlt,
  FaCheck, FaCopy, FaUserTie, FaMagic, FaCheckDouble
} from 'react-icons/fa';
import { useAuth } from '../../components/Auth/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';
import './ServiceBookingPage.css';

const ServiceBookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [barbers, setBarbers] = useState<Array<{ id: number; full_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [selectedBarber, setSelectedBarber] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
  });

  const [createdRef, setCreatedRef] = useState<string | null>(null);

  // Allow guests to view service & slots; prompt for login when booking
  const handleAuthRedirect = () => {
    navigate('/login', { state: { from: `/services/book/${serviceId}` } });
  };

  // Fetch service details and barbers on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [serviceRes, barbersRes] = await Promise.all([
          publicServiceApi.getById(Number(serviceId)),
          publicServiceApi.getBarbers()
        ]);
        if (serviceRes.success && serviceRes.data) {
          setService(serviceRes.data);
        }
        if (barbersRes.success && barbersRes.data) {
          setBarbers(barbersRes.data);
        }
      } catch (err: any) {
        setError('Failed to load service details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (serviceId) {
      fetchData();
    }
  }, [serviceId]);

  // Restore draft if user was redirected to sign in and returned
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('pending_booking');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.serviceId === serviceId) {
          if (parsed.selectedBarber !== undefined) setSelectedBarber(parsed.selectedBarber);
          if (parsed.selectedDate) setSelectedDate(parsed.selectedDate);
          if (parsed.selectedSlot) setSelectedSlot(parsed.selectedSlot);
          if (parsed.formData) {
            setFormData(prev => ({
              ...prev,
              ...parsed.formData
            }));
          }
        }
        sessionStorage.removeItem('pending_booking');
      }
    } catch (e) {
      // ignore parse error
    }
  }, [serviceId]);

  // Pre-populate customer details from authenticated user
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        customer_name: prev.customer_name || user.name || (user as any).fname || '',
        customer_phone: prev.customer_phone || (user as any).phone || (user as any).customer_phone || '',
        customer_email: prev.customer_email || user.email || '',
      }));
    }
  }, [isAuthenticated, user]);

  // Fetch available slots when date or barber changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !serviceId) return;
      try {
        setLoadingSlots(true);
        const res = await bookingApi.getAvailableSlots(
          Number(serviceId),
          selectedDate,
          selectedBarber || undefined
        );
        if (res.success && res.data) {
          setAvailableSlots(res.data.available_slots || []);
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        console.error('Failed to fetch slots:', err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedBarber, serviceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleCopyRef = () => {
    if (createdRef) {
      navigator.clipboard.writeText(createdRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an appointment time slot.');
      return;
    }

    // If not authenticated, cache user choices and prompt sign-in
    if (!isAuthenticated) {
      try {
        sessionStorage.setItem('pending_booking', JSON.stringify({
          serviceId,
          selectedBarber,
          selectedDate,
          selectedSlot,
          formData,
        }));
      } catch (e) {
        // ignore
      }
      handleAuthRedirect();
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
        setError(res.message || 'Booking submission failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred while reserving your slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSlotTime = (slot: string) => {
    if (!slot) return '';
    const parts = slot.split(':');
    const date = new Date();
    date.setHours(parseInt(parts[0], 10), parseInt(parts[1] || '0', 10));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Quick Date Shortcut Chips Generator
  const dateChips = useMemo(() => {
    const chips = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      else label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      chips.push({ iso, label });
    }
    return chips;
  }, []);

  // Compute clean image URL
  const cleanImageUrl = useMemo(() => {
    if (!service) return null;
    const img = service.service_image || service.image_url;
    if (!img) return null;
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
      return img;
    }
    return `${BACKEND_URL}${img.startsWith('/') ? '' : '/'}${img}`;
  }, [service]);

  // Selected barber name
  const selectedBarberName = useMemo(() => {
    if (!selectedBarber) return 'Any Specialist (First Available)';
    const found = barbers.find(b => b.id === Number(selectedBarber));
    return found ? found.full_name : 'Assigned Specialist';
  }, [selectedBarber, barbers]);

  // Calculate pricing
  const pricingInfo = useMemo(() => {
    if (!service) return { originalPrice: 0, currentPrice: 0, discount: 0 };
    const original = parseFloat(String(service.price || '0'));
    const current = service.discount_price ? parseFloat(String(service.discount_price)) : original;
    const discount = original > current ? original - current : 0;
    return { originalPrice: original, currentPrice: current, discount };
  }, [service]);

  // Loading State
  if (loading) {
    return (
      <div className="sb-page-wrapper flex items-center justify-center">
        <div className="text-center p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping"></div>
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">Loading Service</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Preparing appointment calendar...</p>
        </div>
      </div>
    );
  }

  // Success Confirmation State
  if (success) {
    return (
      <div className="sb-page-wrapper flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="sb-success-card"
        >
          {/* Animated Confirmation Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mx-auto mb-5 shadow-lg shadow-emerald-500/10">
            <FaCheckCircle className="text-4xl animate-bounce" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 font-display">
            Booking Confirmed!
          </h2>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Specialist Assignment
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 font-normal">
            Your appointment reservation has been received. Our salon team will confirm and allocate your position in the live queue.
          </p>

          {/* Reference Code Box */}
          {createdRef && (
            <div className="sb-ref-code-box">
              <div className="text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Booking Reference
                </span>
                <span className="sb-ref-code-text">{createdRef}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyRef}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200/60 dark:border-slate-700"
                title="Copy reference code"
              >
                {copied ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Quick Summary Pill Details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-left text-xs mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{service?.service_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled Date:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Time Window:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatSlotTime(selectedSlot)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Due:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{pricingInfo.currentPrice} ETB</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                const roleId = user ? Number(user.role_id) : 0;
                const prefix = roleId === 1 ? 'admin' : roleId === 2 ? 'barber' : roleId === 3 ? 'customer' : roleId === 4 ? 'manager' : roleId === 5 ? 'receptionist' : 'customer';
                navigate(isAuthenticated ? `/${prefix}/queues/track${createdRef ? `/${createdRef}` : ''}` : `/queues/track${createdRef ? `/${createdRef}` : ''}`);
              }}
              className="sb-submit-btn text-sm py-3.5"
            >
              <FaCheckDouble />
              <span>Track Live Queue Status</span>
            </button>
            <button
              onClick={() => {
                const roleId = user ? Number(user.role_id) : 0;
                const prefix = roleId === 1 ? 'admin' : roleId === 2 ? 'barber' : roleId === 3 ? 'customer' : roleId === 4 ? 'manager' : roleId === 5 ? 'receptionist' : 'customer';
                navigate(isAuthenticated ? `/${prefix}/services/book` : '/services');
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-200 dark:border-slate-700"
            >
              Explore More Services
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Not Found State
  if (!service) {
    return (
      <div className="sb-page-wrapper flex items-center justify-center">
        <div className="sb-form-card max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mx-auto mb-4 border border-rose-500/20">
            <FaCut />
          </div>
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-white mb-2">Service Not Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            The requested salon or grooming service is currently inactive or does not exist.
          </p>
          <button
            onClick={() => navigate('/services')}
            className="sb-submit-btn text-sm py-3"
          >
            Browse Available Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sb-page-wrapper">
      <div className="sb-container">
        
        {/* Top Header & Theme Switcher Bar */}
        <div className="sb-topbar">
          <button
            onClick={() => navigate(-1)}
            className="sb-back-btn"
          >
            <FaArrowLeft className="text-xs" />
            <span>Back to Services</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Online Booking Open</span>
            </div>
            {/* Live Theme Toggle */}
            <ThemeToggle variant="segmented" />
          </div>
        </div>

        {/* Hero Showcase Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sb-hero-card"
        >
          <div className="flex flex-col md:flex-row">
            {/* Left Media / Photography Column */}
            <div className="md:w-5/12 relative h-64 md:h-auto sb-hero-media-wrapper">
              {cleanImageUrl ? (
                <img
                  src={cleanImageUrl}
                  alt={service.service_name}
                  className="sb-hero-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-2 p-6">
                  <FaCut className="text-5xl" />
                  <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Exclusive Styling</span>
                </div>
              )}

              {/* Featured Badge */}
              {service.is_featured ? (
                <span className="sb-badge-featured">
                  <FaStar className="text-[10px]" />
                  <span>Featured</span>
                </span>
              ) : null}

              {/* Category Pill Tag */}
              <div className="absolute bottom-3 left-3">
                <span className="sb-badge-category backdrop-blur-md">
                  <FaCut className="text-[10px]" />
                  <span>{service.category_name || 'Salon & Grooming'}</span>
                </span>
              </div>
            </div>

            {/* Right Information Column */}
            <div className="p-6 md:p-8 md:w-7/12 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Premium Treatment
                  </span>
                  
                  {/* Rating Score */}
                  <div className="sb-badge-rating">
                    <FaStar className="text-amber-500" />
                    <span>{service.rating_avg ? Number(service.rating_avg).toFixed(1) : '4.9'}</span>
                    <span className="text-slate-400 font-normal">({service.rating_count || 24})</span>
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold sb-service-title mb-3">
                  {service.service_name}
                </h1>

                <p className="sb-service-description mb-6">
                  {service.description || service.short_description || 'Indulge in tailored master styling, precision grooming, and rejuvenating self-care treatments.'}
                </p>
              </div>

              {/* Stats Bar (Duration & Pricing) */}
              <div className="sb-stats-pillbar">
                <div className="sb-stat-item">
                  <div className="sb-stat-icon-wrapper sb-stat-icon-blue">
                    <FaClock />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Session Duration</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {Math.floor(service.duration_minutes / 60) > 0 ? `${Math.floor(service.duration_minutes / 60)}h ` : ''}
                      {service.duration_minutes % 60 > 0 ? `${service.duration_minutes % 60}m` : ''}
                    </span>
                  </div>
                </div>

                {/* Price Box */}
                <div className="sb-price-tag-container">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Service Investment</span>
                  <div className="flex items-baseline gap-2.5">
                    {pricingInfo.discount > 0 ? (
                      <>
                        <span className="sb-original-price">{pricingInfo.originalPrice} ETB</span>
                        <span className="sb-current-price">{pricingInfo.currentPrice} ETB</span>
                      </>
                    ) : (
                      <span className="sb-current-price text-indigo-600 dark:text-indigo-400">{pricingInfo.currentPrice} ETB</span>
                    )}
                  </div>
                  {pricingInfo.discount > 0 && (
                    <span className="sb-discount-badge">
                      Save {pricingInfo.discount} ETB Special Offer
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4-Step Interactive Booking Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="sb-form-card"
        >
          {/* Form Header */}
          <div className="sb-form-header">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl flex-shrink-0">
              <FaCalendarAlt />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Reserve Your Appointment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select your preferred specialist, date, and appointment slot below.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmitBooking} className="space-y-8">
            
            {/* STEP 1: Select Specialist / Barber */}
            <div>
              <div className="sb-step-header">
                <span className="sb-step-number">1</span>
                <h3 className="sb-step-title">Select Stylist or Specialist</h3>
              </div>

              <div className="sb-stylist-grid">
                {/* Option 1: Any specialist */}
                <div
                  onClick={() => setSelectedBarber('')}
                  className={`sb-stylist-card ${selectedBarber === '' ? 'selected' : ''}`}
                >
                  <div className="sb-stylist-avatar bg-gradient-to-tr from-indigo-600 to-cyan-500">
                    <FaMagic className="text-base" />
                  </div>
                  <div className="sb-stylist-info flex-1">
                    <h5>First Available</h5>
                    <p>Fastest queue allocation</p>
                  </div>
                  {selectedBarber === '' && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      <FaCheck />
                    </div>
                  )}
                </div>

                {/* Specific Barbers */}
                {barbers.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBarber(b.id)}
                    className={`sb-stylist-card ${selectedBarber === b.id ? 'selected' : ''}`}
                  >
                    <div className="sb-stylist-avatar">
                      <FaUserTie className="text-base" />
                    </div>
                    <div className="sb-stylist-info flex-1">
                      <h5>{b.full_name}</h5>
                      <p>Master Barber</p>
                    </div>
                    {selectedBarber === b.id && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        <FaCheck />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 2: Appointment Date */}
            <div>
              <div className="sb-step-header">
                <span className="sb-step-number">2</span>
                <h3 className="sb-step-title">Choose Appointment Date</h3>
              </div>

              <div className="sb-date-input-wrapper max-w-md">
                <FaCalendarAlt className="sb-date-icon" />
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot('');
                  }}
                  required
                  className="sb-date-input"
                />
              </div>

              {/* Quick Date Shortcut Chips */}
              <div className="sb-date-shortcuts">
                {dateChips.map((chip) => (
                  <button
                    key={chip.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(chip.iso);
                      setSelectedSlot('');
                    }}
                    className={`sb-date-chip ${selectedDate === chip.iso ? 'active' : ''}`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 3: Available Time Slots */}
            <div>
              <div className="sb-step-header justify-between">
                <div className="flex items-center gap-2">
                  <span className="sb-step-number">3</span>
                  <h3 className="sb-step-title">Select Appointment Slot</h3>
                </div>
                {availableSlots.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {availableSlots.length} Slots Available
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div className="sb-slot-empty flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
                  <span className="text-xs font-semibold">Updating slot calendar...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="sb-slot-empty">
                  <FaClock className="text-3xl text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No open slots found for {new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-3">
                    Try selecting another date from the shortcuts above or pick "First Available" stylist.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setSelectedDate(tomorrow.toISOString().split('T')[0]);
                      setSelectedSlot('');
                    }}
                    className="px-4 py-2 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-slate-700 transition-all border border-indigo-200/60 dark:border-slate-700"
                  >
                    Check Tomorrow's Schedule &rarr;
                  </button>
                </div>
              ) : (
                <div className="sb-slots-grid">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`sb-slot-btn ${isSelected ? 'active' : ''}`}
                      >
                        <span className="text-xs font-black">{formatSlotTime(slot)}</span>
                        <span className="text-[10px] font-medium opacity-80">
                          {isSelected ? '✓ Selected' : 'Available'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STEP 4: Client Contact Information */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="sb-step-header mb-4">
                <span className="sb-step-number">4</span>
                <h3 className="sb-step-title">Client Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sb-form-group mb-0">
                  <label className="sb-form-label">Client Full Name *</label>
                  <div className="sb-input-field-wrapper">
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Nathan Tamrat"
                      required
                      className="sb-input-control"
                    />
                    <FaUser className="sb-input-field-icon" />
                  </div>
                </div>

                {/* Phone */}
                <div className="sb-form-group mb-0">
                  <label className="sb-form-label">Phone Number *</label>
                  <div className="sb-input-field-wrapper">
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder="+251 9XX XXX XXX"
                      required
                      className="sb-input-control"
                    />
                    <FaPhone className="sb-input-field-icon" />
                  </div>
                </div>

                {/* Email */}
                <div className="sb-form-group mb-0 md:col-span-2">
                  <label className="sb-form-label">Email Confirmation (Optional)</label>
                  <div className="sb-input-field-wrapper">
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      placeholder="nathan@example.com"
                      className="sb-input-control"
                    />
                    <FaEnvelope className="sb-input-field-icon" />
                  </div>
                </div>

                {/* Notes */}
                <div className="sb-form-group mb-0 md:col-span-2">
                  <label className="sb-form-label">Special Notes / Requests</label>
                  <div className="sb-input-field-wrapper">
                    <textarea
                      rows={3}
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Special instructions, hair or skin sensitivities, styling references..."
                      className="sb-input-control !py-3 resize-none"
                    />
                    <FaStickyNote className="sb-input-textarea-icon" />
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Summary Box */}
            {selectedSlot && selectedDate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="sb-summary-card"
              >
                <div className="sb-summary-header">
                  <h4>Appointment Summary</h4>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-white/60 dark:bg-slate-900/60 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    Live Calculation
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="sb-summary-row">
                    <span className="sb-summary-row-label">Reserved Service</span>
                    <span className="sb-summary-row-value">{service.service_name}</span>
                  </div>
                  <div className="sb-summary-row">
                    <span className="sb-summary-row-label">Stylist</span>
                    <span className="sb-summary-row-value">{selectedBarberName}</span>
                  </div>
                  <div className="sb-summary-row">
                    <span className="sb-summary-row-label">Date & Slot</span>
                    <span className="sb-summary-row-value font-mono">
                      {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {formatSlotTime(selectedSlot)}
                    </span>
                  </div>
                  <div className="sb-summary-row">
                    <span className="sb-summary-row-label">Estimated Duration</span>
                    <span className="sb-summary-row-value">{service.duration_minutes} minutes</span>
                  </div>

                  {pricingInfo.discount > 0 && (
                    <div className="sb-summary-row">
                      <span className="sb-summary-row-label">Promotional Discount</span>
                      <span className="sb-summary-row-value text-emerald-600 dark:text-emerald-400 font-bold">
                        -{pricingInfo.discount} ETB
                      </span>
                    </div>
                  )}

                  <div className="sb-summary-total">
                    <span className="sb-summary-total-label">Total Amount</span>
                    <span className="sb-summary-total-value">
                      {pricingInfo.currentPrice} <span className="text-sm font-semibold">ETB</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quality & Trust Badges */}
            <div className="sb-guarantee-strip">
              <div className="sb-guarantee-item">
                <FaShieldAlt className="sb-guarantee-icon" />
                <span>Sanitized & Hospital-Grade Sterilization</span>
              </div>
              <div className="sb-guarantee-item">
                <FaCheckCircle className="sb-guarantee-icon" />
                <span>Free Cancellation Up to 2 Hours Before</span>
              </div>
              <div className="sb-guarantee-item">
                <FaUserTie className="sb-guarantee-icon" />
                <span>Certified & Verified Master Stylists</span>
              </div>
            </div>

            {/* Submit Reservation Button */}
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="sb-submit-btn"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Confirming Reservation...</span>
                </>
              ) : !selectedSlot ? (
                <>
                  <FaClock />
                  <span>Please Select a Time Slot Above</span>
                </>
              ) : !isAuthenticated ? (
                <>
                  <FaUser />
                  <span>Sign In & Confirm Reservation • {pricingInfo.currentPrice} ETB</span>
                </>
              ) : (
                <>
                  <FaCalendarAlt />
                  <span>Confirm & Reserve Appointment • {pricingInfo.currentPrice} ETB</span>
                </>
              )}
            </button>

            {!isAuthenticated && selectedSlot && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                🔒 Quick sign-in required to securely generate your booking reference code.
              </p>
            )}
          </form>
        </motion.div>

      </div>
    </div>
  );
};

export default ServiceBookingPage;
