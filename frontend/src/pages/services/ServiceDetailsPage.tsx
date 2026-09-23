import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaStar, FaClock, FaMoneyBillWave, FaTag, 
  FaCheckCircle, FaTimesCircle, FaUser, FaCut, FaChevronRight,
  FaCalendarAlt, FaHeart, FaRegHeart, FaShare, FaMapMarkerAlt
} from 'react-icons/fa';
import { Spinner, Badge, Modal, Button } from 'react-bootstrap';
import { useAuth } from '../../components/Auth/AuthContext';
import { publicServiceApi, Service, bookingApi } from '../../services/serviceService';
import { BACKEND_URL } from '../../services/apiService';

const ServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [service, setService] = useState<Service | null>(null);
  const [barbers, setBarbers] = useState<Array<{ id: number; full_name: string; profile_image?: string }>>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'reviews' | 'barbers'>('overview');

  useEffect(() => {
    if (id) {
      fetchServiceDetails();
    }
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const serviceRes = await publicServiceApi.getById(parseInt(id!));
      if (serviceRes.success) {
        setService(serviceRes.data);
      }

      // Fetch barbers for this service
      const barbersRes = await bookingApi.getBarbers();
      if (barbersRes.success) {
        setBarbers(barbersRes.data);
      }

      // TODO: Fetch reviews for this service
      // const reviewsRes = await reviewApi.getByService(parseInt(id!));
      // if (reviewsRes.success) setReviews(reviewsRes.data);
      
    } catch (error) {
      console.error('Failed to fetch service details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!user) {
      navigate('/login', { state: { from: `/services/${id}` } });
      return;
    }
    navigate(`/services/book/${id}`);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Save to favorites API
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-16">
        <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Service Not Found</h3>
        <button
          onClick={() => navigate('/services')}
          className="btn btn-primary"
        >
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/services')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 group"
      >
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        Back to Services
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden"
          >
            {/* Service Image */}
            <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-slate-600">
              {service.service_image ? (
                <img
                  src={service.service_image.startsWith('http') ? service.service_image : `${BACKEND_URL}${service.service_image}`}
                  alt={service.service_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaCut className="text-8xl text-blue-300 dark:text-slate-500 opacity-50" />
                </div>
              )}
              
              {/* Overlay Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {service.is_featured && (
                  <Badge bg="warning" className="px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 shadow-lg">
                    <FaStar /> Featured
                  </Badge>
                )}
                {service.category_name && (
                  <Badge bg="primary" className="px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 shadow-lg">
                    <FaTag /> {service.category_name}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={toggleFavorite}
                  className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                >
                  {isFavorite ? (
                    <FaHeart className="text-red-500" />
                  ) : (
                    <FaRegHeart className="text-gray-600 dark:text-gray-300" />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <FaShare className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Service Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {service.service_name}
                  </h1>
                  <div className="flex items-center gap-3 text-sm">
                    {service.avg_rating && (
                      <div className="flex items-center gap-1.5">
                        {renderStars(service.avg_rating)}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {service.avg_rating.toFixed(1)}
                        </span>
                        {service.total_ratings && (
                          <span className="text-gray-500 dark:text-gray-400">
                            ({service.total_ratings} reviews)
                          </span>
                        )}
                      </div>
                    )}
                    {(service as any).total_bookings && (
                      <span className="text-gray-500 dark:text-gray-400">
                        • {(service as any).total_bookings} bookings
                      </span>
                    )}
                  </div>
                </div>

                {/* Availability Status */}
                <div className="flex items-center gap-2">
                  {service.is_available ? (
                    <>
                      <FaCheckCircle className="text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Available
                      </span>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="text-red-500" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        Unavailable
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 text-sm">
                    <FaMoneyBillWave />
                    <span>Price</span>
                  </div>
                  <div className="font-bold text-xl text-gray-900 dark:text-white">
                    {service.discount_price ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-green-600">{service.discount_price} ETB</span>
                        <span className="text-sm text-gray-400 line-through">{service.price}</span>
                      </div>
                    ) : (
                      <span>{service.price} ETB</span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 text-sm">
                    <FaClock />
                    <span>Duration</span>
                  </div>
                  <div className="font-bold text-xl text-gray-900 dark:text-white">
                    {formatDuration(service.duration_minutes)}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 text-sm">
                    <FaCut />
                    <span>Type</span>
                  </div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white capitalize">
                    {service.service_type?.replace('_', ' ') || 'Standard'}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-slate-600 mb-6">
                <div className="flex gap-6">
                  {['overview', 'reviews', 'barbers'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab as any)}
                      className={`pb-3 px-1 text-sm font-medium capitalize transition-colors relative ${
                        selectedTab === tab
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab}
                      {selectedTab === tab && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div>
                {selectedTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose dark:prose-invert max-w-none"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      About This Service
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {service.description || 'Professional service tailored to meet your needs with expert care and attention to detail.'}
                    </p>

                    {service.short_description && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-200">
                          {service.short_description}
                        </p>
                      </div>
                    )}

                    {/* Additional Details */}
                    <div className="mt-6 space-y-3">
                      {service.preparation_time > 0 && (
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Preparation Time:</span>
                          <span>{service.preparation_time} minutes</span>
                        </div>
                      )}
                      {service.cleanup_time > 0 && (
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Cleanup Time:</span>
                          <span>{service.cleanup_time} minutes</span>
                        </div>
                      )}
                      {service.max_customers_per_slot > 1 && (
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Capacity:</span>
                          <span>Up to {service.max_customers_per_slot} customers per slot</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {selectedTab === 'reviews' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <FaStar className="text-5xl text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No reviews yet. Be the first to review!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Reviews will be rendered here */}
                      </div>
                    )}
                  </motion.div>
                )}

                {selectedTab === 'barbers' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {barbers.length === 0 ? (
                      <div className="col-span-2 text-center py-12">
                        <FaUser className="text-5xl text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          Any available barber can perform this service
                        </p>
                      </div>
                    ) : (
                      barbers.slice(0, 4).map((barber) => (
                        <div
                          key={barber.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl hover:shadow-md transition-shadow"
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                            {barber.full_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {barber.full_name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Professional Barber
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Booking Sidebar - Right Column */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 sticky top-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Book This Service
            </h3>

            {/* Price Highlight */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Price</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {service.discount_price ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-green-600">{service.discount_price} ETB</span>
                    <span className="text-lg text-gray-400 line-through">{service.price} ETB</span>
                  </div>
                ) : (
                  <span>{service.price} ETB</span>
                )}
              </div>
              {service.discount_price && (
                <div className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-green-600">
                  Save {(service.price - service.discount_price).toFixed(2)} ETB
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Duration</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatDuration(service.duration_minutes)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Category</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {service.category_name}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Type</span>
                <span className="font-semibold text-gray-900 dark:text-white capitalize">
                  {service.service_type?.replace('_', ' ') || 'Standard'}
                </span>
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleBookNow}
              disabled={!service.is_available}
              className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
                service.is_available
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]'
                  : 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {service.is_available ? (
                <>
                  <FaCalendarAlt />
                  Book Appointment
                  <FaChevronRight className="text-sm" />
                </>
              ) : (
                'Currently Unavailable'
              )}
            </button>

            {!user && (
              <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                You'll be redirected to login before booking
              </p>
            )}

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                What's Included
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Professional service by experienced barbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Premium grooming products</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Comfortable waiting area</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Satisfaction guaranteed</span>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                Need Help?
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Contact us for any questions about this service
              </p>
              <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Contact Support
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Share Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Share Service</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3 text-gray-600 dark:text-gray-400">
            Share this service with your friends
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={window.location.href}
              readOnly
              className="form-control flex-1"
            />
            <Button
              variant="primary"
              onClick={() => copyToClipboard(window.location.href)}
            >
              Copy
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ServiceDetailsPage;
