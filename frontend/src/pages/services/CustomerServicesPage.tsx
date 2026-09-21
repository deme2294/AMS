import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCut, FaClock, FaMoneyBillWave, FaStar, FaSearch,
  FaFilter, FaTimes, FaChevronRight, FaTag
} from 'react-icons/fa';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '../../components/Auth/AuthContext';
import { publicServiceApi, Service, ServiceCategory } from '../../services/serviceService';

const CustomerServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

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

  const filteredServices = services.filter(service => {
    const matchesSearch =
      service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
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
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
            <h1 className="text-3xl font-heading font-black tracking-tight text-slate-900 dark:text-white">
              Service Catalog
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Browse our hand-crafted grooming treatments, premium styling packages, and book your next appointment in seconds.
          </p>
        </motion.div>
      </div>

      {/* Search & Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search services, styles, or packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
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

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                !selectedCategory
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.category_name}
              </button>
            ))}
            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 ${
                showFeaturedOnly
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FaStar className="text-xs" /> Featured
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Showing <span className="text-slate-900 dark:text-white font-bold">{filteredServices.length}</span> available service{filteredServices.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 glass-card"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
            <FaCut className="text-3xl" />
          </div>
          <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">No services found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your search query or select another category</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ delay: index * 0.04 }}
                className="group glass-card-hover overflow-hidden flex flex-col"
              >
                {/* Service Image */}
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {service.service_image ? (
                    <img
                      src={service.service_image.startsWith('http') ? service.service_image : `http://localhost:5005/${service.service_image}`}
                      alt={service.service_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                      <FaCut className="text-4xl text-indigo-400/60" />
                    </div>
                  )}

                  {/* Featured Badge */}
                  {service.is_featured && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-md shadow-amber-500/30">
                      <FaStar /> Featured
                    </div>
                  )}

                  {/* Price Tag */}
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
                    <div className="flex items-center gap-1.5">
                      {service.discount_price ? (
                        <>
                          <span className="text-sm font-heading font-black text-emerald-600 dark:text-emerald-400">{service.discount_price} ETB</span>
                          <span className="text-xs text-slate-400 line-through">{service.price}</span>
                        </>
                      ) : (
                        <span className="text-sm font-heading font-black text-indigo-600 dark:text-indigo-400">{service.price} ETB</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="mb-2">
                      {service.category_name && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full mb-2">
                          <FaTag className="text-[9px]" /> {service.category_name}
                        </span>
                      )}
                      <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {service.service_name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                      {service.description || 'Professional grooming tailored to your style.'}
                    </p>
                  </div>

                  <div>
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 font-medium">
                        <FaClock className="text-indigo-500" />
                        {formatDuration(service.duration_minutes)}
                      </span>
                      {service.service_type && (
                        <span className="flex items-center gap-1.5 capitalize font-medium">
                          <FaCut className="text-purple-500" />
                          {service.service_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={() => handleBookService(service.id)}
                      disabled={!service.is_available}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
                        service.is_available
                          ? 'btn-modern-primary'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {service.is_available ? (
                        <>Book Appointment <FaChevronRight className="text-[10px]" /></>
                      ) : (
                        'Currently Unavailable'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CustomerServicesPage;
