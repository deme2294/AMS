import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import {
  FaCut, FaImage, FaTimes, FaStar, FaArrowLeft,
  FaSave, FaCheckCircle, FaExclamationTriangle, FaClock, FaMoneyBillWave,
  FaUser, FaCloudUploadAlt, FaEye, FaTag, FaSlidersH
} from 'react-icons/fa';
import { useAuth } from '../../components/Auth/AuthContext';
import { serviceApi, serviceCategoryApi, ServiceCategory, bookingApi } from '../../services/serviceService';
import { BACKEND_URL, fixImageUrl } from '../../services/apiService';
import { ThemeToggle } from '../../components/ThemeToggle';
import './ServiceSubmissionPage.css';

interface Barber {
  id: number;
  full_name: string;
  username?: string;
  email?: string;
}

const ServiceSubmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const createdBy = user?.user_id ?? 0;

  const [formData, setFormData] = useState({
    service_name: '',
    category_id: '',
    barber_id: '',
    description: '',
    price: '',
    discount_price: '',
    duration_minutes: 30,
    preparation_time: 0,
    cleanup_time: 0,
    booking_buffer_time: 0,
    max_customers_per_slot: 1,
    service_type: 'standard',
    status: 'active',
    is_featured: false,
    is_available: true,
    service_icon: '',
  });

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [barbersError, setBarbersError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [justSubmitted, setJustSubmitted] = useState(false);

  // ── Fetch categories + barbers independently ────────────────────────────
  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setLoading(true);
    setFormError(null);
    setCategoriesError(null);
    setBarbersError(null);

    try {
      const [categoriesResult, barbersResult] = await Promise.allSettled([
        serviceCategoryApi.getAll({ status: 'active' }),
        bookingApi.getBarbers(),
      ]);

      // ── Categories ──────────────────────────────────────────────────────
      if (categoriesResult.status === 'fulfilled') {
        const res = categoriesResult.value;
        if (res.success && res.data && res.data.length > 0) {
          setCategories(res.data);
          setFormData(prev => ({
            ...prev,
            category_id: prev.category_id || String(res.data[0].id),
          }));
        } else {
          setCategoriesError(
            res.success
              ? 'No active service categories found. Please create a category first.'
              : (res as any).message || 'Failed to load categories.'
          );
        }
      } else {
        setCategoriesError((categoriesResult as any).error?.message || 'Failed to load service categories.');
      }

      // ── Barbers ────────────────────────────────────────────────────────
      if (barbersResult.status === 'fulfilled') {
        const res = barbersResult.value;
        if (res.success && res.data) {
          setBarbers(res.data);
        }
      } else {
        setBarbersError((barbersResult as any).error?.message || 'Failed to load barbers.');
      }
    } catch (error: any) {
      console.error('[SSP] fetchData error:', error);
      setFormError(error.message || 'Failed to load required data.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/service-submission' } });
      return;
    }
    fetchData();
  }, [isAuthenticated, user, navigate, fetchData]);

  // ── Sync category image preview ─────────────────────────────────────────
  useEffect(() => {
    if (!formData.category_id) {
      setCategoryImagePreview(null);
      return;
    }
    const selected = categories.find(c => String(c.id) === formData.category_id);
    if (!selected?.category_image) {
      setCategoryImagePreview(null);
      return;
    }
    setCategoryImagePreview(fixImageUrl(selected.category_image));
  }, [formData.category_id, categories]);

  // ── Field change handlers ───────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' && 'checked' in e.target ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' && checked !== undefined ? checked : value,
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ── Required-field validation UI ───────────────────────────────────────
  const requiredFields: { key: string; label: string; check: (v: any) => boolean }[] = [
    { key: 'service_name', label: 'Service Name', check: v => typeof v === 'string' && v.trim().length > 0 },
    { key: 'category_id', label: 'Category', check: v => typeof v === 'string' && v.trim().length > 0 && v !== '0' },
    { key: 'price', label: 'Price', check: v => typeof v === 'string' && v.trim().length > 0 && parseFloat(v) > 0 },
    { key: 'duration_minutes', label: 'Duration (min)', check: v => typeof v === 'number' && v >= 5 },
  ];

  const getMissing = () => requiredFields.filter(f => !f.check(formData[f.key as keyof typeof formData]));

  const getRequiredAlert = () => {
    const missing = getMissing();
    if (missing.length === 0 || justSubmitted) return null;
    return (
      <Alert variant="danger" className="mb-4">
        <FaExclamationTriangle className="me-2" />
        The following field{missing.length > 1 ? 's are' : ' is'} required:{' '}
        <strong>{missing.map(f => f.label).join(', ')}</strong>
      </Alert>
    );
  };

  const getInvalidClass = (key: string) =>
    touched[key] && !requiredFields.find(f => f.key === key)?.check(formData[key as keyof typeof formData])
      ? 'border-red-500 focus:border-red-500' : '';

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJustSubmitted(true);
    setTouched(
      requiredFields.reduce((acc, f) => ({ ...acc, [f.key]: true }), {} as Record<string, boolean>)
    );

    const missing = getMissing();
    if (missing.length > 0) {
      setFormError(`Please fill in all required fields: ${missing.map(f => f.label).join(', ')}.`);
      setJustSubmitted(false);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        category_id: parseInt(String(formData.category_id), 10),
        barber_id: formData.barber_id ? parseInt(String(formData.barber_id), 10) : null,
        service_name: formData.service_name.trim(),
        description: formData.description || null,
        price: parseFloat(String(formData.price)),
        discount_price: formData.discount_price ? parseFloat(String(formData.discount_price)) : null,
        duration_minutes: parseInt(String(formData.duration_minutes), 10),
        service_icon: formData.service_icon || null,
        is_featured: !!formData.is_featured,
        is_available: !!formData.is_available,
        max_customers_per_slot: parseInt(String(formData.max_customers_per_slot), 10) || 1,
        preparation_time: parseInt(String(formData.preparation_time), 10) || 0,
        cleanup_time: parseInt(String(formData.cleanup_time), 10) || 0,
        booking_buffer_time: parseInt(String(formData.booking_buffer_time), 10) || 0,
        service_type: formData.service_type || 'standard',
        status: formData.status || 'active',
        created_by: createdBy,
      };

      if (imageFile) {
        payload.imageFile = imageFile;
      }

      console.log('[SSP] Submitting payload:', payload);
      await serviceApi.create(payload);
      console.log('[SSP] Submit success.');
      setFormSuccess(true);
      setSubmitting(false);

      setTimeout(() => {
        navigate('/admin/services');
      }, 1500);
    } catch (error: any) {
      console.error('[SSP] Submit error:', error);
      setFormError(error.message || 'An error occurred while saving the service. Please try again.');
      setSubmitting(false);
      setJustSubmitted(false);
    }
  };

  const handleReset = () => {
    setFormData({
      service_name: '',
      category_id: categories.length > 0 ? String(categories[0].id) : '',
      barber_id: '',
      description: '',
      price: '',
      discount_price: '',
      duration_minutes: 30,
      preparation_time: 0,
      cleanup_time: 0,
      booking_buffer_time: 0,
      max_customers_per_slot: 1,
      service_type: 'standard',
      status: 'active',
      is_featured: false,
      is_available: true,
      service_icon: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setCategoryImagePreview(null);
    setFormSuccess(false);
    setFormError(null);
    setTouched({});
    setJustSubmitted(false);
    setCategoriesError(null);
    setBarbersError(null);
  };

  const selectedCategory = categories.find(c => String(c.id) === formData.category_id);
  const selectedBarber = barbers.find(b => String(b.id) === formData.barber_id);

  if (loading) {
    return (
      <div className="min-h-screen d-flex flex-column align-items-center justify-content-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 gap-3">
        <Spinner animation="border" variant="primary" />
        <p className="text-sm font-medium">Loading service form configuration...</p>
      </div>
    );
  }

  return (
    <div className="ssp-container bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Toast on success */}
      {formSuccess && (
        <div className="position-fixed top-4 start-50 translate-middle-x z-50 w-full max-w-md px-4">
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl d-flex align-items-center gap-3 animate-bounce">
            <FaCheckCircle className="text-2xl flex-shrink-0" />
            <div>
              <h5 className="font-bold text-sm mb-0">Service Created Successfully!</h5>
              <p className="text-xs text-emerald-100 mb-0">Redirecting you to the services catalogue...</p>
            </div>
          </div>
        </div>
      )}

      {/* Global error banner */}
      {formError && !formSuccess && (
        <div className="position-fixed top-4 start-50 translate-middle-x z-50 w-full max-w-xl px-4">
          <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-2xl d-flex align-items-center justify-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <FaExclamationTriangle className="text-xl flex-shrink-0" />
              <span className="text-sm font-medium">{formError}</span>
            </div>
            <button
              onClick={() => setFormError(null)}
              className="text-white hover:text-rose-200 transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* ── Modern Frosted Header with Theme Toggle ── */}
      <header className="ssp-header bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold text-decoration-none transition-colors border-0 cursor-pointer"
              title="Go back to previous page"
            >
              <FaArrowLeft /> Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-0 leading-tight">
                Create New Service
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                Add an individual service to your live booking catalogue
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <ThemeToggle variant="segmented" />
          </div>
        </div>
      </header>

      {/* ── Form Body ── */}
      <main className="flex-grow-1 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          {getRequiredAlert()}

          {categoriesError && categories.length === 0 && (
            <Alert variant="warning" className="mb-4 d-flex align-items-center gap-2">
              <FaExclamationTriangle />
              <span>
                Cannot load categories — {categoriesError}{' '}
                <Link to="/admin/services/categories" className="alert-link font-bold">
                  Go to Categories Management
                </Link>
              </span>
            </Alert>
          )}

          {barbersError && barbers.length === 0 && (
            <Alert variant="info" className="mb-4 text-xs">
              <FaUser className="me-2" />
              Note: No barbers currently linked. Services can still be created as salon-wide general services.
            </Alert>
          )}

          <Form id="service-form" onSubmit={handleSubmit} noValidate>
            <div className="row g-4">
              {/* ══ Left Column: Form Details (7 cols) ══ */}
              <div className="col-lg-7">
                {/* 1. Basic Information */}
                <div className="ssp-section-card glass-card mb-4">
                  <div className="ssp-section-header">
                    <div className="ssp-section-icon bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <FaCut />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">
                        Basic Information
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                        Name, category, and staff assignment
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Service Name */}
                    <div>
                      <label className="ssp-label">
                        Service Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="service_name"
                        value={formData.service_name}
                        onChange={handleInputChange}
                        placeholder="e.g. Royal Beard Grooming, Skin Fade Haircut"
                        required
                        className={`ssp-input ${getInvalidClass('service_name')}`}
                      />
                      {touched.service_name && !formData.service_name && (
                        <p className="text-rose-500 text-xs mt-1 mb-0">Service name is required.</p>
                      )}
                    </div>

                    {/* Category Selection */}
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="ssp-label mb-0">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <Link
                          to="/admin/services/categories"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Manage Categories &rarr;
                        </Link>
                      </div>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                        required
                        className={`ssp-select ${getInvalidClass('category_id')}`}
                      >
                        <option value="">-- Select a Category --</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id.toString()}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                      {touched.category_id && !formData.category_id && (
                        <p className="text-rose-500 text-xs mt-1 mb-0">Please choose a category.</p>
                      )}
                    </div>

                    {/* Assigned Barber */}
                    <div>
                      <label className="ssp-label">
                        Assigned Barber <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <select
                        name="barber_id"
                        value={formData.barber_id}
                        onChange={handleInputChange}
                        className="ssp-select"
                      >
                        <option value="">Unassigned (Any Available Barber)</option>
                        {barbers.map(barber => (
                          <option key={barber.id} value={String(barber.id)}>
                            {barber.username
                              ? `${barber.username} — ${barber.full_name ?? ''}`.trim()
                              : (barber.full_name ?? `Barber #${barber.id}`)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="ssp-label">Service Description</label>
                      <textarea
                        rows={3}
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Detailed description of what the client will experience..."
                        className="ssp-textarea"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pricing & Revenue */}
                <div className="ssp-section-card glass-card mb-4">
                  <div className="ssp-section-header">
                    <div className="ssp-section-icon bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FaMoneyBillWave />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">
                        Pricing &amp; Revenue
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                        Standard rate and optional promotional price
                      </p>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="ssp-label">
                        Standard Price (ETB) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                        className={`ssp-input ${getInvalidClass('price')}`}
                      />
                      {touched.price && (!formData.price || parseFloat(String(formData.price)) <= 0) && (
                        <p className="text-rose-500 text-xs mt-1 mb-0">A valid price is required.</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="ssp-label">
                        Discount / Promotional Price (ETB) <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        name="discount_price"
                        value={formData.discount_price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="Leave blank for regular price"
                        className="ssp-input"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Timing & Scheduling */}
                <div className="ssp-section-card glass-card mb-4">
                  <div className="ssp-section-header">
                    <div className="ssp-section-icon bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <FaClock />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">
                        Timing &amp; Slot Management
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                        Duration, preparation, and turnaround windows
                      </p>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="ssp-label">
                        Duration (min) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="duration_minutes"
                        value={formData.duration_minutes}
                        onChange={handleNumberChange}
                        min="5"
                        required
                        className={`ssp-input ${getInvalidClass('duration_minutes')}`}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="ssp-label">Prep Time (min)</label>
                      <input
                        type="number"
                        name="preparation_time"
                        value={formData.preparation_time}
                        onChange={handleNumberChange}
                        min="0"
                        className="ssp-input"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="ssp-label">Cleanup Time (min)</label>
                      <input
                        type="number"
                        name="cleanup_time"
                        value={formData.cleanup_time}
                        onChange={handleNumberChange}
                        min="0"
                        className="ssp-input"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="ssp-label">Buffer Between Bookings (min)</label>
                      <input
                        type="number"
                        name="booking_buffer_time"
                        value={formData.booking_buffer_time}
                        onChange={handleNumberChange}
                        min="0"
                        className="ssp-input"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="ssp-label">Max Customers per Slot</label>
                      <input
                        type="number"
                        name="max_customers_per_slot"
                        value={formData.max_customers_per_slot}
                        onChange={handleNumberChange}
                        min="1"
                        className="ssp-input"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Advanced Settings */}
                <div className="ssp-section-card glass-card">
                  <div className="ssp-section-header">
                    <div className="ssp-section-icon bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <FaSlidersH />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">
                        Advanced Settings
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                        Classification, visibility, and badges
                      </p>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="ssp-label">Service Type</label>
                      <select
                        name="service_type"
                        value={formData.service_type}
                        onChange={handleInputChange}
                        className="ssp-select"
                      >
                        <option value="standard">Standard Service</option>
                        <option value="combo">Combo Package</option>
                        <option value="home_service">Home Service</option>
                        <option value="vip">VIP Treatment</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="ssp-label">Catalogue Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="ssp-select"
                      >
                        <option value="active">Active (Published)</option>
                        <option value="inactive">Inactive (Hidden)</option>
                      </select>
                    </div>
                    <div className="col-md-6 pt-2">
                      <label className="d-flex align-items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="is_featured"
                          checked={formData.is_featured}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 d-flex align-items-center gap-1.5">
                          <FaStar className="text-amber-400" /> Featured Service
                        </span>
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 ms-6 mb-0">
                        Highlights this service prominently on the homepage
                      </p>
                    </div>
                    <div className="col-md-6 pt-2">
                      <label className="d-flex align-items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="is_available"
                          checked={formData.is_available}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Currently Available for Booking
                        </span>
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 ms-6 mb-0">
                        Allows customers to select time slots for this service
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══ Right Column: Media & Live Customer Preview (5 cols) ══ */}
              <div className="col-lg-5">
                {/* Media Uploads Card */}
                <div className="ssp-section-card glass-card mb-4">
                  <div className="ssp-section-header">
                    <div className="ssp-section-icon bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <FaImage />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">
                        Service Media
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                        Upload custom image or use category banner
                      </p>
                    </div>
                  </div>

                  {/* Dropzone Upload */}
                  <div className="mb-4">
                    <label className="ssp-label mb-2">Custom Service Image</label>
                    {imagePreview ? (
                      <div className="position-relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img
                          src={imagePreview}
                          alt="Service Preview"
                          className="w-100 object-cover"
                          style={{ maxHeight: '220px' }}
                        />
                        <button
                          type="button"
                          onClick={() => { setImagePreview(null); setImageFile(null); }}
                          className="position-absolute top-3 end-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-8 h-8 d-flex align-items-center justify-content-center shadow-lg transition-colors border-0"
                          title="Remove Image"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="ssp-upload-zone d-block mb-0">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="visually-hidden"
                        />
                        <div className="d-flex flex-column align-items-center justify-content-center py-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 d-flex align-items-center justify-content-center mb-2">
                            <FaCloudUploadAlt size={22} />
                          </div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Click to upload custom photo
                          </span>
                          <span className="text-xs text-slate-400 mt-1">
                            PNG, JPG, or WEBP up to 5MB
                          </span>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Service Icon string */}
                  <div>
                    <label className="ssp-label">Service Icon (Optional)</label>
                    <input
                      type="text"
                      name="service_icon"
                      value={formData.service_icon}
                      onChange={handleInputChange}
                      placeholder="e.g. FaCut, scissors, or SVG"
                      className="ssp-input"
                    />
                  </div>
                </div>

                {/* ── Interactive Live Customer Preview ── */}
                <div className="ssp-preview-card glass-card">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 d-flex align-items-center justify-content-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 d-flex align-items-center gap-1.5">
                      <FaEye className="text-indigo-500" /> Live Customer Preview
                    </span>
                    <span className="badge-modern badge-modern-info text-xs">
                      Simulated
                    </span>
                  </div>

                  {/* Image / Fallback Hero */}
                  <div className="ssp-preview-img-container">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="ssp-preview-img"
                      />
                    ) : categoryImagePreview ? (
                      <img
                        src={categoryImagePreview}
                        alt="Category Preview"
                        className="ssp-preview-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white/40">
                        <FaCut size={48} />
                      </div>
                    )}

                    {formData.is_featured && (
                      <div className="position-absolute top-3 start-3">
                        <span className="badge-modern badge-modern-warning text-xs d-flex align-items-center gap-1 shadow-lg">
                          <FaStar className="text-amber-400" /> Featured
                        </span>
                      </div>
                    )}

                    <div className="position-absolute bottom-3 end-3">
                      <span className="badge-modern badge-modern-secondary text-xs shadow-md backdrop-blur-md bg-black/50 text-white border-0">
                        <FaClock className="me-1" /> {formData.duration_minutes} min
                      </span>
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                        {selectedCategory?.category_name || 'Category'}
                      </span>
                      <div className="d-flex align-items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <FaStar key={i} className="text-amber-400 text-xs" />
                        ))}
                        <span className="text-xs text-slate-400 ms-1 font-semibold">5.0</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1">
                      {formData.service_name || 'Untitled Service'}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {formData.description || 'No description provided yet. Add details on the left to show clients what to expect.'}
                    </p>

                    <div className="d-flex align-items-center justify-content-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs text-slate-400 d-block">Price</span>
                        <div className="d-flex align-items-baseline gap-2">
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {formData.discount_price ? formData.discount_price : (formData.price || '0.00')} ETB
                          </span>
                          {formData.discount_price && formData.price && (
                            <span className="text-xs text-slate-400 line-through">
                              {formData.price} ETB
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled
                        className="btn-modern btn-modern-primary text-xs py-2 px-3 opacity-90 cursor-default"
                      >
                        Book Now
                      </button>
                    </div>

                    {selectedBarber && (
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 d-flex align-items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <FaUser className="text-slate-400" />
                        <span>Dedicated Barber: <strong>{selectedBarber.full_name}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </div>
      </main>

      {/* ── Modern Frosted Floating Action Bar ── */}
      <footer className="ssp-floating-bar">
        <div className="max-w-7xl mx-auto d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center text-sm-start">
            {categories.length === 0 ? (
              <span className="text-rose-500 font-medium">
                No active categories. Create one before submitting services.
              </span>
            ) : (
              <span>Fields marked with <strong className="text-rose-500">*</strong> are required.</span>
            )}
          </div>

          <div className="d-flex align-items-center gap-3 w-full w-sm-auto justify-content-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting || formSuccess}
              className="btn-modern btn-modern-secondary text-sm"
            >
              <FaTimes className="me-1.5" /> Reset Form
            </button>

            <button
              type="submit"
              form="service-form"
              disabled={submitting || formSuccess || categories.length === 0}
              className="btn-modern btn-modern-primary text-sm min-w-[220px] shadow-lg shadow-indigo-500/20"
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving to Database...
                </>
              ) : formSuccess ? (
                <>
                  <FaCheckCircle className="me-2 text-emerald-300" />
                  Service Saved!
                </>
              ) : (
                <>
                  <FaSave className="me-2" />
                  Submit Service to Database
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ServiceSubmissionPage;
