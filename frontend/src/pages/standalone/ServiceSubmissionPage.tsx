import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import {
  FaCut, FaPlus, FaImage, FaTimes, FaStar, FaArrowLeft,
  FaSave, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../../components/Auth/AuthContext';
import { serviceApi, serviceCategoryApi, ServiceCategory, bookingApi } from '../../services/serviceService';
import { BACKEND_URL } from '../../services/apiService';

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
    setCategoryImagePreview(
      selected.category_image.startsWith('http') ? selected.category_image : `${BACKEND_URL}${selected.category_image}`
    );
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
     { key: 'service_name',       label: 'Service Name',
       check: v => typeof v === 'string' && v.trim().length > 0 },
     { key: 'category_id',        label: 'Category',
       check: v => typeof v === 'string' && v.trim().length > 0 && v !== '0' },
     { key: 'price',              label: 'Price',
       check: v => typeof v === 'string' && v.trim().length > 0 && parseFloat(v) > 0 },
     { key: 'duration_minutes',   label: 'Duration (min)',
       check: v => typeof v === 'number' && v >= 5 },
   ];

  const getMissing = () => requiredFields.filter(f => !f.check(formData[f.key as keyof typeof formData]));

  const getRequiredAlert = () => {
    const missing = getMissing();
    if (missing.length === 0 || justSubmitted) return null;
    return (
      <Alert variant="danger" className="mb-3">
        <FaExclamationTriangle className="me-2" />
        The following field{/* (sic) */}
        {missing.length > 1 ? 's are' : ' is'} required:{' '}
        {missing.map(f => f.label).join(', ')}
      </Alert>
    );
  };

  const labelRequired = (fieldKey: string) =>
    requiredFields.find(f => f.key === fieldKey) ? <> <span className="text-danger">*</span></> : null;

  const getInvalidClass = (key: string) =>
    touched[key] && !requiredFields.find(f => f.key === key)?.check(formData[key as keyof typeof formData])
      ? 'is-invalid' : '';

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
        category_id:            parseInt(String(formData.category_id), 10),
        barber_id:              formData.barber_id ? parseInt(String(formData.barber_id), 10) : null,
        service_name:           formData.service_name.trim(),
        description:            formData.description || null,
        price:                  parseFloat(String(formData.price)),
        discount_price:         formData.discount_price ? parseFloat(String(formData.discount_price)) : null,
        duration_minutes:       parseInt(String(formData.duration_minutes), 10),
        service_icon:           formData.service_icon || null,
        is_featured:            !!formData.is_featured,
        is_available:           !!formData.is_available,
        max_customers_per_slot: parseInt(String(formData.max_customers_per_slot), 10) || 1,
        preparation_time:       parseInt(String(formData.preparation_time), 10) || 0,
        cleanup_time:           parseInt(String(formData.cleanup_time), 10) || 0,
        booking_buffer_time:    parseInt(String(formData.booking_buffer_time), 10) || 0,
        service_type:           formData.service_type || 'standard',
        status:                 formData.status || 'active',
        created_by:             createdBy,
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
        navigate('/services');
      }, 2000);
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
      category_id:  categories.length > 0 ? String(categories[0].id) : '',
      barber_id:    '',
      description:  '',
      price:        '',
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

  // ── Render helpers ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light d-flex flex-column" style={{ minHeight: '100vh', overflow: 'hidden' }}>

      {/* Toast on success */}
      {formSuccess && (
        <div className="position-fixed top-0 start-0 w-100" style={{ zIndex: 1060 }}>
          <div className="container py-3">
            <Alert variant="success" className="mb-0 text-center shadow">
              <FaCheckCircle className="me-2" />
              Service created successfully! Redirecting to All Services…
            </Alert>
          </div>
        </div>
      )}

      {/* Global error bar */}
      {formError && !formSuccess && (
        <div className="position-fixed top-0 start-0 w-100" style={{ zIndex: 1060 }}>
          <div className="container py-3">
            <Alert variant="danger" className="mb-0 text-center shadow">
              <FaExclamationTriangle className="me-2" />
              {formError}
            </Alert>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-white border-bottom py-3" style={{ flexShrink: 0 }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Link to="/services" className="text-decoration-none mb-1 text-muted d-inline-block">
                <FaArrowLeft className="me-1" /> Back to List
              </Link>
              <h4 className="mb-0 fw-bold">Create New Service</h4>
              <p className="text-muted mb-0">Create a new service for the salon</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form body ── */}
      <div className="flex-grow-1 overflow-auto" style={{ paddingBottom: '120px' }}>
        <div className="container py-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <style>{`
                .card-body::-webkit-scrollbar { width: 10px; }
                .card-body::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 5px; }
                .card-body::-webkit-scrollbar-thumb { background: #0d6efd; border-radius: 5px; }
                .card-body::-webkit-scrollbar-thumb:hover { background: #0b5ed7; }
              `}</style>

              {getRequiredAlert()}

              {categoriesError && categories.length === 0 && (
                <Alert variant="warning" className="mb-4">
                  <FaExclamationTriangle className="me-2" /> Cannot load categories — {categoriesError}{' '}
                  <Link to="/services/categories" className="alert-link">Go to Categories</Link>
                </Alert>
              )}

              {barbersError && barbers.length === 0 && getMissing().find(f => f.key === 'barber_id') === undefined && (
                <Alert variant="warning" className="mb-4">
                  <FaExclamationTriangle className="me-2" /> Cannot load barbers — {barbersError}
                </Alert>
              )}

              <Form id="service-form" onSubmit={handleSubmit} noValidate>
                <div className="row g-4">

                  {/* ══ Left column – Basic Info, Pricing, Timing, Settings ══ */}
                  <div className="col-md-8">
                    <h6 className="text-uppercase text-primary fw-bold small mb-3" style={{ letterSpacing: '1px' }}>
                      <FaCut className="me-2 text-primary" />Basic Information
                    </h6>
                    <div className="bg-white p-3 border rounded shadow-sm mb-4">

                       {/* Service Name */}
                       <Form.Group className="mb-4">
                         <Form.Label>
                           Service Name <span className="text-danger">*</span>
                         </Form.Label>
                         <Form.Control
                           type="text"
                           name="service_name"
                           value={formData.service_name}
                           onChange={handleInputChange}
                           placeholder="e.g., Classic Haircut, Beard Trim"
                           required
                           className={getInvalidClass('service_name')}
                         />
                         {touched.service_name && !formData.service_name && (
                           <div className="text-danger small mt-1">Service name is required.</div>
                         )}
                       </Form.Group>

                      {/* Select Category */}
                      <Form.Group className="mb-4">
                        <Form.Label>
                          Select Category <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="category_id"
                          value={formData.category_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                          required
                          className={getInvalidClass('category_id')}
                        >
                          <option value="">-- Select a category --</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id.toString()}>
                              {cat.category_name}
                            </option>
                          ))}
                        </Form.Select>
                        {touched.category_id && !formData.category_id && (
                          <div className="text-danger small mt-1">Please select a category.</div>
                        )}
                        <small className="text-muted">
                          Categories from{' '}
                          <code>letter.service_categories</code>.{' '}
                          <Link to="/services/categories">Manage categories &rarr;</Link>
                        </small>
                      </Form.Group>

                       {/* Assigned Barber – loaded from letter.users + employees where role_id = 2 */}
                       <Form.Group className="mb-3">
                         <Form.Label>Assigned Barber (Optional)</Form.Label>
                         <Form.Select
                           name="barber_id"
                           value={formData.barber_id}
                           onChange={handleInputChange}
                         >
                           <option value="">Unassigned (General Service)</option>
                           {barbers.map(barber => (
                             <option key={barber.id} value={String(barber.id)}>
                               {barber.username
                                 ? `${barber.username} — ${barber.full_name ?? ''}`.trim()
                                 : (barber.full_name ?? `Barber #${barber.id}`)}
                             </option>
                           ))}
                         </Form.Select>
                         {barbers.length === 0 && (
                           <small className="text-danger">
                             No barbers found. Users with role <strong>Barber</strong> (role_id=2) must exist in{' '}
                             <code>letter.users</code> linked to an <code>employees</code> record.
                           </small>
                         )}
                       </Form.Group>

                      {/* Description */}
                      <Form.Group className="mb-0">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe this service…"
                        />
                      </Form.Group>
                    </div>

                    {/* ── Pricing ── */}
                    <h6 className="text-uppercase text-primary fw-bold small mb-3" style={{ letterSpacing: '1px' }}>
                      Pricing &amp; Revenue
                    </h6>
                    <div className="bg-white p-3 border rounded shadow-sm mb-4">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Price (ETB) <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="number"
                              name="price"
                              value={formData.price}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              required
                              className={getInvalidClass('price')}
                            />
                            {touched.price && (!formData.price || parseFloat(String(formData.price)) <= 0) && (
                              <div className="text-danger small mt-1">A valid price is required.</div>
                            )}
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group className="mb-3">
                            <Form.Label>Discount Price <small className="text-muted">(Optional)</small></Form.Label>
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
                    </div>

                    {/* ── Timing & Availability ── */}
                    <h6 className="text-uppercase text-primary fw-bold small mb-3" style={{ letterSpacing: '1px' }}>
                      Timing &amp; Availability
                    </h6>
                    <div className="bg-white p-3 border rounded shadow-sm mb-4">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Duration (min) <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="number"
                              name="duration_minutes"
                              value={formData.duration_minutes}
                              onChange={handleNumberChange}
                              min="5"
                              required
                              className={getInvalidClass('duration_minutes')}
                            />
                            {touched.duration_minutes && parseInt(String(formData.duration_minutes), 10) < 5 && (
                              <div className="text-danger small mt-1">Duration must be at least 5 minutes.</div>
                            )}
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
                    </div>

                    {/* ── Advanced Settings ── */}
                    <h6 className="text-uppercase text-primary fw-bold small mb-3" style={{ letterSpacing: '1px' }}>
                      Advanced Settings
                    </h6>
                    <div className="bg-white p-3 border rounded shadow-sm">
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
                          <Form.Group className="mb-3 d-flex align-items-center h-100 pt-4">
                            <Form.Check
                              type="checkbox"
                              id="is_featured"
                              name="is_featured"
                              checked={formData.is_featured}
                              onChange={handleInputChange}
                              label={
                                <>
                                  <FaStar className="me-2 text-warning" /> Featured Service
                                </>
                              }
                            />
                          </Form.Group>
                        </div>
                        <div className="col-md-4">
                          <Form.Group className="mb-3 d-flex align-items-center h-100 pt-4">
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
                  </div>

                  {/* ══ Right column – Media ══ */}
                  <div className="col-md-4">
                    <h6 className="text-uppercase text-primary fw-bold small mb-3" style={{ letterSpacing: '1px' }}>
                      Service Media
                    </h6>

                    <Form.Group className="mb-3">
                      <Form.Label>Selected Category Image</Form.Label>
                      <div className="border rounded p-3 text-center">
                        {categoryImagePreview ? (
                          <img
                            src={categoryImagePreview}
                            alt="Selected category"
                            className="img-fluid rounded"
                            style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                            onError={e => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://via.placeholder.com/400x300?text=Category+Image';
                            }}
                          />
                        ) : (
                          <div className="py-4">
                            <FaImage className="fa-2x text-muted mb-2" />
                            <p className="text-muted small mb-0">No category image</p>
                          </div>
                        )}
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Service Image <small className="text-muted">(Optional)</small></Form.Label>
                      <div className="border rounded p-3 text-center">
                        {imagePreview ? (
                          <div className="position-relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="img-fluid rounded"
                              style={{ maxHeight: '200px' }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                              onClick={() => { setImagePreview(null); setImageFile(null); }}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <div className="py-4">
                            <FaImage className="fa-2x text-muted mb-2" />
                            <p className="text-muted small mb-0">Upload service image</p>
                          </div>
                        )}
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="mt-2"
                        />
                        <small className="text-muted d-block mt-1">Recommended: 400×300 px · JPEG / PNG</small>
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
                      <small className="text-muted">Optional: FontAwesome class or inline SVG markup</small>
                    </Form.Group>

                    <div className="alert alert-info small mb-0">
                      <strong>Note:</strong> Active services automatically appear on the customer booking page.
                    </div>
                  </div>

                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky action bar ── */}
      <div
        className="bg-light border-top py-3"
        style={{
          position: 'sticky', bottom: 0, zIndex: 1020,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        <div className="container">
          <div className="d-flex justify-content-center gap-3">
            <Button
              variant="light"
              type="button"
              onClick={handleReset}
              disabled={submitting || formSuccess}
            >
              <FaTimes className="me-2" /> Reset Form
            </Button>
            <Button
              type="submit"
              form="service-form"
              variant="primary"
              size="lg"
              disabled={submitting || formSuccess || categories.length === 0}
              style={{ minWidth: '260px' }}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Saving to Database...
                </>
              ) : formSuccess ? (
                <>
                  <FaCheckCircle className="me-2" /> Saved
                </>
              ) : (
                <>
                  <FaSave className="me-2" /> Submit Service to Database
                </>
              )}
            </Button>
          </div>
          {categories.length === 0 && (
            <p className="text-danger text-center mt-2 mb-0 small">
              Cannot submit — no service categories available.{' '}
              <Link to="/services/categories">Create a category first</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceSubmissionPage;
