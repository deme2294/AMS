import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicServiceApi, Service, ServiceCategory } from '../../services/serviceService';
import { motion } from 'framer-motion';
import { 
  FaSearch, FaCut, FaClock, FaStar, FaCalendarAlt, FaToggleOff, FaEye
} from 'react-icons/fa';

const ITEMS_PER_PAGE = 12;

const ServicesListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  return (
    <div className="bg-transparent text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Our Services Catalog
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-normal max-w-xl text-sm sm:text-base">
          Choose from our complete portfolio of haircuts, beard maintenance, and grooming packages.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl mb-8 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
            />
          </div>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer text-sm font-medium"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.category_name}</option>
            ))}
          </select>
          <button
            onClick={() => setOnlyFeatured(!onlyFeatured)}
            className={`px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold text-sm border ${
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

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-medium">Loading services...</p>
        </div>
      )}

      {/* Services Grid */}
      {!loading && (
        <>
          {services.length === 0 ? (
            <div className="text-center py-16 bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800">
              <FaCut className="text-6xl text-slate-400 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No services found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedServices.map((service, idx) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group bg-white/90 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/90 rounded-2xl overflow-hidden hover:border-indigo-500/40 dark:hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                >
                  {/* Service Image */}
                  <div className="relative h-48 sm:h-52 bg-slate-100 dark:bg-slate-950/60 overflow-hidden">
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
                    {service.is_featured && (
                      <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                        <FaStar className="text-[10px]" /> Featured
                      </span>
                    )}
                    {!service.is_available && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-rose-500/90 text-white font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider">
                          Currently Unavailable
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2.5 gap-2">
                      <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {service.service_name}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 px-2.5 py-1 rounded-lg flex-shrink-0">
                        {service.category_name || 'General'}
                      </span>
                    </div>

                    {/* Rating summary */}
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex items-center gap-2">
                        {service.avg_rating != null && service.avg_rating > 0 ? (
                          <>
                            <FaStar className="text-amber-400" />
                            <span className="text-sm font-bold text-amber-500">{service.avg_rating.toFixed(1)}</span>
                            <span className="text-xs text-slate-400">({service.total_ratings || 0} reviews)</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No ratings yet</span>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex-grow font-normal leading-relaxed line-clamp-2">
                      {service.description || 'Professional barber and grooming service.'}
                    </p>

                    {/* Price & Duration */}
                    <div className="flex items-end justify-between mb-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <div>
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
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 px-2.5 py-1.5 rounded-lg font-medium">
                        <FaClock className="text-indigo-600 dark:text-indigo-400" /> 
                        <span>{formatDuration(service.duration_minutes)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate(`/services/${service.id}`)}
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 border border-indigo-200/90 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white shadow-sm"
                        >
                          <FaEye className="text-sm" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => handleBookNow(service.id)}
                          disabled={!service.is_available}
                          className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-md text-xs uppercase tracking-wider ${
                            service.is_available 
                              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white' 
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <FaCalendarAlt />
                          <span>{service.is_available ? 'Book' : 'Booked'}</span>
                        </button>
                      </div>
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
                  className={`px-4 py-2 rounded-xl font-semibold text-sm border transition-all ${
                    currentPage === page 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
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
  );
};

export default ServicesListingPage;
