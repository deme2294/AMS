import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicServiceApi, Service, ServiceCategory } from '../../services/serviceService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaCut, 
  FaClock, 
  FaStar, 
  FaCalendarAlt, 
  FaUserPlus, 
  FaCheckCircle, 
  FaMagic,
  FaShieldAlt,
  FaPhoneAlt,
  FaEye,
  FaTimes,
  FaInfoCircle,
  FaTag
} from 'react-icons/fa';
import { useAuth } from '../../components/Auth/AuthContext';

const ITEMS_PER_PAGE = 12;

const PublicHomepage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingService, setViewingService] = useState<Service | null>(null);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await publicServiceApi.getAll({
        category: selectedCategory || undefined,
        featured: onlyFeatured ? true : undefined,
        search: searchTerm || undefined,
      });
      if (response.success) {
        setServices(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await publicServiceApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchServices();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, selectedCategory, onlyFeatured]);

  const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE);
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return services.slice(start, start + ITEMS_PER_PAGE);
  }, [services, currentPage]);

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const handleBookNow = (serviceId: number) => {
    localStorage.setItem('selectedServiceId', serviceId.toString());
    navigate(`/services/book/${serviceId}`);
  };

  const handleRegister = () => {
    navigate('/register');
  };

  // Star Rating helpers
  const renderStars = (rating: number): JSX.Element[] => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = rating >= i + 1;
      const half = !filled && rating >= i + 0.5;
      return (
        <FaStar
          key={i}
          className={filled ? 'text-amber-400' : half ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}
          style={half ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
        />
      );
    });
  };

  const formatRating = (rating: number | null | undefined): string => {
    if (rating == null || isNaN(rating)) return '0.0';
    return rating.toFixed(1);
  };

  const handleRateService = (serviceId: number) => {
    navigate(`/rate-service/${serviceId}`);
  };

  return (
    <div className="bg-transparent text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300">
      
      {/* HERO SECTION - Beautifully Tailored for Both Light & Dark Themes */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 dark:from-[#0b0f1a] dark:via-[#070a12] dark:to-[#10172a] border border-indigo-400/30 dark:border-slate-800/90 rounded-[2.5rem] p-8 md:p-14 mb-12 shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-950/40 text-white transition-all duration-300">
        {/* Atmospheric Lighting Blobs */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-white/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-blue-400/15 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center py-4 md:py-6">
          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 dark:bg-indigo-950/70 border border-white/25 dark:border-indigo-500/30 backdrop-blur-md text-white dark:text-indigo-200 text-xs font-black uppercase tracking-wider mb-6 shadow-sm"
          >
            <FaCut className="text-amber-300 dark:text-amber-400" />
            <span>Master Craftsmen & Modern Grooming</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl font-heading font-black tracking-tight mb-5 leading-[1.15]"
          >
            Elevate Your Style with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-blue-100 to-amber-200 dark:from-blue-300 dark:via-indigo-200 dark:to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
              Precision Barbering
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg md:text-xl text-indigo-50 dark:text-slate-300 mb-8 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Experience artisan haircuts, beard sculpting, and hot towel treatments. 
            Book your appointment online with instant queue tracking.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {!isAuthenticated && (
              <button
                onClick={handleRegister}
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-indigo-700 hover:bg-slate-50 font-bold rounded-xl shadow-xl shadow-black/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider"
              >
                <FaUserPlus />
                <span>Create Account</span>
              </button>
            )}
            <button
              onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-3.5 border border-white/40 dark:border-slate-700/60 text-white font-bold rounded-xl hover:bg-white/15 dark:hover:bg-white/10 backdrop-blur-sm transition-all flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider"
            >
              <span>Explore Services</span>
            </button>
          </motion.div>

          {/* Feature Highlights Banner */}
          <div className="mt-12 pt-8 border-t border-white/20 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-white dark:text-slate-300">
            <div className="flex items-center justify-center gap-2 bg-white/10 dark:bg-transparent py-2 px-3 rounded-xl backdrop-blur-sm">
              <FaCheckCircle className="text-emerald-300 dark:text-emerald-400 text-sm" />
              <span>Certified Professional Barbers</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-white/10 dark:bg-transparent py-2 px-3 rounded-xl backdrop-blur-sm">
              <FaCheckCircle className="text-emerald-300 dark:text-emerald-400 text-sm" />
              <span>Instant Confirmation & Tracking</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-white/10 dark:bg-transparent py-2 px-3 rounded-xl backdrop-blur-sm">
              <FaCheckCircle className="text-emerald-300 dark:text-emerald-400 text-sm" />
              <span>Sanitized & Modern Studio</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services-section" className="py-4">
        <div className="w-full">
          
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <FaMagic className="text-amber-500 text-[11px]" />
              <span>Curated Treatments</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Our Professional Services
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base font-normal">
              Select from our curated menu of hair, beard, and facial grooming treatments.
            </p>
          </div>

          {/* Filters Bar - Beautiful in Both Themes */}
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 rounded-2xl mb-8 shadow-sm dark:shadow-xl transition-colors">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search hair cut, shave, beard trim..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm font-medium"
                />
              </div>

              {/* Category Select */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer text-sm font-semibold"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                ))}
              </select>

              {/* Featured Only Toggle */}
              <button
                onClick={() => setOnlyFeatured(!onlyFeatured)}
                className={`px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm border ${
                  onlyFeatured
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <FaStar className={onlyFeatured ? 'text-amber-500' : 'text-slate-400'} />
                <span>{onlyFeatured ? 'Featured Only' : 'Show Featured'}</span>
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
              <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading barber services...</p>
            </div>
          )}

          {/* Services Grid - Pristine Cards in Both Themes */}
          {!loading && (
            <>
              {services.length === 0 ? (
                <div className="text-center py-16 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <FaCut className="text-6xl text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold font-heading text-slate-800 dark:text-slate-200 mb-2">No services found</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Try adjusting your search criteria or category filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedServices.map((service, idx) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl overflow-hidden hover:border-indigo-400/60 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                      {/* Service Image Section */}
                      <div 
                        onClick={() => setViewingService(service)}
                        className="relative h-48 sm:h-52 bg-slate-100 dark:bg-slate-950/80 overflow-hidden cursor-pointer group/img"
                        title="Click to view full service details"
                      >
                        {service.service_image ? (
                          <img
                            src={service.service_image.startsWith('http') ? service.service_image : `http://localhost:5005/${service.service_image}`}
                            alt={service.service_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { 
                              e.currentTarget.src = ''; 
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                            <FaCut className="text-5xl text-slate-300 dark:text-slate-700 mb-2" />
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Barber Service</span>
                          </div>
                        )}
                        
                        {/* Quick View Overlay on Image Hover */}
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                            <FaEye className="text-indigo-600 dark:text-indigo-400" /> Quick View
                          </span>
                        </div>

                        {/* Featured Badge */}
                        {service.is_featured && (
                          <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md shadow-amber-500/25 z-10">
                            <FaStar className="text-[10px]" /> Featured
                          </span>
                        )}

                        {/* Availability Pill */}
                        <div className="absolute bottom-3 left-3 z-10">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                            service.is_available 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-rose-600 text-white'
                          }`}>
                            {service.is_available ? 'Available' : 'Booked Out'}
                          </span>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2.5 gap-2">
                          <h3 
                            onClick={() => setViewingService(service)}
                            className="text-lg font-heading font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                            title="Click to view full service details"
                          >
                            {service.service_name}
                          </h3>
                          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-500/30 px-2.5 py-1 rounded-lg flex-shrink-0">
                            {service.category_name || 'General'}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex-grow font-normal leading-relaxed line-clamp-2">
                          {service.description || 'Professional grooming and barbering service.'}
                        </p>

                        {/* Pricing, Rating & Duration */}
                        <div className="flex items-end justify-between mb-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex flex-col">
                            {service.discount_price ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-slate-400 line-through font-medium">{service.price} ETB</span>
                                <span className="text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                                  {service.discount_price} <span className="text-xs font-bold text-slate-500">ETB</span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-2xl font-heading font-black text-indigo-600 dark:text-indigo-400">
                                {service.price} <span className="text-xs font-bold text-slate-500">ETB</span>
                              </span>
                            )}
                            
                            {/* Star Rating Row */}
                            <div className="flex items-center gap-1.5 mt-1">
                              {service.avg_rating && service.avg_rating > 0 ? (
                                <>
                                  <div className="flex items-center gap-0.5">
                                    {renderStars(service.avg_rating)}
                                  </div>
                                  <span className="text-xs text-amber-500 font-bold ml-0.5">
                                    {formatRating(service.avg_rating)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({service.total_ratings || 0})
                                  </span>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No ratings yet</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 px-2.5 py-1.5 rounded-lg font-semibold">
                            <FaClock className="text-indigo-600 dark:text-indigo-400" /> 
                            <span>{formatDuration(service.duration_minutes)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2.5">
                          {/* View Details & Rate Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setViewingService(service)}
                              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 border border-indigo-200/90 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white hover:border-indigo-600 shadow-sm active:scale-95"
                              title="View complete details, duration & features of this service"
                            >
                              <FaEye className="text-sm" />
                              <span>View Details</span>
                            </button>

                            <button
                              onClick={() => handleRateService(service.id)}
                              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 shadow-sm active:scale-95"
                              title="Rate and review this service"
                            >
                              <FaStar className="text-amber-400 text-xs" />
                              <span>Rate Service</span>
                            </button>
                          </div>

                          {/* Primary Book Appointment Button */}
                          <button
                            onClick={() => handleBookNow(service.id)}
                            disabled={!service.is_available}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md text-sm uppercase tracking-wider ${
                              service.is_available 
                                ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.98]' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent'
                            }`}
                          >
                            <FaCalendarAlt />
                            <span>{service.is_available ? 'Book Appointment' : 'Unavailable'}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12 gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all ${
                        currentPage === page 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25' 
                          : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* SERVICE DETAILS MODAL */}
      <AnimatePresence>
        {viewingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingService(null)}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Image & Header Banner */}
              <div className="relative h-60 sm:h-72 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex-shrink-0">
                {viewingService.banner_image || viewingService.service_image ? (
                  <img
                    src={
                      viewingService.banner_image
                        ? (viewingService.banner_image.startsWith('http') ? viewingService.banner_image : `http://localhost:5005/${viewingService.banner_image}`)
                        : (viewingService.service_image?.startsWith('http') ? viewingService.service_image : `http://localhost:5005/${viewingService.service_image}`)
                    }
                    alt={viewingService.service_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-slate-950">
                    <FaCut className="text-6xl text-indigo-400/40 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-300/60">Service Profile</span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/30" />

                {/* Close Button */}
                <button
                  onClick={() => setViewingService(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 z-20"
                  aria-label="Close dialog"
                >
                  <FaTimes className="text-sm" />
                </button>

                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  {viewingService.category_name && (
                    <span className="px-3 py-1 bg-indigo-600/90 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-md">
                      {viewingService.category_name}
                    </span>
                  )}
                  {viewingService.is_featured && (
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md shadow-amber-500/30">
                      <FaStar className="text-[10px]" /> Featured
                    </span>
                  )}
                </div>

                {/* Bottom title inside banner */}
                <div className="absolute bottom-4 left-4 right-4">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                    viewingService.is_available ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {viewingService.is_available ? 'Available for Booking' : 'Currently Unavailable'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-heading font-black text-white leading-tight drop-shadow-md">
                    {viewingService.service_name}
                  </h2>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-200">
                {/* Pricing & Ratings Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Service Price</span>
                    <div className="flex items-baseline gap-2">
                      {viewingService.discount_price ? (
                        <>
                          <span className="text-2xl sm:text-3xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                            {viewingService.discount_price} <span className="text-xs font-bold text-slate-400">ETB</span>
                          </span>
                          <span className="text-sm line-through text-slate-400 font-semibold">
                            {viewingService.price} ETB
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            Save {viewingService.price - viewingService.discount_price} ETB
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl sm:text-3xl font-heading font-black text-indigo-600 dark:text-indigo-400">
                          {viewingService.price} <span className="text-xs font-bold text-slate-400">ETB</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Customer Rating</span>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="flex items-center gap-0.5">
                        {renderStars(viewingService.avg_rating || 0)}
                      </div>
                      <span className="text-sm font-bold text-amber-500">
                        {formatRating(viewingService.avg_rating)}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({viewingService.total_ratings || 0})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">
                      <FaClock /> Duration
                    </div>
                    <div className="text-sm font-black text-slate-800 dark:text-white">
                      {formatDuration(viewingService.duration_minutes)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                      <FaShieldAlt /> Service Type
                    </div>
                    <div className="text-sm font-black text-slate-800 dark:text-white uppercase truncate">
                      {viewingService.service_type ? viewingService.service_type.replace('_', ' ') : 'Standard'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-bold mb-1">
                      <FaMagic /> Prep / Buffer
                    </div>
                    <div className="text-sm font-black text-slate-800 dark:text-white">
                      {viewingService.preparation_time ? `${viewingService.preparation_time}m prep` : `${viewingService.booking_buffer_time || 0}m buffer`}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">
                      <FaCut /> Specialist
                    </div>
                    <div className="text-sm font-black text-slate-800 dark:text-white truncate">
                      {viewingService.barber_name || 'Assigned Barber'}
                    </div>
                  </div>
                </div>

                {/* Short Description Quote if available */}
                {viewingService.short_description && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-500 text-sm font-medium text-indigo-950 dark:text-indigo-200 italic">
                    "{viewingService.short_description}"
                  </div>
                )}

                {/* Full Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-heading">
                    Detailed Description
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                    {viewingService.description || 'Our professional grooming specialists deliver an impeccable experience using premium tools and skin-friendly products. Every appointment is personalized to match your unique style and comfort.'}
                  </p>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                <button
                  onClick={() => setViewingService(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                >
                  Close
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const id = viewingService.id;
                      setViewingService(null);
                      handleRateService(id);
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-amber-500 hover:border-amber-400/50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <FaStar className="text-amber-400 text-xs" />
                    <span>Rate Service</span>
                  </button>

                  <button
                    onClick={() => {
                      const id = viewingService.id;
                      setViewingService(null);
                      handleBookNow(id);
                    }}
                    disabled={!viewingService.is_available}
                    className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all ${
                      viewingService.is_available
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/30 active:scale-95'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <FaCalendarAlt />
                    <span>{viewingService.is_available ? 'Book Appointment' : 'Unavailable'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicHomepage;
