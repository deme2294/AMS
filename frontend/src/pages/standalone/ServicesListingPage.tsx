import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicServiceApi, Service, ServiceCategory } from '../../services/serviceService';
import { motion } from 'framer-motion';
import { 
  FaSearch, FaCut, FaClock, FaMoneyBillWave, FaStar, FaCalendarAlt, FaToggleOff
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
    // Save selected service to localStorage
    localStorage.setItem('selectedServiceId', serviceId.toString());
    // Navigate to booking flow which handles authentication inline
    navigate(`/services/book/${serviceId}`);
  };

  return (
    <div className="bg-transparent text-slate-100 min-h-screen">
      {/* Page Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Our Services</h1>
        <p className="text-slate-400 font-light max-w-xl">
          Choose from our wide range of professional barber services. High quality grooming designed for you.
        </p>
      </div>

      {/* Filters (Glassmorphic) */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl mb-8 shadow-lg shadow-slate-950/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="" className="bg-slate-950">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-slate-950">{cat.category_name}</option>
            ))}
          </select>
          <button
            onClick={() => setOnlyFeatured(!onlyFeatured)}
            className={`px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-medium border ${
              onlyFeatured 
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
                : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <FaStar className={onlyFeatured ? 'text-yellow-400' : 'text-slate-400'} /> 
            <span>{onlyFeatured ? 'Featured Only' : 'Show Featured'}</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading services...</p>
        </div>
      )}

      {/* Services Grid */}
      {!loading && (
        <>
          {services.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800">
              <FaCut className="text-6xl text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-200 mb-2">No services found</h3>
              <p className="text-slate-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedServices.map((service, idx) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col h-full"
                >
                  {/* Service Image */}
                  <div className="relative h-48 bg-slate-950/40">
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
                      <span className="absolute top-3 right-3 bg-yellow-500/90 backdrop-blur-sm text-slate-950 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <FaStar /> Featured
                      </span>
                    )}
                    {!service.is_available && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-red-500/90 text-white font-bold px-4 py-1.5 rounded-full text-sm">
                          Currently Unavailable
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-white tracking-wide">{service.service_name}</h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded">
                        {service.category_name || 'General'}
                      </span>
                    </div>

                    {/* Rating summary (avg + per-star counts) */}
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex items-center gap-2">
                        {service.avg_rating != null && service.avg_rating > 0 ? (
                          <>
                            <FaStar className="text-yellow-400" />
                            <span className="text-sm font-bold text-slate-200">{service.avg_rating.toFixed(1)}</span>
                            <span className="text-xs text-slate-400">({service.total_ratings || 0} ratings)</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">No ratings yet</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const key = `stars_${star}` as keyof Service;
                          const count = (service as any)[key] as number | undefined;
                          const safeCount = count ?? 0;
                          return (
                            <span key={star} className="text-[11px] text-slate-300">
                              <span className="font-bold text-slate-200">{star}</span>
                              : <span className="font-bold text-blue-300">{safeCount}</span>
                            </span>
                          );
                        })}

                      </div>
                    </div>


                    <p className="text-slate-400 text-sm mb-6 flex-grow font-light leading-relaxed">
                      {service.description || 'Professional barber service'}
                    </p>

                    {/* Price & Duration */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        {service.discount_price ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 line-through">{service.price} ETB</span>
                            <span className="text-2xl font-black text-green-400">{service.discount_price} ETB</span>
                          </div>
                        ) : (
                          <span className="text-2xl font-black text-blue-400">{service.price} ETB</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg">
                        <FaClock className="text-blue-400" /> <span>{formatDuration(service.duration_minutes)}</span>
                      </div>
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={() => handleBookNow(service.id)}
                      disabled={!service.is_available}
                      className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                        service.is_available 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10 hover:shadow-blue-600/20' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      }`}
                    >
                      {service.is_available ? (
                        <>
                          <FaCalendarAlt />
                          <span>Book Appointment</span>
                        </>
                      ) : (
                        <>
                          <FaToggleOff />
                          <span>Unavailable</span>
                        </>
                      )}
                    </button>
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
                  className={`px-4 py-2 rounded-xl font-medium border transition-all ${
                    currentPage === page 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10' 
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
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
