import React, { useEffect, useState } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCut, FaCalendarAlt, FaUser, FaSignOutAlt, FaHome, 
  FaHistory, FaClock, FaMoneyBillWave, FaStar, FaSearch,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaChevronRight, FaBars, FaTimes
} from 'react-icons/fa';
import { Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../components/Auth/AuthContext';
import { publicServiceApi, bookingApi, Service, ServiceCategory } from '../../services/serviceService';

interface Booking {
  id: number;
  service_name: string;
  barber_name: string;
  booking_date: string;
  time_slot: string;
  status: string;
  price: number;
  reference_number: string | null;
  approval_status: 'waiting' | 'approved' | 'rejected';
  queue_status: 'not_started' | 'queued' | 'serving' | 'completed';
}

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'services' | 'appointments' | 'profile'>('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/dashboard/overview' } });
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated]);

   const fetchDashboardData = async () => {
     try {
       setLoading(true);
       const [servicesRes, categoriesRes, bookingsRes] = await Promise.all([
         publicServiceApi.getAll(),
         publicServiceApi.getCategories(),
         bookingApi.getCustomerBookings()
       ]);
       
       if (servicesRes.success) setServices(servicesRes.data);
       if (categoriesRes.success) setCategories(categoriesRes.data);
       if (bookingsRes.success) setBookings(bookingsRes.data);
       
     } catch (error) {
       console.error('Failed to fetch dashboard data:', error);
     } finally {
       setLoading(false);
     }
   };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleBookService = (serviceId: number) => {
    navigate(`/services/book/${serviceId}`);
  };

  const filteredServices = services.filter(service => 
    service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const Sidebar = () => (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: sidebarOpen ? 0 : -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:shadow-none transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FaCut className="text-white text-lg" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">My Salon</h2>
              <p className="text-xs text-gray-500">Customer Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveSection('overview'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'overview' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaHome />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveSection('services'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'services' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaCut />
            <span className="font-medium">Browse Services</span>
          </button>

          <button
            onClick={() => { setActiveSection('appointments'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'appointments' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaCalendarAlt />
            <span className="font-medium">My Appointments</span>
          </button>

          <button
            onClick={() => { setActiveSection('profile'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'profile' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaUser />
            <span className="font-medium">Profile</span>
          </button>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-800">{user?.name || 'Customer'}</p>
            <p className="text-xs text-gray-500">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FaSignOutAlt />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </motion.aside>
  );

  const OverviewSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FaCut className="text-3xl opacity-80" />
            <span className="text-4xl font-bold">{services.length}</span>
          </div>
          <p className="text-sm opacity-90">Available Services</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FaCalendarAlt className="text-3xl opacity-80" />
            <span className="text-4xl font-bold">{bookings.length}</span>
          </div>
          <p className="text-sm opacity-90">Total Bookings</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FaClock className="text-3xl opacity-80" />
            <span className="text-4xl font-bold">
              {bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length}
            </span>
          </div>
          <p className="text-sm opacity-90">Upcoming Appointments</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Welcome Back!</h3>
        <p className="text-gray-600 mb-4">
          Welcome to your customer dashboard. Browse our services and book your next appointment.
        </p>
        <button
          onClick={() => setActiveSection('services')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Services
        </button>
      </div>
    </div>
  );

  const ServicesSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Browse Services</h2>
        <div className="flex-1 max-w-md w-full">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Spinner animation="border" variant="primary" />
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FaCut className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No services found</h3>
          <p className="text-gray-500">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
            >
              {service.service_image && (
                <img
                  src={service.service_image}
                  alt={service.service_name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{service.service_name}</h3>
                  {service.is_featured && (
                    <FaStar className="text-yellow-500" />
                  )}
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
                    <FaMoneyBillWave />
                    ${service.price}
                  </span>
                </div>
                <button
                  onClick={() => handleBookService(service.id)}
                  disabled={!service.is_available}
                  className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                    service.is_available 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {service.is_available ? 'Book Now' : 'Not Available'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const AppointmentsSection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Appointments</h2>
      
      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Appointments Yet</h3>
          <p className="text-gray-500 mb-4">Book your first appointment to get started</p>
          <button
            onClick={() => setActiveSection('services')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Services
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{booking.service_name}</h3>
                    {booking.reference_number && (
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-mono font-semibold rounded-md border border-blue-100 dark:border-blue-900/30">
                        {booking.reference_number}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{booking.barber_name || 'No assigned barber'}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-gray-400" />
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FaClock className="text-gray-400" />
                      {booking.time_slot}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-center gap-2">
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      booking.status === 'confirmed' || booking.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {booking.status}
                    </span>
                    <p className="text-xl font-extrabold text-gray-800 dark:text-white mt-1">${booking.price}</p>
                  </div>

                  {booking.reference_number && (
                    <button
                      onClick={() => navigate(`/queues/track/${booking.reference_number}`)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-200"
                    >
                      Track Live Queue
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ProfileSection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <FaUser className="text-white text-3xl" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{user?.name || 'Customer'}</h3>
            <p className="text-gray-500">{user?.email || ''}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <p className="text-gray-900">{user?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{user?.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <p className="text-gray-900">Customer</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FaCut className="text-white text-sm" />
          </div>
          <span className="font-bold text-gray-800">My Salon</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'services' && <ServicesSection />}
            {activeSection === 'appointments' && <AppointmentsSection />}
            {activeSection === 'profile' && <ProfileSection />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;
