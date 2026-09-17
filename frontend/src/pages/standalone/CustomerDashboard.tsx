import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaCut, FaCalendarAlt, FaUser, FaSignOutAlt, FaHome,
  FaHistory, FaClock, FaMoneyBillWave, FaStar, FaSearch,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaChevronRight
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
}

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'appointments' | 'profile'>('services');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/customer/dashboard' } });
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [servicesRes, categoriesRes] = await Promise.all([
        publicServiceApi.getAll(),
        publicServiceApi.getCategories()
      ]);

      if (servicesRes.success) setServices(servicesRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);

      // TODO: Fetch customer bookings when API is ready
      // const bookingsRes = await bookingApi.getCustomerBookings();
      // if (bookingsRes.success) setBookings(bookingsRes.data);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // NOTE: Some customer dashboard endpoints may not be implemented yet.
  // If bookings API returns "Booking not found", treat it as "no bookings" instead of failing the entire dashboard.


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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FaCut className="text-white text-xl" />
              </div>
              <span className="text-xl font-bold text-gray-900">BarberShop Pro</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <FaUser className="text-blue-600" />
                <span className="hidden sm:inline">Welcome, {user?.name || 'Customer'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaUser className="text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-center">{user?.name || 'Customer'}</h3>
                <p className="text-blue-100 text-center text-sm">{user?.email}</p>
              </div>

              <nav className="p-4 space-y-1">
                <button
                  onClick={() => setActiveTab('services')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'services'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <FaCut /> Browse Services
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'appointments'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <FaCalendarAlt /> My Appointments
                  {bookings.length > 0 && (
                    <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {bookings.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <FaUser /> Profile
                </button>

                <hr className="my-4" />

                <Link
                  to="/"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <FaHome /> Back to Home
                </Link>
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Stats</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="font-bold text-blue-600">{bookings.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="font-bold text-green-600">
                    {bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-bold text-gray-900">
                    {bookings.filter(b => b.status === 'completed').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Services Tab */}
            {activeTab === 'services' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Services</h2>
                  <p className="text-gray-600 mb-4">Book your next appointment with our professional barbers</p>

                  {/* Search */}
                  <div className="relative max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-4 text-gray-600">Loading services...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredServices.map((service, idx) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-40 bg-gradient-to-br from-blue-100 to-indigo-100">
                          {service.service_image ? (
                            <img
                              src={service.service_image.startsWith('http') ? service.service_image : `http://localhost:5005/${service.service_image}`}
                              alt={service.service_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaCut className="text-5xl text-blue-300" />
                            </div>
                          )}
                          {service.is_featured && (
                            <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                              <FaStar /> Featured
                            </span>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-900">{service.service_name}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {service.category_name}
                            </span>
                          </div>

                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {service.description || 'Professional barber service'}
                          </p>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xl font-bold text-blue-600">
                                {service.discount_price || service.price} ETB
                              </span>
                              {service.discount_price && (
                                <span className="text-sm text-gray-400 line-through ml-2">
                                  {service.price} ETB
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <FaClock /> {formatDuration(service.duration_minutes)}
                            </div>
                          </div>

                          <button
                            onClick={() => handleBookService(service.id)}
                            className="w-full mt-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <FaCalendarAlt /> Book Now
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {!loading && filteredServices.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <FaCut className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">No services found</h3>
                    <p className="text-gray-500">Try adjusting your search</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
                  <p className="text-gray-600">View and manage your bookings</p>
                </div>

                {bookings.length === 0 ? (
                  <div className="p-12 text-center">
                    <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No appointments yet</h3>
                    <p className="text-gray-500 mb-6">Book your first appointment today!</p>
                    <button
                      onClick={() => setActiveTab('services')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Services
                    </button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-gray-900">{booking.service_name}</h4>
                            <p className="text-gray-600 text-sm">
                              with {booking.barber_name || 'Any Barber'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <FaCalendarAlt /> {new Date(booking.booking_date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <FaClock /> {booking.time_slot}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                            <span className="font-bold text-blue-600">
                              {booking.price} ETB
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                  <p className="text-gray-600">Manage your account information</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Profile fields (editable) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={user?.name || ''}
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Full name editing is limited for customers in this version.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={user?.email || ''}
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Email editing is limited for customers in this version.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={user?.user_name || ''}
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Username editing is limited for customers in this version.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaUser className="text-gray-400" />
                        <span className="text-gray-900 capitalize">{user?.role_name || 'Customer'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4">
                    <p className="font-semibold text-sm">Profile update</p>
                    <p className="text-sm mt-1">
                      Backend profile updates for customers are restricted in your API. Admin can update users using <code>/users/updateUser/:user_id</code>.
                    </p>
                  </div>


                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-600">
                        <FaPhone className="text-blue-600" />
                        <span>+251 911 234 567 (Sample)</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <FaMapMarkerAlt className="text-blue-600" />
                        <span>Addis Ababa, Ethiopia (Sample)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
