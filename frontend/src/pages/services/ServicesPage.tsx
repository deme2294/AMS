import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  serviceApi,
  serviceCategoryApi,
  servicePackageApi,
  bookingApi,
  ratingsApi,
  Service,
  ServiceCategory,
  ServicePackage,
  ServiceFilters,
  ServiceRatingItem,
  AdminRatingsStats,
} from "../../services/serviceService";
import { BACKEND_URL, fixImageUrl } from "../../services/apiService";
import Pagination from "../../components/Pagination";
import "./ServicesPage.css";
import {
  Modal,
  Spinner,
  Form,
  Toast,
  ToastContainer,
  Badge,
} from "react-bootstrap";
import {
  FaPlus,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaSearch,
  FaCut,
  FaBox,
  FaTimes,
  FaImage,
  FaEye,
  FaEyeSlash,
  FaStar,
  FaToggleOn,
  FaToggleOff,
  FaClock,
  FaMoneyBillWave,
  FaUser,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaShieldAlt,
  FaCheckCircle,
  FaUserTie,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS_PER_PAGE = 10;

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeMainTab, setActiveMainTab] = useState<'services' | 'packages' | 'ratings'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [barbers, setBarbers] = useState<
    Array<{ id: number; full_name: string }>
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<boolean | null>(null);

  // Ratings State for Salon Feedback Command Center
  const [ratingsList, setRatingsList] = useState<ServiceRatingItem[]>([]);
  const [ratingsStats, setRatingsStats] = useState<AdminRatingsStats | null>(null);
  const [ratingsLoading, setRatingsLoading] = useState<boolean>(false);
  const [ratingsSearch, setRatingsSearch] = useState<string>('');
  const [ratingsFilterStar, setRatingsFilterStar] = useState<number | null>(null);

  // View Modal states for Admin inspection
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [viewingPackage, setViewingPackage] = useState<ServicePackage | null>(null);
  const [showPackageViewModal, setShowPackageViewModal] = useState<boolean>(false);

  // Package Modal states
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [packageSubmitting, setPackageSubmitting] = useState(false);
  const [packageFormData, setPackageFormData] = useState({
    package_name: '',
    description: '',
    price: '',
    discount_price: '',
    duration_minutes: 60,
    included_services: '',
    is_featured: false,
    status: 'active' as 'active' | 'inactive'
  });
  const [packageImageFile, setPackageImageFile] = useState<File | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "danger";
  }>({
    show: false,
    message: "",
    variant: "success",
  });

  // Form data
  const [formData, setFormData] = useState({
    category_id: "",
    barber_id: "",
    service_name: "",
    short_description: "",
    description: "",
    price: "",
    discount_price: "",
    duration_minutes: 30,
    service_image: "",
    banner_image: "",
    service_icon: "",
    is_featured: false,
    is_available: true,
    max_customers_per_slot: 1,
    preparation_time: 0,
    cleanup_time: 0,
    booking_buffer_time: 0,
    service_type: "standard" as "standard" | "combo" | "home_service" | "vip",
    status: "active" as "active" | "inactive",
  });

  // Image preview and file
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Data fetching
  const fetchServices = async () => {
    try {
      setLoading(true);
      const filters: ServiceFilters = {};
      if (statusFilter !== "all") filters.available = statusFilter === "active";
      if (categoryFilter !== "all") filters.category = categoryFilter;
      if (featuredFilter !== null) filters.featured = featuredFilter;
      if (searchTerm) filters.search = searchTerm;

      const response = await serviceApi.getAll(filters);
      if (response.success) {
        setServices(response.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch services:", error);
      showToast("Failed to fetch services", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await servicePackageApi.getAll({ search: searchTerm || undefined });
      if (res.success) {
        setPackages(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch service packages:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await serviceCategoryApi.getAll({ status: "active" });
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchBarbers = async () => {
    try {
      const response = await bookingApi.getBarbers();
      if (response.success) setBarbers(response.data);
    } catch (err) {
      console.error("Failed to fetch barbers:", err);
    }
  };

  const fetchRatings = async () => {
    try {
      setRatingsLoading(true);
      const response = await ratingsApi.getAllAdminRatings();
      if (response.success) {
        setRatingsList(response.data);
        setRatingsStats(response.stats);
      }
    } catch (err) {
      console.error("Failed to fetch admin ratings:", err);
    } finally {
      setRatingsLoading(false);
    }
  };

  const handleToggleServiceStatus = async (service: Service) => {
    const newStatus = service.status === 'active' ? 'inactive' : 'active';
    try {
      await serviceApi.update(service.id, {
        service_name: service.service_name,
        status: newStatus
      });
      showToast(`Service status updated to ${newStatus}`, "success");
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, status: newStatus } : s));
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "danger");
    }
  };

  const filteredRatings = useMemo(() => {
    return ratingsList.filter(r => {
      const matchesSearch = !ratingsSearch.trim() || 
        (r.customer_name && r.customer_name.toLowerCase().includes(ratingsSearch.toLowerCase())) ||
        (r.service_name && r.service_name.toLowerCase().includes(ratingsSearch.toLowerCase())) ||
        (r.review_text && r.review_text.toLowerCase().includes(ratingsSearch.toLowerCase()));
      const matchesStar = ratingsFilterStar === null || r.rating === ratingsFilterStar;
      return matchesSearch && matchesStar;
    });
  }, [ratingsList, ratingsSearch, ratingsFilterStar]);

  useEffect(() => {
    fetchServices();
    fetchPackages();
    fetchCategories();
    fetchBarbers();
    fetchRatings();
  }, []);

  const handleCreateOrUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setPackageSubmitting(true);
    try {
      const payload: any = {
        package_name: packageFormData.package_name,
        description: packageFormData.description,
        price: parseFloat(packageFormData.price),
        discount_price: packageFormData.discount_price ? parseFloat(packageFormData.discount_price) : null,
        duration_minutes: Number(packageFormData.duration_minutes),
        included_services: packageFormData.included_services,
        is_featured: packageFormData.is_featured,
        status: packageFormData.status
      };
      if (packageImageFile) {
        payload.imageFile = packageImageFile;
      }

      if (editingPackage) {
        await servicePackageApi.update(editingPackage.id, payload);
        showToast("Service Package updated successfully!", "success");
      } else {
        await servicePackageApi.create(payload);
        showToast("Service Package created successfully!", "success");
      }
      setShowPackageModal(false);
      fetchPackages();
    } catch (err: any) {
      showToast(err.message || "Failed to save package", "danger");
    } finally {
      setPackageSubmitting(false);
    }
  };

  const handleDeletePackage = async (id: number, packageName?: string) => {
    const nameStr = packageName ? ` "${packageName}"` : "";
    if (confirm(`Are you sure you want to delete the service package${nameStr}?`)) {
      try {
        await servicePackageApi.delete(id);
        showToast(`Package${nameStr} deleted successfully`, "success");
        fetchPackages();
      } catch (err: any) {
        showToast(err.message || "Failed to delete package", "danger");
      }
    }
  };


  // Debounced search/filter
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchServices();
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, statusFilter, categoryFilter, featuredFilter]);

  // Pagination
  const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE);
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return services.slice(start, start + ITEMS_PER_PAGE);
  }, [services, currentPage]);

  const showToast = (
    message: string,
    variant: "success" | "danger" = "success",
  ) => {
    setToast({ show: true, message, variant });
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      barber_id: "",
      service_name: "",
      short_description: "",
      description: "",
      price: "",
      discount_price: "",
      duration_minutes: 30,
      service_image: "",
      banner_image: "",
      service_icon: "",
      is_featured: false,
      is_available: true,
      max_customers_per_slot: 1,
      preparation_time: 0,
      cleanup_time: 0,
      booking_buffer_time: 0,
      service_type: "standard",
      status: "active",
    });
    setEditingService(null);
    setImagePreview(null);
    setImageFile(null);
    setFormError(null);
    setFormSuccess(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Edit UI moved to dedicated route to avoid overlapping sidebar.
  // Keeping this function unused for now (create modal remains in this page).
  const openEditModal = (_service: Service) => {
    // no-op
  };


  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        category_id: parseInt(formData.category_id),
        barber_id: formData.barber_id ? parseInt(formData.barber_id) : null,
        service_name: formData.service_name,
        short_description: formData.short_description || undefined,
        description: formData.description,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price
          ? parseFloat(formData.discount_price)
          : null,
        duration_minutes: parseInt(formData.duration_minutes.toString()),
        service_icon: formData.service_icon,
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        banner_image: formData.banner_image || undefined,
        max_customers_per_slot: formData.max_customers_per_slot,
        preparation_time: formData.preparation_time,
        cleanup_time: formData.cleanup_time,
        booking_buffer_time: formData.booking_buffer_time,
        service_type: formData.service_type,
        status: formData.status,
      };

      if (imageFile) {
        payload.imageFile = imageFile;
      } else if (formData.service_image) {
        payload.image_url = formData.service_image;
      }

      if (editingService) {
        await serviceApi.update(editingService.id, payload);
        showToast("Service updated successfully!", "success");
      } else {
        await serviceApi.create(payload);
        showToast("Service created successfully!", "success");
      }

      setFormSuccess(true);
      setTimeout(() => {
        closeModal();
        fetchServices();
      }, 1500);
    } catch (error: any) {
      const errorMsg =
        error.message || "An error occurred while saving the service";
      setFormError(errorMsg);
      showToast(errorMsg, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    if (
      confirm(
        "Are you sure you want to reset the form? All unsaved changes will be lost.",
      )
    ) {
      resetForm();
    }
  };

  const handleCancel = () => {
    closeModal();
  };

  const handleToggleAvailability = async (
    id: number,
    currentStatus: boolean,
  ) => {
    try {
      await serviceApi.toggleAvailability(id, !currentStatus);
      showToast("Service availability updated", "success");
      setViewingService(prev => prev && prev.id === id ? { ...prev, is_available: !currentStatus } : prev);
      fetchServices();
    } catch (error: any) {
      showToast(error.message || "Failed to update status", "danger");
    }
  };

  const handleDelete = async (id: number, serviceName?: string) => {
    const nameStr = serviceName ? ` "${serviceName}"` : "";
    if (confirm(`Are you sure you want to delete the service${nameStr}?`)) {
      try {
        await serviceApi.delete(id);
        showToast(`Service${nameStr} deleted successfully`, "success");
        fetchServices();
      } catch (error: any) {
        showToast(error.message || "Failed to delete service", "danger");
      }
    }
  };

  const getServiceTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      standard: "bg-blue",
      combo: "bg-purple",
      home_service: "bg-green",
      vip: "bg-gold",
    };
    return (
      <Badge bg={colors[type] || "secondary"}>{type.replace("_", " ")}</Badge>
    );
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="container-fluid py-4">
      {/* Toast Container */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 1050 }}
      >
        <Toast
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
          bg={toast.variant}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="btn-modern btn-modern-secondary text-xs d-inline-flex align-items-center gap-1.5 mb-2 py-1.5 px-3 rounded-xl cursor-pointer"
            title="Go back to previous page"
          >
            <FaArrowLeft /> Back
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Services & Service Packages</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-0">
            Manage your service catalogue, tiered categories, pricing, and bundled packages
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {activeMainTab === 'packages' ? (
            <button
              className="btn-modern btn-modern-primary d-flex align-items-center gap-2"
              onClick={() => {
                setEditingPackage(null);
                setPackageFormData({
                  package_name: '',
                  description: '',
                  price: '',
                  discount_price: '',
                  duration_minutes: 60,
                  included_services: '',
                  is_featured: false,
                  status: 'active'
                });
                setShowPackageModal(true);
              }}
            >
              <FaPlus /> Add Package
            </button>
          ) : (
            <button
              className="btn-modern btn-modern-primary d-flex align-items-center gap-2"
              onClick={() => navigate("/service-submission")}
            >
              <FaPlus /> Quick Add Services
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        <button
          className={`services-tab-btn ${activeMainTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('services')}
        >
          <FaCut /> Beauty Services ({services.length})
        </button>
        <button
          className={`services-tab-btn ${activeMainTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('packages')}
        >
          <FaBox /> Spa Packages ({packages.length})
        </button>
        <button
          className={`services-tab-btn ${activeMainTab === 'ratings' ? 'active' : ''}`}
          onClick={() => {
            setActiveMainTab('ratings');
            fetchRatings();
          }}
        >
          <FaStar className="text-amber-400" /> Salon Reviews & Feedback ({ratingsStats?.total_reviews || ratingsList.length})
        </button>
      </div>

      {activeMainTab === 'services' && (
        <>
          {/* Filters */}
          <div className="row g-3 mb-4 align-items-center">
            <div className="col-md-4">
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400" />
                <input
                  type="text"
                  className="input-modern ps-5"
                  placeholder="Search services by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-2">
              <select
                className="service-filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="service-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Available</option>
                <option value="inactive">Unavailable</option>
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="service-filter-select"
                value={
                  featuredFilter === null
                    ? "all"
                    : featuredFilter
                      ? "true"
                      : "false"
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setFeaturedFilter(val === "all" ? null : val === "true");
                }}
              >
                <option value="all">All Featured</option>
                <option value="true">Featured Only</option>
                <option value="false">Standard Only</option>
              </select>
            </div>
            <div className="col-md-2 text-md-end">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                {services.length} Total Services
              </span>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-slate-500 dark:text-slate-400">Loading services...</p>
            </div>
          )}

          {/* Table */}
          {!loading && (
            <div className="glass-card shadow-sm services-table-wrapper mb-4">
              <div
                className="table-responsive"
                style={{
                  maxHeight: "65vh",
                  overflowY: "auto",
                }}
              >
                <table className="services-modern-table">
                  <thead>
                    <tr>
                      <th style={{ width: "70px" }}>Image</th>
                      <th>Service Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Duration</th>
                      <th>Type</th>
                      <th>Rating</th>
                      <th style={{ width: "90px" }}>Status</th>
                      <th style={{ width: "90px" }}>Featured</th>
                      <th style={{ width: "120px" }} className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedServices.map((service) => (
                        <motion.tr
                          key={service.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <td>
                            {service.service_image ? (
                              <img
                                src={fixImageUrl(service.service_image) || undefined}
                                alt={service.service_name}
                                className="service-table-thumb clickable"
                                onClick={() => {
                                  setViewingService(service);
                                  setShowViewModal(true);
                                }}
                                title="Click to view service details"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent && !parent.querySelector('.service-thumb-fallback')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'service-thumb-fallback';
                                    fallback.innerHTML = '✂️';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <div
                                className="service-thumb-fallback cursor-pointer"
                                onClick={() => {
                                  setViewingService(service);
                                  setShowViewModal(true);
                                }}
                                title="Click to view service details"
                              >
                                <FaCut />
                              </div>
                            )}
                          </td>
                          <td>
                            <div
                              className="font-semibold text-slate-900 dark:text-white d-flex align-items-center gap-1 service-clickable-title"
                              onClick={() => {
                                setViewingService(service);
                                setShowViewModal(true);
                              }}
                              title="Click to view service details"
                            >
                              {service.service_name}
                              {service.is_featured && (
                                <FaStar
                                  className="text-amber-400"
                                  title="Featured Service"
                                />
                              )}
                            </div>
                            {service.discount_price && (
                              <div className="d-flex align-items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-400 line-through">
                                  {service.price} ETB
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  {service.discount_price} ETB
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge-modern badge-modern-secondary text-xs">
                              {service.category_name || "Uncategorized"}
                            </span>
                          </td>
                          <td>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 d-flex align-items-center gap-1">
                              <FaMoneyBillWave className="text-xs opacity-70" />
                              {service.price.toFixed(2)} ETB
                            </span>
                          </td>
                          <td>
                            <span className="text-slate-600 dark:text-slate-300 text-xs d-flex align-items-center gap-1.5">
                              <FaClock className="text-slate-400" />
                              {formatDuration(service.duration_minutes)}
                            </span>
                          </td>
                          <td>{getServiceTypeBadge(service.service_type)}</td>
                          {/* Rating column */}
                          <td>
                            {service.avg_rating != null &&
                            service.avg_rating > 0 ? (
                              <div className="d-flex flex-column gap-0.5">
                                <div className="d-flex align-items-center gap-0.5">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <FaStar
                                      key={i}
                                      className={
                                        i < Math.round(service.avg_rating!)
                                          ? "text-amber-400"
                                          : "text-slate-300 dark:text-slate-600"
                                      }
                                      style={{ fontSize: "0.75rem" }}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-slate-400">
                                  {service.avg_rating.toFixed(1)} (
                                  {service.total_ratings || 0})
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td>
                            <button
                              className={`btn-modern btn-modern-sm ${service.is_available ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-transparent"}`}
                              onClick={() =>
                                handleToggleAvailability(
                                  service.id,
                                  service.is_available,
                                )
                              }
                              title={
                                service.is_available ? "Click to set unavailable" : "Click to set available"
                              }
                              style={{ padding: "4px 8px" }}
                            >
                              {service.is_available ? (
                                <span className="d-flex align-items-center gap-1 font-medium"><FaToggleOn className="text-emerald-500" size={16} /> Active</span>
                              ) : (
                                <span className="d-flex align-items-center gap-1 font-medium"><FaToggleOff size={16} /> Inactive</span>
                              )}
                            </button>
                          </td>
                          <td>
                            {service.is_featured ? (
                              <span className="badge-modern badge-modern-warning text-xs d-inline-flex align-items-center gap-1">
                                <FaStar className="text-amber-400" /> Featured
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 d-inline-flex align-items-center gap-1">
                                <FaEyeSlash /> Regular
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex justify-content-end gap-1.5">
                              <button
                                className="service-action-btn view"
                                onClick={() => {
                                  setViewingService(service);
                                  setShowViewModal(true);
                                }}
                                title="View Service Details"
                              >
                                <FaEye />
                              </button>

                              <button
                                className="service-action-btn edit"
                                onClick={() => navigate(`/services/edit/${service.id}`)}
                                title="Edit Service"
                              >
                                <FaEdit />
                              </button>

                              <button
                                className="service-action-btn delete"
                                onClick={() => handleDelete(service.id, service.service_name)}
                                title="Delete Service"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {paginatedServices.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-5 text-slate-500 dark:text-slate-400">
                          No services match your filters. Click "Quick Add Services" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalItems={services.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Service Packages Tab View */}
      {activeMainTab === 'packages' && (
        <div className="glass-card shadow-sm services-table-wrapper mb-4">
          <div className="table-responsive">
            <table className="services-modern-table">
              <thead>
                <tr>
                  <th style={{ width: "70px" }}>Image</th>
                  <th>Package Name</th>
                  <th>Description</th>
                  <th>Included Services</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th style={{ width: "120px" }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>
                      {pkg.package_image ? (
                        <img
                          src={fixImageUrl(pkg.package_image) || undefined}
                          alt={pkg.package_name}
                          className="service-table-thumb clickable"
                          onClick={() => {
                            setViewingPackage(pkg);
                            setShowPackageViewModal(true);
                          }}
                          title="Click to view package details"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector('.service-thumb-fallback')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'service-thumb-fallback';
                              fallback.innerHTML = '📦';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div
                          className="service-thumb-fallback cursor-pointer"
                          onClick={() => {
                            setViewingPackage(pkg);
                            setShowPackageViewModal(true);
                          }}
                          title="Click to view package details"
                        >
                          <FaBox />
                        </div>
                      )}
                    </td>
                    <td>
                      <div
                        className="font-semibold text-slate-900 dark:text-white d-flex align-items-center gap-1 service-clickable-title"
                        onClick={() => {
                          setViewingPackage(pkg);
                          setShowPackageViewModal(true);
                        }}
                        title="Click to view package details"
                      >
                        {pkg.package_name}
                        {pkg.is_featured && <FaStar className="text-amber-400" title="Featured Package" />}
                      </div>
                    </td>
                    <td><span className="text-xs text-slate-500 dark:text-slate-400">{pkg.description || "No description"}</span></td>
                    <td>
                      <span className="badge-modern badge-modern-info text-xs">
                        {pkg.included_services || "All included"}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400 d-flex align-items-center gap-1">
                        <FaMoneyBillWave className="text-xs opacity-70" />
                        {pkg.price.toFixed(2)} ETB
                      </div>
                      {pkg.discount_price && (
                        <div className="d-flex align-items-center gap-1 mt-0.5">
                          <span className="text-xs text-slate-400 line-through">{pkg.price} ETB</span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{pkg.discount_price} ETB</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-slate-600 dark:text-slate-300 d-flex align-items-center gap-1">
                        <FaClock className="text-slate-400" />
                        {formatDuration(pkg.duration_minutes)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-modern ${pkg.status === 'active' ? 'badge-modern-success' : 'badge-modern-secondary'} text-xs`}>
                        {pkg.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-end gap-1.5">
                        <button
                          className="service-action-btn view"
                          onClick={() => {
                            setViewingPackage(pkg);
                            setShowPackageViewModal(true);
                          }}
                          title="View Package Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="service-action-btn edit"
                          onClick={() => {
                            setEditingPackage(pkg);
                            setPackageFormData({
                              package_name: pkg.package_name,
                              description: pkg.description || '',
                              price: String(pkg.price),
                              discount_price: pkg.discount_price ? String(pkg.discount_price) : '',
                              duration_minutes: pkg.duration_minutes,
                              included_services: pkg.included_services || '',
                              is_featured: pkg.is_featured,
                              status: pkg.status
                            });
                            setShowPackageModal(true);
                          }}
                          title="Edit Package"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="service-action-btn delete"
                          onClick={() => handleDeletePackage(pkg.id, pkg.package_name)}
                          title="Delete Package"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-slate-500 dark:text-slate-400">
                      No service packages found. Click "Add Package" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Ratings & Reviews Tab View */}
      {activeMainTab === 'ratings' && (
        <div className="ratings-management-wrapper mb-4">
          {/* Summary KPIs */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="glass-card p-4 rounded-2xl text-center h-100 d-flex flex-column justify-content-center align-items-center shadow-sm">
                <span className="text-xs text-uppercase font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Overall Salon Rating
                </span>
                <div className="display-4 font-bold text-amber-500 my-1">
                  {ratingsStats?.average_rating ? Number(ratingsStats.average_rating).toFixed(1) : '5.0'}
                </div>
                <div className="d-flex gap-1 text-amber-400 fs-5 mb-2">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <span className="text-xs text-muted">
                  Based on {ratingsStats?.total_reviews || ratingsList.length} verified customer reviews
                </span>
              </div>
            </div>

            <div className="col-md-8">
              <div className="glass-card p-4 rounded-2xl h-100 shadow-sm">
                <h6 className="font-bold text-slate-900 dark:text-white mb-3">Rating Breakdown</h6>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const key = stars === 5 ? 'five_star' : stars === 4 ? 'four_star' : stars === 3 ? 'three_star' : stars === 2 ? 'two_star' : 'one_star';
                  const count = Number(ratingsStats?.[key as keyof AdminRatingsStats] || 0);
                  const total = Number(ratingsStats?.total_reviews || 1);
                  const pct = Math.round((count / (total || 1)) * 100);
                  return (
                    <div key={stars} className="d-flex align-items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300" style={{ width: '55px' }}>
                        {stars} Stars
                      </span>
                      <div className="progress flex-grow-1" style={{ height: '8px', backgroundColor: 'rgba(0,0,0,0.06)' }}>
                        <div 
                          className="progress-bar bg-amber-400 rounded-pill" 
                          role="progressbar" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                      <span className="text-xs text-muted" style={{ width: '70px', textAlign: 'right' }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search & Star Filters */}
          <div className="row g-3 mb-4 align-items-center">
            <div className="col-md-6">
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400" />
                <input
                  type="text"
                  className="input-modern ps-5"
                  placeholder="Search feedback comments, customer name or service..."
                  value={ratingsSearch}
                  onChange={(e) => setRatingsSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 d-flex gap-2 justify-content-md-end flex-wrap">
              <button
                className={`btn btn-sm rounded-xl px-3 py-1.5 ${ratingsFilterStar === null ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setRatingsFilterStar(null)}
              >
                All Ratings
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm rounded-xl px-2.5 py-1.5 d-flex align-items-center gap-1 ${ratingsFilterStar === s ? 'btn-warning text-dark font-bold' : 'btn-outline-secondary'}`}
                  onClick={() => setRatingsFilterStar(ratingsFilterStar === s ? null : s)}
                >
                  <FaStar className="text-amber-400" /> {s}★
                </button>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          {ratingsLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading salon customer feedback...</p>
            </div>
          ) : filteredRatings.length === 0 ? (
            <div className="text-center py-5 glass-card rounded-2xl">
              <FaStar className="fs-1 text-slate-300 dark:text-slate-600 mb-2" />
              <h6 className="font-bold text-slate-700 dark:text-white">No customer reviews yet</h6>
              <p className="text-muted text-xs">Customer ratings submitted from the customer app or rating page will automatically appear here.</p>
            </div>
          ) : (
            <div className="row g-3">
              {filteredRatings.map((review) => (
                <div key={review.id} className="col-md-6">
                  <div className="glass-card p-3.5 rounded-2xl h-100 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div className="d-flex align-items-center gap-2.5">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center text-white font-bold text-sm"
                          style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}
                        >
                          {(review.customer_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h6 className="font-semibold text-slate-900 dark:text-white mb-0 fs-6">
                            {review.customer_name}
                          </h6>
                          <span className="text-xs text-muted">
                            Service: <strong className="text-pink-500">{review.service_name}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-end">
                        <div className="d-flex gap-0.5 text-amber-400 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar key={i} className={i < review.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'} />
                          ))}
                        </div>
                        <span className="text-xs text-muted mt-1">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-0 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      "{review.review_text || 'No comment provided by customer.'}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Service Package Create/Edit Modal */}
      <Modal show={showPackageModal} onHide={() => setShowPackageModal(false)} centered size="lg">
        <Form onSubmit={handleCreateOrUpdatePackage}>
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title className="d-flex align-items-center">
              <FaBox className="me-2" />
              {editingPackage ? 'Edit Service Package' : 'Add New Service Package'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Package Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={packageFormData.package_name}
                    onChange={(e) => setPackageFormData({ ...packageFormData, package_name: e.target.value })}
                    placeholder="e.g., Deluxe Grooming Combo"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Price (ETB) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    required
                    value={packageFormData.price}
                    onChange={(e) => setPackageFormData({ ...packageFormData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Discount Price (ETB)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={packageFormData.discount_price}
                    onChange={(e) => setPackageFormData({ ...packageFormData, discount_price: e.target.value })}
                    placeholder="Optional promotional price"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Total Duration (Minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={packageFormData.duration_minutes}
                    onChange={(e) => setPackageFormData({ ...packageFormData, duration_minutes: Number(e.target.value) })}
                  />
                </Form.Group>
              </div>
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Included Services (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    value={packageFormData.included_services}
                    onChange={(e) => setPackageFormData({ ...packageFormData, included_services: e.target.value })}
                    placeholder="Haircut, Beard Trim, Face Wash, Head Massage"
                  />
                </Form.Group>
              </div>
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={packageFormData.description}
                    onChange={(e) => setPackageFormData({ ...packageFormData, description: e.target.value })}
                    placeholder="Detailed package description..."
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Package Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e: any) => setPackageImageFile(e.target.files?.[0] || null)}
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={packageFormData.status}
                    onChange={(e: any) => setPackageFormData({ ...packageFormData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-3 d-flex align-items-end mb-2">
                <Form.Check
                  type="checkbox"
                  id="pkg-featured"
                  label="Featured Package"
                  checked={packageFormData.is_featured}
                  onChange={(e) => setPackageFormData({ ...packageFormData, is_featured: e.target.checked })}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-secondary" onClick={() => setShowPackageModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={packageSubmitting}>
              {packageSubmitting ? 'Saving...' : 'Save Package'}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        show={showModal}
        onHide={closeModal}
        centered
        size="xl"
        scrollable
        backdrop="static"
        keyboard={true}
      >

        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title className="d-flex align-items-center">
              {editingService ? (
                <>
                  <FaEdit className="me-2" /> Edit Service
                </>
              ) : (
                <>
                  <FaPlus className="me-2" /> Add New Service
                </>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            className="services-edit-modal-body"
            style={{
              paddingRight: "15px",
              scrollbarWidth: "thin",
              scrollbarColor: "#0d6efd #f1f1f1",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <style>{`
              .services-edit-modal-body::-webkit-scrollbar { width: 10px; }
              .services-edit-modal-body::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 5px; }
              .services-edit-modal-body::-webkit-scrollbar-thumb { background: #0d6efd; border-radius: 5px; }
              .services-edit-modal-body::-webkit-scrollbar-thumb:hover { background: #0b5ed7; }
            `}</style>

            {formError && <div className="alert alert-danger">{formError}</div>}
            {formSuccess && (
              <div className="alert alert-success">
                <strong>Success!</strong>{" "}
                {editingService
                  ? "Service updated successfully!"
                  : "Service created successfully!"}
              </div>
            )}

            <div className="row g-4">
              {/* Left Column - Basic Info */}
              <div className="col-md-8">
                <h6 className="fw-bold mb-3">
                  <FaCut className="me-2 text-primary" />
                  Basic Information
                </h6>

                <Form.Group className="mb-3">
                  <Form.Label>Service Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="service_name"
                    value={formData.service_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Classic Haircut, Beard Trim"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Assigned Barber (Optional)</Form.Label>
                  <Form.Select
                    name="barber_id"
                    value={formData.barber_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Unassigned (General Service)</option>
                    {barbers.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.full_name}
                      </option>
                    ))}
                  </Form.Select>
                  <small className="text-muted">
                    Specific barber can be assigned (optional)
                  </small>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Short Teaser (Card Highlight)</Form.Label>
                  <Form.Control
                    type="text"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    placeholder="e.g., Hydrating infusion with hyaluronic acid and LED therapy"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Full Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe this beauty treatment or service in detail..."
                  />
                </Form.Group>

                <hr />
                <h6 className="fw-bold mb-3">Pricing</h6>

                <div className="row g-3">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Price (ETB) *</Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Discount Price (Optional)</Form.Label>
                      <Form.Control
                        type="number"
                        name="discount_price"
                        value={formData.discount_price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </Form.Group>
                  </div>
                </div>

                <hr />
                <h6 className="fw-bold mb-3">Timing</h6>

                <div className="row g-3">
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Duration (minutes) *</Form.Label>
                      <Form.Control
                        type="number"
                        name="duration_minutes"
                        value={formData.duration_minutes}
                        onChange={handleNumberChange}
                        min="5"
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Preparation Time (min)</Form.Label>
                      <Form.Control
                        type="number"
                        name="preparation_time"
                        value={formData.preparation_time}
                        onChange={handleNumberChange}
                        min="0"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Cleanup Time (min)</Form.Label>
                      <Form.Control
                        type="number"
                        name="cleanup_time"
                        value={formData.cleanup_time}
                        onChange={handleNumberChange}
                        min="0"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Buffer Time (min)</Form.Label>
                      <Form.Control
                        type="number"
                        name="booking_buffer_time"
                        value={formData.booking_buffer_time}
                        onChange={handleNumberChange}
                        min="0"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Max Customers per Slot</Form.Label>
                      <Form.Control
                        type="number"
                        name="max_customers_per_slot"
                        value={formData.max_customers_per_slot}
                        onChange={handleNumberChange}
                        min="1"
                      />
                    </Form.Group>
                  </div>
                </div>

                <hr />
                <h6 className="fw-bold mb-3">Options</h6>

                <div className="row g-3">
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Service Type</Form.Label>
                      <Form.Select
                        name="service_type"
                        value={formData.service_type}
                        onChange={handleInputChange}
                      >
                        <option value="standard">Standard</option>
                        <option value="combo">Combo</option>
                        <option value="home_service">Home Service</option>
                        <option value="vip">VIP</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3 d-flex align-items-center justify-content-start h-100 pt-4">
                      <Form.Check
                        type="checkbox"
                        id="is_featured"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        label={
                          <>
                            <FaStar className="me-2 text-warning" />
                            Featured Service
                          </>
                        }
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3 d-flex align-items-center justify-content-start h-100 pt-4">
                      <Form.Check
                        type="checkbox"
                        id="is_available"
                        name="is_available"
                        checked={formData.is_available}
                        onChange={handleInputChange}
                        label="Service Available"
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>

              {/* Right Column - Media */}
              <div className="col-md-4">
                <h6 className="fw-bold mb-3">Media</h6>

                <Form.Group className="mb-3">
                  <Form.Label>Service Image</Form.Label>
                  <div className="border rounded p-3 text-center">
                    {imagePreview ? (
                      <div className="position-relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="img-fluid rounded"
                          style={{ maxHeight: "200px" }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                          onClick={() => setImagePreview(null)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <FaImage className="fa-2x text-muted mb-2" />
                        <p className="text-muted small mb-0">
                          Upload service image
                        </p>
                      </div>
                    )}
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2"
                    />
                    <small className="text-muted d-block mt-1">
                      Recommended: 400x300px
                    </small>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Service Icon (CSS class or SVG)</Form.Label>
                  <Form.Control
                    type="text"
                    name="service_icon"
                    value={formData.service_icon}
                    onChange={handleInputChange}
                    placeholder="e.g., fas fa-spa or fa-scissors"
                  />
                  <small className="text-muted">
                    Optional: FontAwesome class or SVG markup
                  </small>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Banner Background URL (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="banner_image"
                    value={formData.banner_image}
                    onChange={handleInputChange}
                    placeholder="https://images.unsplash.com/... or /uploads/..."
                  />
                  <small className="text-muted">
                    Displayed as wide hero background for public showcase
                  </small>
                </Form.Group>

                <div className="alert alert-info small">
                  <strong>Note:</strong> Active services will automatically
                  appear on the customer booking page.
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="justify-content-between bg-light border-top">
            <div>
              <button
                type="button"
                className="btn btn-outline-secondary me-2"
                onClick={handleResetForm}
                disabled={submitting || formSuccess}
              >
                <FaTimes className="me-1" /> Reset Form
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg px-4"
              disabled={submitting || formSuccess}
              style={{ minWidth: "180px" }}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />{" "}
                  Saving to Database...
                </>
              ) : (
                <>
                  {editingService ? (
                    <>
                      <FaEdit className="me-2" /> Update Service
                    </>
                  ) : (
                    <>
                      <FaPlus className="me-2" /> Submit Service to Database
                    </>
                  )}
                </>
              )}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================
          ADMIN SERVICE DETAILS VIEW MODAL (LUXURY PRESENTATION)
          ======================================================== */}
      <Modal
        show={showViewModal}
        onHide={() => {
          setShowViewModal(false);
          setViewingService(null);
        }}
        size="lg"
        centered
        className="service-view-modal-custom"
      >
        {viewingService && (
          <>
            <Modal.Header closeButton className="service-view-header">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="badge-modern badge-modern-secondary text-xs">
                  {viewingService.category_name || "Salon Treatment"}
                </span>
                {viewingService.is_featured && (
                  <span className="badge-modern badge-modern-warning text-xs d-inline-flex align-items-center gap-1">
                    <FaStar className="text-amber-400" /> Featured Service
                  </span>
                )}
                <span className={`badge-modern ${viewingService.is_available ? 'badge-modern-success' : 'badge-modern-secondary'} text-xs`}>
                  {viewingService.is_available ? 'Active in Catalogue' : 'Unavailable'}
                </span>
              </div>
            </Modal.Header>

            <Modal.Body className="p-0">
              {/* Hero Image Showcase */}
              <div className="service-view-hero">
                {viewingService.service_image || viewingService.banner_image ? (
                  <img
                    src={fixImageUrl(viewingService.banner_image || viewingService.service_image) || undefined}
                    alt={viewingService.service_name}
                    className="service-view-hero-img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white/40">
                    <FaCut size={48} />
                  </div>
                )}
                <div className="service-view-hero-overlay">
                  <div className="d-flex justify-content-between align-items-end flex-wrap gap-2">
                    <div>
                      <span className="text-xs uppercase font-bold tracking-widest text-indigo-300 block mb-1">
                        Service Profile #{viewingService.id}
                      </span>
                      <h3 className="text-2xl font-black text-white mb-0 font-display">
                        {viewingService.service_name}
                      </h3>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge-modern badge-modern-info text-xs">
                        {viewingService.service_type ? viewingService.service_type.toUpperCase() : 'STANDARD'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Inner Body Content */}
              <div className="p-4">
                {/* 4 Metric Cards Grid */}
                <div className="service-stat-grid">
                  {/* Card 1: Investment */}
                  <div className="service-stat-box">
                    <div className="service-stat-icon green">
                      <FaMoneyBillWave />
                    </div>
                    <span className="service-stat-label">Service Price</span>
                    <div className="service-stat-value text-emerald-600 dark:text-emerald-400">
                      {viewingService.price.toFixed(2)} <span className="text-xs font-semibold">ETB</span>
                    </div>
                    {viewingService.discount_price && (
                      <div className="text-xs text-slate-400 mt-1">
                        <span className="line-through">{viewingService.price} ETB</span>
                        <span className="text-emerald-500 font-bold ms-1">({viewingService.discount_price} ETB Promo)</span>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Duration */}
                  <div className="service-stat-box">
                    <div className="service-stat-icon blue">
                      <FaClock />
                    </div>
                    <span className="service-stat-label">Appointment Time</span>
                    <div className="service-stat-value">
                      {formatDuration(viewingService.duration_minutes)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {viewingService.preparation_time ? `+${viewingService.preparation_time}m prep ` : ''}
                      {viewingService.cleanup_time ? `+${viewingService.cleanup_time}m cleanup` : 'Standard slot'}
                    </div>
                  </div>

                  {/* Card 3: Capacity */}
                  <div className="service-stat-box">
                    <div className="service-stat-icon amber">
                      <FaUser />
                    </div>
                    <span className="service-stat-label">Slot Capacity</span>
                    <div className="service-stat-value">
                      {viewingService.max_customers_per_slot || 1} <span className="text-xs font-normal text-slate-400">client/slot</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 truncate">
                      {viewingService.barber_name || (barbers.find(b => b.id === viewingService.barber_id)?.full_name) || "First Available"}
                    </div>
                  </div>

                  {/* Card 4: Quality & Rating */}
                  <div className="service-stat-box">
                    <div className="service-stat-icon purple">
                      <FaStar />
                    </div>
                    <span className="service-stat-label">Satisfaction Score</span>
                    <div className="service-stat-value d-flex align-items-center gap-1">
                      <span className="text-amber-400">★</span>
                      <span>{viewingService.avg_rating ? Number(viewingService.avg_rating).toFixed(1) : '4.9'}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {viewingService.total_ratings || viewingService.rating_count || 0} customer reviews
                    </div>
                  </div>
                </div>

                {/* Service Narrative & Description */}
                <div className="mb-4">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Service Description
                  </h6>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {viewingService.description || viewingService.short_description || "No full narrative provided. This service represents luxury grooming crafted with precision and premium products."}
                  </div>
                </div>

                {viewingService.short_description && viewingService.short_description !== viewingService.description && (
                  <div className="mb-4">
                    <h6 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Brief Summary (Card Teaser)
                    </h6>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-0">
                      "{viewingService.short_description}"
                    </p>
                  </div>
                )}

                {/* Audit & Logistics Strip */}
                <div className="service-meta-strip">
                  <div className="service-meta-item">
                    <span>Slug:</span>
                    <strong>{viewingService.service_slug || `service-${viewingService.id}`}</strong>
                  </div>
                  <div className="service-meta-item">
                    <span>Category ID:</span>
                    <strong>#{viewingService.category_id}</strong>
                  </div>
                  <div className="service-meta-item">
                    <span>Buffer Time:</span>
                    <strong>{viewingService.booking_buffer_time || 0} min</strong>
                  </div>
                  <div className="service-meta-item">
                    <span>Assigned Specialist:</span>
                    <strong>{viewingService.barber_name || (barbers.find(b => b.id === viewingService.barber_id)?.full_name) || "Unrestricted"}</strong>
                  </div>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer className="justify-content-between p-3 bg-slate-50 dark:bg-slate-900 border-top border-slate-200 dark:border-slate-800 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                {/* Instant Availability Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleAvailability(viewingService.id, viewingService.is_available)}
                  className={`btn-modern btn-modern-sm ${viewingService.is_available ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-transparent'}`}
                  title="Toggle active status in booking catalogue"
                >
                  {viewingService.is_available ? (
                    <span className="d-flex align-items-center gap-1 font-semibold">
                      <FaToggleOn className="text-emerald-500" size={16} /> Catalogue Active
                    </span>
                  ) : (
                    <span className="d-flex align-items-center gap-1 font-semibold">
                      <FaToggleOff size={16} /> Catalogue Inactive
                    </span>
                  )}
                </button>

                {/* Preview Client Booking Page */}
                <button
                  type="button"
                  onClick={() => window.open(`/services/book/${viewingService.id}`, '_blank')}
                  className="btn-view-client-page"
                  title="Open live client appointment booking page"
                >
                  <FaCalendarAlt />
                  <span>Preview Booking Page</span>
                  <FaExternalLinkAlt className="text-[10px] opacity-70" />
                </button>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn-modern btn-modern-secondary text-xs py-2 px-3"
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingService(null);
                  }}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn-modern btn-modern-primary text-xs py-2 px-3.5 d-flex align-items-center gap-1.5"
                  onClick={() => {
                    setShowViewModal(false);
                    navigate(`/services/edit/${viewingService.id}`);
                  }}
                >
                  <FaEdit />
                  <span>Edit Service</span>
                </button>
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* ========================================================
          ADMIN PACKAGE DETAILS VIEW MODAL
          ======================================================== */}
      <Modal
        show={showPackageViewModal}
        onHide={() => {
          setShowPackageViewModal(false);
          setViewingPackage(null);
        }}
        centered
        className="service-view-modal-custom"
      >
        {viewingPackage && (
          <>
            <Modal.Header closeButton className="service-view-header">
              <div className="d-flex align-items-center gap-2">
                <span className={`badge-modern ${viewingPackage.status === 'active' ? 'badge-modern-success' : 'badge-modern-secondary'} text-xs`}>
                  {viewingPackage.status === 'active' ? 'Active Package' : 'Inactive'}
                </span>
                {viewingPackage.is_featured && (
                  <span className="badge-modern badge-modern-warning text-xs d-inline-flex align-items-center gap-1">
                    <FaStar className="text-amber-400" /> Featured
                  </span>
                )}
              </div>
            </Modal.Header>

            <Modal.Body className="p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-50 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center border border-indigo-200 dark:border-slate-700">
                  {viewingPackage.package_image ? (
                    <img
                      src={fixImageUrl(viewingPackage.package_image) || undefined}
                      alt={viewingPackage.package_name}
                      className="w-100 h-100 object-fit-cover"
                    />
                  ) : (
                    <FaBox className="text-2xl text-indigo-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white mb-1">
                    {viewingPackage.package_name}
                  </h4>
                  <div className="d-flex align-items-center gap-2 text-xs text-slate-500">
                    <FaClock />
                    <span>Duration: {formatDuration(viewingPackage.duration_minutes)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Pricing Overview
                </span>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {viewingPackage.discount_price || viewingPackage.price} ETB
                  </span>
                  {viewingPackage.discount_price && (
                    <span className="text-xs text-slate-400 line-through">
                      {viewingPackage.price} ETB
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Included Services
                </span>
                <span className="badge-modern badge-modern-info text-xs">
                  {viewingPackage.included_services || "All included in package"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Description
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-0">
                  {viewingPackage.description || "Comprehensive packaged bundle designed for supreme salon care and relaxation."}
                </p>
              </div>
            </Modal.Body>

            <Modal.Footer className="justify-content-between p-3 bg-slate-50 dark:bg-slate-900 border-top border-slate-200 dark:border-slate-800">
              <button
                type="button"
                className="btn-modern btn-modern-secondary text-xs py-2 px-3"
                onClick={() => {
                  setShowPackageViewModal(false);
                  setViewingPackage(null);
                }}
              >
                Close
              </button>

              <button
                type="button"
                className="btn-modern btn-modern-primary text-xs py-2 px-3.5 d-flex align-items-center gap-1.5"
                onClick={() => {
                  setShowPackageViewModal(false);
                  setEditingPackage(viewingPackage);
                  setPackageFormData({
                    package_name: viewingPackage.package_name,
                    description: viewingPackage.description || '',
                    price: String(viewingPackage.price),
                    discount_price: viewingPackage.discount_price ? String(viewingPackage.discount_price) : '',
                    duration_minutes: viewingPackage.duration_minutes,
                    included_services: viewingPackage.included_services || '',
                    is_featured: viewingPackage.is_featured,
                    status: viewingPackage.status
                  });
                  setShowPackageModal(true);
                }}
              >
                <FaEdit />
                <span>Edit Package</span>
              </button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
};


export default ServicesPage;
