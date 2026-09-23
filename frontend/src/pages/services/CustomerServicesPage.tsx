import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaClock, FaStar, FaSearch, FaTimes, FaChevronRight,
  FaTag, FaGem, FaSpa, FaHeart, FaCheck, FaComments
} from 'react-icons/fa';
import { Spinner, Modal } from 'react-bootstrap';
import { useAuth } from '../../components/Auth/AuthContext';
import { publicServiceApi, ratingsApi, Service, ServiceCategory } from '../../services/serviceService';

const CustomerServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // Rating Modal state
  const [ratingModalService, setRatingModalService] = useState<Service | null>(null);
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState<string | null>(null);
  const [ratingErrorMsg, setRatingErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, categoriesRes] = await Promise.all([
        publicServiceApi.getAll(),
        publicServiceApi.getCategories()
      ]);
      if (servicesRes.success) setServices(servicesRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (serviceId: number) => {
    navigate(`/services/book/${serviceId}`);
  };

  const handleOpenRatingModal = (service: Service) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/services' } });
      return;
    }
    setRatingModalService(service);
    setUserRating(5);
    setHoverRating(0);
    setReviewComment('');
    setRatingSuccessMsg(null);
    setRatingErrorMsg(null);
  };

  const handleCloseRatingModal = () => {
    setRatingModalService(null);
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModalService) return;

    setSubmittingRating(true);
    setRatingErrorMsg(null);
    setRatingSuccessMsg(null);

    try {
      const res = await ratingsApi.rateService(
        ratingModalService.id,
        userRating,
        reviewComment.trim() || undefined
      );

      if (res.success) {
        setRatingSuccessMsg('Thank you! Your verified rating & review have been submitted.');
        setTimeout(async () => {
          handleCloseRatingModal();
          // Refresh list to update ratings count & average
          await fetchData();
        }, 1500);
      } else {
        setRatingErrorMsg(res.message || 'Failed to submit review');
      }
    } catch (err: any) {
      setRatingErrorMsg(err?.message || 'An error occurred while submitting your review.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch =
      service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.short_description && service.short_description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || service.category_id === selectedCategory;
    const matchesFeatured = !showFeaturedOnly || service.is_featured;
    return matchesSearch && matchesCategory && matchesFeatured;
  });

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading beauty & spa catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Luxury Salon & Spa Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-slate-900 to-purple-950 p-8 md:p-12 text-white border border-rose-500/20 shadow-2xl"
      >
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <FaGem className="text-rose-400 text-xs" /> Luxe Beauty Salon & Spa Sanctuary
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight mb-4 leading-tight">
            Indulge in Premium <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Beauty & Wellness</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
            Explore our curated menu of bespoke hair styling, medical facials, luxury nail artistry, bridal makeup, and rejuvenating body spa rituals. Book online and join the live queue effortlessly.
          </p>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Verified Top Stylists & Therapists
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Live Salon Queue Tracking
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Authentic Customer Reviews
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search & Category Filter Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5 space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search treatments, hair styling, facials, spa massages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Featured Toggle */}
          <button
            onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 ${
              showFeaturedOnly
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FaStar className="text-xs" /> Featured Only
          </button>
        </div>

        {/* Category Pills Bar */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              !selectedCategory
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Services ({services.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = services.filter(s => s.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
                  isSelected
                    ? 'text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                style={isSelected ? { backgroundColor: cat.color || '#ec4899' } : {}}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cat.color || '#ec4899' }}
                />
                {cat.category_name}
                <span className="text-[10px] opacity-75 font-normal">({count})</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Results Count Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Showing <span className="text-slate-900 dark:text-white font-bold">{filteredServices.length}</span> curated beauty service{filteredServices.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 glass-card"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
            <FaSpa className="text-2xl" />
          </div>
          <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">No services found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your search query or choosing another category</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredServices.map((service, index) => {
              const ratingAvg = Number(service.rating_avg || 0);
              const ratingCount = Number(service.rating_count || 0);

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ delay: index * 0.04 }}
                  className="group glass-card-hover overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800 rounded-3xl"
                >
                  {/* Service Visual Header */}
                  <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {/* Background Banner or Service Image */}
                    {service.banner_image || service.service_image ? (
                      <img
                        src={
                          service.banner_image
                            ? (service.banner_image.startsWith('http') ? service.banner_image : `http://localhost:5005/${service.banner_image}`)
                            : (service.service_image?.startsWith('http') ? service.service_image : `http://localhost:5005/${service.service_image}`)
                        }
                        alt={service.service_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-500/20 via-pink-500/10 to-purple-500/20">
                        <FaSpa className="text-5xl text-rose-400/50" />
                      </div>
                    )}

                    {/* Dark gradient overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                    {/* Featured Ribbon */}
                    {service.is_featured && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-md shadow-amber-500/30">
                        <FaStar /> Featured
                      </div>
                    )}

                    {/* Category Tag */}
                    {service.category_name && (
                      <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5">
                        <FaTag className="text-[10px] text-rose-400" />
                        {service.category_name}
                      </div>
                    )}

                    {/* Price Tag */}
                    <div className="absolute top-3 right-3 px-3.5 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 text-right">
                      {service.discount_price ? (
                        <div>
                          <span className="text-xs text-slate-400 line-through mr-1.5">{service.price} ETB</span>
                          <span className="text-sm font-heading font-black text-rose-600 dark:text-rose-400">{service.discount_price} ETB</span>
                        </div>
                      ) : (
                        <span className="text-sm font-heading font-black text-rose-600 dark:text-rose-400">{service.price} ETB</span>
                      )}
                    </div>
                  </div>

                  {/* Service Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Rating Line */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-amber-400 text-xs">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                className={star <= Math.round(ratingAvg) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {ratingAvg > 0 ? ratingAvg.toFixed(1) : 'New'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({ratingCount} review{ratingCount !== 1 ? 's' : ''})
                          </span>
                        </div>

                        {service.service_type && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {service.service_type.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mb-1">
                        {service.service_name}
                      </h3>

                      {service.short_description && (
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
                          {service.short_description}
                        </p>
                      )}

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {service.description || 'Premium beauty care tailored to your unique elegance and well-being.'}
                      </p>
                    </div>

                    <div>
                      {/* Meta duration info */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1.5 font-medium">
                          <FaClock className="text-rose-500" />
                          Duration: <strong className="text-slate-800 dark:text-slate-200">{formatDuration(service.duration_minutes)}</strong>
                        </span>
                      </div>

                      {/* Action Buttons: Book & Rate */}
                      <div className="grid grid-cols-5 gap-2">
                        <button
                          onClick={() => handleBookService(service.id)}
                          disabled={!service.is_available}
                          className={`col-span-3 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md ${
                            service.is_available
                              ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-500/25 active:scale-95'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {service.is_available ? (
                            <>Book Now <FaChevronRight className="text-[10px]" /></>
                          ) : (
                            'Unavailable'
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenRatingModal(service)}
                          className="col-span-2 py-2.5 px-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
                          title="Share your review & rating for this service"
                        >
                          <FaComments className="text-xs text-rose-500" /> Rate
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Customer Rating & Review Modal */}
      <Modal
        show={!!ratingModalService}
        onHide={handleCloseRatingModal}
        centered
        backdrop="static"
        dialogClassName="modal-modern"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <FaStar className="text-base" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                  Rate Beauty Service
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ratingModalService?.service_name}
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseRatingModal}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1 rounded-lg"
            >
              <FaTimes />
            </button>
          </div>

          {ratingSuccessMsg ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaCheck className="text-xl" />
              </div>
              <h4 className="font-heading font-bold text-slate-900 dark:text-white text-base mb-1">Review Submitted!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{ratingSuccessMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitRating} className="space-y-5">
              {ratingErrorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {ratingErrorMsg}
                </div>
              )}

              {/* Star Rating Picker */}
              <div className="text-center py-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Select Your Rating
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                    >
                      <FaStar
                        className={
                          star <= (hoverRating || userRating)
                            ? 'text-amber-400 drop-shadow-sm'
                            : 'text-slate-200 dark:text-slate-700'
                        }
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-amber-500 mt-2">
                  {hoverRating || userRating} out of 5 stars
                </p>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details of your experience, the stylist's skill, ambiance, and results..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseRatingModal}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  {submittingRating ? (
                    <>
                      <Spinner animation="border" size="sm" /> Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CustomerServicesPage;
