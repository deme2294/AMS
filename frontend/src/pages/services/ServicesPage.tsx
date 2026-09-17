import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  serviceApi,
  serviceCategoryApi,
  servicePackageApi,
  bookingApi,
  Service,
  ServiceCategory,
  ServicePackage,
  ServiceFilters,
} from "../../services/serviceService";
import { BACKEND_URL } from "../../services/apiService";
import Pagination from "../../components/Pagination";
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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS_PER_PAGE = 10;

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeMainTab, setActiveMainTab] = useState<'services' | 'packages'>('services');
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
    description: "",
    price: "",
    discount_price: "",
    duration_minutes: 30,
    service_image: "",
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

  useEffect(() => {
    fetchServices();
    fetchPackages();
    fetchCategories();
    fetchBarbers();
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

  const handleDeletePackage = async (id: number) => {
    if (confirm("Are you sure you want to delete this service package?")) {
      try {
        await servicePackageApi.delete(id);
        showToast("Package deleted successfully", "success");
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
      description: "",
      price: "",
      discount_price: "",
      duration_minutes: 30,
      service_image: "",
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
        description: formData.description,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price
          ? parseFloat(formData.discount_price)
          : null,
        duration_minutes: parseInt(formData.duration_minutes.toString()),
        service_icon: formData.service_icon,
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        max_customers_per_slot: formData.max_customers_per_slot,
        preparation_time: formData.preparation_time,
        cleanup_time: formData.cleanup_time,
        booking_buffer_time: formData.booking_buffer_time,
        service_type: formData.service_type,
        status: formData.status,
      };

      if (imageFile) {
        payload.imageFile = imageFile;
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
      fetchServices();
    } catch (error: any) {
      showToast(error.message || "Failed to update status", "danger");
    }
  };

  const handleDelete = async (id: number) => {
    if (
      confirm(
        t("common.confirm_delete") ||
          "Are you sure you want to delete this service?",
      )
    ) {
      try {
        await serviceApi.delete(id);
        showToast("Service deleted successfully", "success");
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="h3 mb-0">Services & Service Packages</h2>
          <p className="text-muted mb-0">
            Manage all your individual services, service categories, and bundled service packages
          </p>
        </div>
        <div className="d-flex gap-2">
          {activeMainTab === 'packages' ? (
            <button
              className="btn btn-primary"
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
              <FaPlus className="me-2" /> Add Package
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => navigate("/service-submission")}
            >
              <FaPlus className="me-2" /> Quick Add Services
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="d-flex gap-2 mb-4 border-bottom pb-3">
        <button
          className={`btn ${activeMainTab === 'services' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setActiveMainTab('services')}
        >
          <FaCut className="me-2" /> Services ({services.length})
        </button>
        <button
          className={`btn ${activeMainTab === 'packages' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setActiveMainTab('packages')}
        >
          <FaBox className="me-2" /> Service Packages ({packages.length})
        </button>
      </div>


      {activeMainTab === 'services' && (
        <>
          {/* Filters */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

        <div className="col-md-2">
          <select
            className="form-select"
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
            className="form-select"
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
            className="form-select"
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
            <option value="all">All</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>
        </div>
        <div className="col-md-3 text-end">
          <span className="text-muted small">
            {services.length} total services
          </span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading services...</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="card shadow-sm">
          <div
            className="card-body"
            style={{
              maxHeight: "62vh",
              overflowY: "auto",
            }}
          >
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "80px" }}>Image</th>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>Rating</th>
                    <th style={{ width: "100px" }}>Status</th>
                    <th style={{ width: "80px" }}>Featured</th>
                    <th style={{ width: "180px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginatedServices.map((service) => (
                      <motion.tr
                        key={service.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td>
                          {service.service_image ? (
                            <img
                              src={
                                service.service_image.startsWith("http")
                                  ? service.service_image
                                  : `${BACKEND_URL}${service.service_image}`
                              }
                              alt={service.service_name}
                              className="rounded"
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/50?text=N/A";
                              }}
                            />
                          ) : (
                            <div
                              className="bg-light rounded d-flex align-items-center justify-content-center"
                              style={{ width: "50px", height: "50px" }}
                            >
                              <FaCut className="text-muted" />
                            </div>
                          )}
                        </td>
                        <td>
                          <strong>{service.service_name}</strong>
                          {service.is_featured && (
                            <FaStar
                              className="text-warning ms-1"
                              title="Featured"
                            />
                          )}
                          {service.discount_price && (
                            <div>
                              <small className="text-muted text-decoration-line-through">
                                {service.price} ETB
                              </small>
                              <small className="text-success fw-bold">
                                {service.discount_price} ETB
                              </small>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {service.category_name || "Uncategorized"}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
                            <FaMoneyBillWave className="me-1" />
                            {service.price.toFixed(2)} ETB
                          </span>
                        </td>
                        <td>
                          <span>
                            <FaClock className="me-1 text-muted" />
                            {formatDuration(service.duration_minutes)}
                          </span>
                        </td>
                        <td>{getServiceTypeBadge(service.service_type)}</td>
                        {/* Rating column */}
                        <td>
                          {service.avg_rating != null &&
                          service.avg_rating > 0 ? (
                            <div className="d-flex align-items-center gap-1 flex-column">
                              <div className="d-flex align-items-center gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <FaStar
                                    key={i}
                                    className={
                                      i < Math.round(service.avg_rating!)
                                        ? "text-yellow-400"
                                        : "text-slate-400"
                                    }
                                    style={{ fontSize: "0.85rem" }}
                                  />
                                ))}
                              </div>
                              <small
                                className="text-muted"
                                style={{ fontSize: "0.75rem" }}
                              >
                                {service.avg_rating.toFixed(1)} (
                                {service.total_ratings || 0})
                              </small>
                            </div>
                          ) : (
                            <small className="text-muted">—</small>
                          )}
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${service.is_available ? "btn-success" : "btn-secondary"}`}
                            onClick={() =>
                              handleToggleAvailability(
                                service.id,
                                service.is_available,
                              )
                            }
                            title={
                              service.is_available ? "Available" : "Unavailable"
                            }
                          >
                            {service.is_available ? (
                              <FaToggleOn size={18} />
                            ) : (
                              <FaToggleOff size={18} />
                            )}
                          </button>
                        </td>
                        <td>
                          {service.is_featured ? (
                            <FaStar className="text-warning" title="Featured" />
                          ) : (
                            <FaEyeSlash
                              className="text-muted"
                              title="Not Featured"
                            />
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/services/edit/${service.id}`)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(service.id)}
                              title="Delete"
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
                      <td colSpan={10} className="text-center py-4 text-muted">
                        No services found. Click "Add Service" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "80px" }}>Image</th>
                    <th>Package Name</th>
                    <th>Description</th>
                    <th>Included Services</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th style={{ width: "150px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td>
                        {pkg.package_image ? (
                          <img
                            src={pkg.package_image.startsWith("http") ? pkg.package_image : `${BACKEND_URL}${pkg.package_image}`}
                            alt={pkg.package_name}
                            className="rounded"
                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/50?text=Pkg";
                            }}
                          />
                        ) : (
                          <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: "50px", height: "50px" }}>
                            <FaBox className="text-muted" />
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{pkg.package_name}</strong>
                        {pkg.is_featured && <FaStar className="text-warning ms-1" title="Featured" />}
                      </td>
                      <td><small className="text-muted">{pkg.description || "No description"}</small></td>
                      <td>
                        <span className="badge bg-info text-dark">
                          {pkg.included_services || "All included"}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bold text-success">
                          <FaMoneyBillWave className="me-1" />
                          {pkg.price.toFixed(2)} ETB
                        </span>
                        {pkg.discount_price && (
                          <div>
                            <small className="text-muted text-decoration-line-through me-1">{pkg.price} ETB</small>
                            <small className="text-success font-weight-bold">{pkg.discount_price} ETB</small>
                          </div>
                        )}
                      </td>
                      <td>
                        <FaClock className="me-1 text-muted" />
                        {formatDuration(pkg.duration_minutes)}
                      </td>
                      <td>
                        <span className={`badge ${pkg.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {pkg.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
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
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeletePackage(pkg.id)}
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
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No service packages found. Click "Add Package" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe this service..."
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
                    placeholder="e.g., fas fa-cut or SVG string"
                  />
                  <small className="text-muted">
                    Optional: FontAwesome class or SVG markup
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
    </div>
  );
};


export default ServicesPage;
