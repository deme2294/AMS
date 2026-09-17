import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCut, FaSearch, FaFilter, FaSort, FaTimes, FaCheckCircle,
  FaCalendarAlt, FaUser, FaMapMarkerAlt, FaMoneyBillWave, FaClock,
  FaPhone, FaEnvelope, FaFacebookF, FaTwitter, FaInstagram
} from 'react-icons/fa';
import { Alert, Spinner } from 'react-bootstrap';
import { publicServiceApi } from '../../services/serviceService';

const PublicServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest'); // latest, price-low, price-high, name

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [servicesRes, categoriesRes, barbersRes] = await Promise.all([
        publicServiceApi.getAll(),
        publicServiceApi.getCategories(),
        publicServiceApi.getBarbers()
      ]);

      if (servicesRes.success) setServices(servicesRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (barbersRes.success) setBarbers(barbersRes.data);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || String(service.category_id) === selectedCategory;
    const matchesBarber = selectedBarber === 'all' || String(service.barber_id) === selectedBarber;
    return matchesSearch && matchesCategory && matchesBarber;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'name') return a.service_name.localeCompare(b.service_name);
    // default: latest (by created_at descending) - assuming API returns in that order or we can use id
    return b.id - a.id;
  });

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading Services...</h2>
          <Spinner animation="border" variant="primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaCut className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Our Services</h1>
                <p className="mt-1 text-sm text-gray-500">Professional barber services for your grooming needs</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Home</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">About</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Services</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by service name or description..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Barber Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Barber</label>
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Barbers</option>
                {barbers.map(barber => (
                  <option key={barber.id} value={barber.id}>
                    {barber.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="latest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Count */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-500">
            {sortedServices.length} service{sortedServices.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedServices.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <FaCut className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No services found</h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            sortedServices.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
              >
                {service.service_image && (
                  <div className="relative h-48">
                    <img
                      src={service.service_image}
                      alt={service.service_name}
                      className="w-full h-full object-cover"
                    />
                    {service.is_featured && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        FEATURED
                      </div>
                    )}
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{service.service_name}</h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <FaMoneyBillWave className="text-gray-500" />
                      <span className="font-medium">{service.price}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {service.description || 'No description available'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <FaClock />
                      {formatDuration(service.duration_minutes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaUser />
                      {service.barber_name || 'Team Barber'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt />
                      {service.category_name || 'General'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/services/book/${service.id}`)}
                    className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Load More Button (if implementing pagination) */}
        <div className="mt-8 text-center">
          <button
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More Services
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">My Salon</h3>
              <p className="text-sm text-gray-300">
                Professional barber services since 2020. We're dedicated to providing the best grooming experience for our customers.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Home</a></li>
                <li><a href="#" className="hover:text-white">Services</a></li>
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <p className="text-sm text-gray-300">
                <FaMapMarkerAlt className="mr-2" /> 123 Barber Street, Cityville
              </p>
              <p className="text-sm text-gray-300">
                <FaPhone className="mr-2" /> +1 (555) 123-4567
              </p>
              <p className="text-sm text-gray-300">
                <FaEnvelope className="mr-2" /> info@mysalon.com
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <FaFacebookF />
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <FaTwitter />
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <FaInstagram />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 mt-10 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} My Salon. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicServicesPage;