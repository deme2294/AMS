import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import {
  FaEdit, FaPlus, FaStar, FaTimes, FaCut, FaImage, FaArrowLeft,
  FaMoneyBillWave, FaClock, FaUser, FaCheck, FaExternalLinkAlt,
  FaShieldAlt, FaToggleOn, FaToggleOff, FaSlidersH, FaCalendarAlt,
  FaCheckCircle, FaChevronRight, FaTag, FaLayerGroup, FaEye
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import {
  serviceApi,
  serviceCategoryApi,
  bookingApi,
  Service,
  ServiceCategory,
} from '../../services/serviceService';
import { BACKEND_URL, fixImageUrl } from '../../services/apiService';
import ThemeToggle from '../../components/ThemeToggle';
import './EditServicePage.css';

const EditServicePage: React.FC = () => {
  const { t } = useTranslation();
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [barbers, setBarbers] = useState<Array<{ id: number; full_name: string }>>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const [formData, setFormData] = useState({
    category_id: '',
    barber_id: '',
    service_name: '',
    short_description: '',
    description: '',
    price: '',
    discount_price: '',
    duration_minutes: 30,
    service_image: '',
    banner_image: '',
    service_icon: '',
    is_featured: false,
    is_available: true,
    max_customers_per_slot: 1,
    preparation_time: 0,
    cleanup_time: 0,
    booking_buffer_time: 0,
    service_type: 'standard' as 'standard' | 'combo' | 'home_service' | 'vip',
    status: 'active' as 'active' | 'inactive',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setFormError(null);

        const id = Number(serviceId);
        if (!id) throw new Error('Invalid service ID');

        const [svcResp, catResp, barResp] = await Promise.all([
          serviceApi.getById(id),
          serviceCategoryApi.getAll({ status: 'active' }),
          bookingApi.getBarbers(),
        ]);

        if (!svcResp.success) throw new Error('Failed to load service details');
        if (catResp.success) setCategories(catResp.data);
        if (barResp.success) setBarbers(barResp.data);

        const svc = svcResp.data;
        setService(svc);
        setFormData({
          category_id: String(svc.category_id || ''),
          barber_id: svc.barber_id ? String(svc.barber_id) : '',
          service_name: svc.service_name || '',
          short_description: svc.short_description || '',
          description: svc.description || '',
          price: String(svc.price ?? ''),
          discount_price: svc.discount_price ? String(svc.discount_price) : '',
          duration_minutes: Number(svc.duration_minutes) || 30,
          service_image: svc.service_image || '',
          banner_image: svc.banner_image || '',
          service_icon: svc.service_icon || '',
          is_featured: Boolean(svc.is_featured),
          is_available: Boolean(svc.is_available),
          max_customers_per_slot: Number(svc.max_customers_per_slot) || 1,
          preparation_time: Number(svc.preparation_time) || 0,
          cleanup_time: Number(svc.cleanup_time) || 0,
          booking_buffer_time: Number(svc.booking_buffer_time) || 0,
          service_type: (svc.service_type || 'standard') as 'standard' | 'combo' | 'home_service' | 'vip',
          status: (svc.status || 'active') as 'active' | 'inactive',
        });

        if (svc.service_image) {
          setImagePreview(fixImageUrl(svc.service_image) || null);
        }
      } catch (err: any) {
        setFormError(err.message || 'Failed to load service');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      load();
    }
  }, [serviceId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (formError) setFormError(null);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
    if (formError) setFormError(null);
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
    }
  };

  const selectedCategoryName = useMemo(() => {
    const found = categories.find(c => String(c.id) === String(formData.category_id));
    return found ? found.category_name : service?.category_name || 'General Grooming';
  }, [categories, formData.category_id, service]);

  const pricingSavings = useMemo(() => {
    const orig = parseFloat(formData.price || '0');
    const disc = parseFloat(formData.discount_price || '0');
    if (orig > 0 && disc > 0 && orig > disc) {
      return {
        amount: (orig - disc).toFixed(2),
        percent: Math.round(((orig - disc) / orig) * 100),
      };
    }
    return null;
  }, [formData.price, formData.discount_price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    setSaving(true);
    setFormError(null);

    try {
      const payload: any = {
        category_id: parseInt(formData.category_id, 10),
        barber_id: formData.barber_id ? parseInt(formData.barber_id, 10) : null,
        service_name: formData.service_name.trim(),
        short_description: formData.short_description.trim() || undefined,
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        duration_minutes: parseInt(String(formData.duration_minutes), 10),
        service_image: formData.service_image || undefined,
        banner_image: formData.banner_image || undefined,
        service_icon: formData.service_icon || undefined,
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

      const resp = await serviceApi.update(service.id, payload);
      if (!resp.success) throw new Error(resp.message || 'Failed to update service');

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/admin/services');
      }, 1200);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="esp-page-wrapper flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">Loading Service</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Fetching service specifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="esp-page-wrapper">
      <div className="esp-container">
        
        {/* Topbar: Breadcrumb, Live Preview Link, and Theme Toggle */}
        <div className="esp-topbar">
          <div className="esp-breadcrumb">
            <span className="link" onClick={() => navigate('/admin/services')}>Services</span>
            <span className="esp-breadcrumb-sep"><FaChevronRight /></span>
            <span>Editor</span>
            <span className="esp-breadcrumb-sep"><FaChevronRight /></span>
            <span className="esp-breadcrumb-active">#{serviceId} ({formData.service_name || 'Editing'})</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/services')}
              className="esp-back-btn"
            >
              <FaArrowLeft className="text-xs" />
              <span>Back to Services</span>
            </button>

            <ThemeToggle variant="segmented" />
          </div>
        </div>

        {/* Hero Title & Status Banner */}
        <div className="esp-header-banner">
          <div className="esp-header-title-box">
            <h1>
              <FaEdit className="text-indigo-600 dark:text-indigo-400 text-xl" />
              <span>{service?.service_name || `Service #${serviceId}`}</span>
            </h1>
            <p>
              Fine-tune catalogue pricing, appointment duration, customer capacities, and media assets.
            </p>
          </div>

          <div className="esp-header-actions">
            <span className="badge-modern badge-modern-secondary text-xs">
              {selectedCategoryName}
            </span>

            <span className={`badge-modern ${formData.is_available ? 'badge-modern-success' : 'badge-modern-secondary'} text-xs`}>
              {formData.is_available ? '● Catalogue Active' : '○ Unavailable'}
            </span>

            {/* Direct Client Preview Link */}
            <button
              type="button"
              onClick={() => window.open(`/services/book/${serviceId}`, '_blank')}
              className="btn-view-client-page"
              title="Open public booking view in new tab"
            >
              <FaCalendarAlt />
              <span>Preview Live Booking</span>
              <FaExternalLinkAlt className="text-[10px] opacity-70" />
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {formError && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-3">
            <FaCheckCircle className="text-lg text-emerald-500" />
            <span>Service specifications successfully saved to database! Redirecting...</span>
          </div>
        )}

        {/* 2-Column Responsive Form Container */}
        <form onSubmit={handleSubmit}>
          <div className="esp-form-container">
            
            {/* Left Column (Inputs & Specifications) */}
            <div>
              
              {/* SECTION 1: Identity & Description */}
              <div className="esp-section-card">
                <div className="esp-section-header">
                  <div className="esp-section-icon indigo">
                    <FaCut />
                  </div>
                  <div>
                    <h3 className="esp-section-title">Service Identity & Narrative</h3>
                    <p className="esp-section-subtitle">Basic title, category classification, and treatment descriptions</p>
                  </div>
                </div>

                <div className="esp-form-group">
                  <label className="esp-form-label">Service Title *</label>
                  <input
                    type="text"
                    name="service_name"
                    value={formData.service_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Deluxe Rosewater Pedicure & Gel Manicure"
                    required
                    className="esp-form-input"
                  />
                </div>

                <div className="esp-form-group">
                  <label className="esp-form-label">Card Tagline / Short Teaser</label>
                  <input
                    type="text"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    placeholder="e.g. Organic rose petal foot bath, callus smoothing & chip-resistant gel polish"
                    className="esp-form-input"
                  />
                  <span className="esp-helper-text">1-line summary displayed on public booking cards</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="esp-form-group">
                    <label className="esp-form-label">Category *</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      required
                      className="esp-form-select"
                    >
                      <option value="">Select Service Category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="esp-form-group">
                    <label className="esp-form-label">Assigned Specialist (Optional)</label>
                    <select
                      name="barber_id"
                      value={formData.barber_id}
                      onChange={handleInputChange}
                      className="esp-form-select"
                    >
                      <option value="">First Available (Any Master Stylist)</option>
                      {barbers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="esp-form-group mb-0">
                  <label className="esp-form-label">Comprehensive Treatment Description</label>
                  <textarea
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Full treatment experience, steps, benefits, products used, and aftercare..."
                    className="esp-form-textarea resize-none"
                  />
                </div>
              </div>

              {/* SECTION 2: Pricing & Economic Model */}
              <div className="esp-section-card">
                <div className="esp-section-header">
                  <div className="esp-section-icon emerald">
                    <FaMoneyBillWave />
                  </div>
                  <div>
                    <h3 className="esp-section-title">Pricing & Promotional Offers</h3>
                    <p className="esp-section-subtitle">Set standard investment fee and optional discount promotions</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="esp-form-group mb-0">
                    <label className="esp-form-label">Standard Price (ETB) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                      placeholder="750.00"
                      className="esp-form-input font-mono font-bold"
                    />
                  </div>

                  <div className="esp-form-group mb-0">
                    <label className="esp-form-label">Discount Promotional Price (ETB)</label>
                    <input
                      type="number"
                      name="discount_price"
                      value={formData.discount_price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="680.00"
                      className="esp-form-input font-mono font-bold"
                    />
                  </div>
                </div>

                {pricingSavings && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>🎉 Active Special Offer Applied:</span>
                    <span>Save {pricingSavings.amount} ETB ({pricingSavings.percent}% off standard price)</span>
                  </div>
                )}
              </div>

              {/* SECTION 3: Logistics, Timing & Capacity */}
              <div className="esp-section-card">
                <div className="esp-section-header">
                  <div className="esp-section-icon amber">
                    <FaClock />
                  </div>
                  <div>
                    <h3 className="esp-section-title">Appointment Duration & Logistics</h3>
                    <p className="esp-section-subtitle">Define treatment length, turnover buffers, and concurrent capacity</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="esp-form-group mb-0">
                    <label className="esp-form-label">Session Duration (min) *</label>
                    <input
                      type="number"
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleNumberChange}
                      min="5"
                      step="5"
                      required
                      className="esp-form-input font-bold"
                    />
                    <span className="esp-helper-text">Base appointment length</span>
                  </div>

                  <div className="esp-form-group mb-0">
                    <label className="esp-form-label">Prep Time (min)</label>
                    <input
                      type="number"
                      name="preparation_time"
                      value={formData.preparation_time}
                      onChange={handleNumberChange}
                      min="0"
                      step="5"
                      className="esp-form-input"
                    />
                    <span className="esp-helper-text">Station setup buffer</span>
                  </div>

                  <div className="esp-form-group mb-0">
                    <label className="esp-form-label">Cleanup Time (min)</label>
                    <input
                      type="number"
                      name="cleanup_time"
                      value={formData.cleanup_time}
                      onChange={handleNumberChange}
                      min="0"
                      step="5"
                      className="esp-form-input"
                    />
                    <span className="esp-helper-text">Sanitization turnover</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="esp-form-group mb-0">
                    <label className="esp-form-label">Booking Buffer Time (min)</label>
                    <input
                      type="number"
                      name="booking_buffer_time"
                      value={formData.booking_buffer_time}
                      onChange={handleNumberChange}
                      min="0"
                      step="5"
                      className="esp-form-input"
                    />
                    <span className="esp-helper-text">Minimum notice before booking</span>
                  </div>

                  <div className="esp-form-group mb-0">
                    <label className="esp-form-label">Max Customers per Slot</label>
                    <input
                      type="number"
                      name="max_customers_per_slot"
                      value={formData.max_customers_per_slot}
                      onChange={handleNumberChange}
                      min="1"
                      className="esp-form-input"
                    />
                    <span className="esp-helper-text">Concurrent client chairs</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Catalogue Visibility & Flags */}
              <div className="esp-section-card">
                <div className="esp-section-header">
                  <div className="esp-section-icon cyan">
                    <FaSlidersH />
                  </div>
                  <div>
                    <h3 className="esp-section-title">Catalogue Classification & Visibility</h3>
                    <p className="esp-section-subtitle">Tier classification and public booking availability</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="esp-form-group mb-0">
                    <label className="esp-form-label">Service Type Tier</label>
                    <select
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleInputChange}
                      className="esp-form-select"
                    >
                      <option value="standard">Standard Salon Treatment</option>
                      <option value="combo">Combo Treatment Package</option>
                      <option value="vip">VIP Executive Treatment</option>
                      <option value="home_service">Home / On-Location Service</option>
                    </select>
                  </div>

                  <div className="esp-form-group mb-0">
                    <label className="esp-form-label">Lifecycle Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="esp-form-select"
                    >
                      <option value="active">Active (Available)</option>
                      <option value="inactive">Inactive (Archived)</option>
                    </select>
                  </div>
                </div>

                {/* Modern Toggle Cards */}
                <div
                  className="esp-toggle-item"
                  onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                >
                  <div>
                    <span className="esp-toggle-label">
                      <FaStar className="text-amber-400" />
                      <span>Featured Service Badge</span>
                    </span>
                    <span className="esp-toggle-desc">Highlights this service on the home showcase & top of category lists</span>
                  </div>
                  <div className="text-2xl cursor-pointer">
                    {formData.is_featured ? (
                      <FaToggleOn className="text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <FaToggleOff className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                </div>

                <div
                  className="esp-toggle-item mb-0"
                  onClick={() => setFormData(prev => ({ ...prev, is_available: !prev.is_available }))}
                >
                  <div>
                    <span className="esp-toggle-label">
                      <FaCheckCircle className={formData.is_available ? 'text-emerald-500' : 'text-slate-400'} />
                      <span>Accepting Customer Bookings</span>
                    </span>
                    <span className="esp-toggle-desc">Toggle off to temporarily pause new appointment reservations</span>
                  </div>
                  <div className="text-2xl cursor-pointer">
                    {formData.is_available ? (
                      <FaToggleOn className="text-emerald-500" />
                    ) : (
                      <FaToggleOff className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Sticky Live Preview & Media Manager */}
            <div>
              <div className="esp-preview-wrapper">
                
                {/* Live Service Preview Card */}
                <div className="esp-preview-card">
                  <div className="esp-preview-header">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Live Customer Preview
                    </span>
                    <span className="esp-preview-badge">Real-Time</span>
                  </div>

                  <div className="esp-preview-media">
                    {imagePreview || formData.banner_image || formData.service_image ? (
                      <img
                        src={imagePreview || formData.banner_image || formData.service_image}
                        alt="Preview"
                        className="esp-preview-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                        <FaCut className="text-4xl text-indigo-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Grooming Preview</span>
                      </div>
                    )}

                    <div className="esp-preview-overlay">
                      <div className="flex items-center justify-between gap-2">
                        <span className="badge-modern badge-modern-info text-xs">
                          {selectedCategoryName}
                        </span>
                        {formData.is_featured && (
                          <span className="badge-modern badge-modern-warning text-xs d-inline-flex align-items-center gap-1">
                            <FaStar className="text-amber-400 text-[10px]" /> Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="esp-preview-body">
                    <h4 className="esp-preview-title">
                      {formData.service_name || 'Service Title Preview'}
                    </h4>
                    <p className="esp-preview-desc">
                      {formData.short_description || formData.description || 'Service teaser tagline and luxury details will be rendered here for potential clients.'}
                    </p>

                    <div className="esp-preview-stats">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <FaClock className="text-indigo-500" />
                        <span>{formData.duration_minutes} min session</span>
                      </div>

                      <div className="text-right">
                        {formData.discount_price ? (
                          <div>
                            <span className="text-xs text-slate-400 line-through mr-1.5">
                              {formData.price} ETB
                            </span>
                            <span className="esp-preview-price">
                              {formData.discount_price} <span className="text-xs font-semibold">ETB</span>
                            </span>
                          </div>
                        ) : (
                          <span className="esp-preview-price">
                            {formData.price || '0.00'} <span className="text-xs font-semibold">ETB</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media Management Card */}
                <div className="esp-section-card mb-0">
                  <div className="esp-section-header">
                    <div className="esp-section-icon indigo">
                      <FaImage />
                    </div>
                    <div>
                      <h3 className="esp-section-title">Media & Brand Assets</h3>
                      <p className="esp-section-subtitle">Cover photography and hero banners</p>
                    </div>
                  </div>

                  {/* Primary Service Image Upload */}
                  <div className="esp-form-group">
                    <label className="esp-form-label">Cover Image Upload</label>
                    <div className="p-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center hover:border-indigo-400 transition-all bg-slate-50/50 dark:bg-slate-900/50">
                      {imagePreview ? (
                        <div className="relative rounded-lg overflow-hidden mb-2 max-h-36">
                          <img
                            src={imagePreview}
                            alt="Uploaded preview"
                            className="w-full h-36 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-lg hover:bg-rose-700 transition-all"
                            onClick={() => {
                              setImagePreview(null);
                              setImageFile(null);
                            }}
                            title="Remove image"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="py-3">
                          <FaImage className="text-3xl text-slate-400 mx-auto mb-1.5" />
                          <p className="text-xs text-slate-500 font-semibold mb-0">Choose image file or drag here</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="text-xs text-slate-500 w-full file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Direct Image URL */}
                  <div className="esp-form-group">
                    <label className="esp-form-label">Or Direct Image URL</label>
                    <input
                      type="url"
                      name="service_image"
                      value={formData.service_image}
                      onChange={(e) => {
                        handleInputChange(e);
                        if (e.target.value.startsWith('http')) {
                          setImagePreview(e.target.value);
                        }
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="esp-form-input text-xs"
                    />
                  </div>

                  {/* Widescreen Banner Image URL */}
                  <div className="esp-form-group mb-0">
                    <label className="esp-form-label">Widescreen Hero Banner URL</label>
                    <input
                      type="url"
                      name="banner_image"
                      value={formData.banner_image}
                      onChange={handleInputChange}
                      placeholder="https://images.unsplash.com/photo-banner..."
                      className="esp-form-input text-xs"
                    />
                    <span className="esp-helper-text">Background for full service detail showcase</span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="esp-actions-row">
                  <button
                    type="button"
                    className="esp-btn-cancel"
                    onClick={() => navigate('/admin/services')}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="esp-btn-save"
                    disabled={saving || formSuccess}
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        <span>Updating Service...</span>
                      </>
                    ) : (
                      <>
                        <FaEdit />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
};

export default EditServicePage;
