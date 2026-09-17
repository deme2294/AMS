import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Spinner } from 'react-bootstrap';
import { FaEdit, FaPlus, FaStar, FaTimes, FaCut, FaImage } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { serviceApi, serviceCategoryApi, bookingApi, Service, ServiceCategory, ServiceFilters } from '../../services/serviceService';
import { BACKEND_URL } from '../../services/apiService';
import { Badge } from 'react-bootstrap';

const EditServicePage: React.FC = () => {
  const { t } = useTranslation();
  const { serviceId } = useParams();
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
    description: '',
    price: '',
    discount_price: '',
    duration_minutes: 30,
    service_image: '',
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

  const getServiceTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      standard: 'bg-blue',
      combo: 'bg-purple',
      home_service: 'bg-green',
      vip: 'bg-gold',
    };
    return <Badge bg={colors[type] || 'secondary'}>{type.replace('_', ' ')}</Badge>;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setFormError(null);

        const id = Number(serviceId);
        if (!id) throw new Error('Invalid service id');

        const [svcResp, catResp, barResp] = await Promise.all([
          serviceApi.getById(id),
          serviceCategoryApi.getAll({ status: 'active' }),
          bookingApi.getBarbers(),
        ]);

        if (!svcResp.success) throw new Error('Failed to load service');
        if (catResp.success) setCategories(catResp.data);
        if (barResp.success) setBarbers(barResp.data);

        setService(svcResp.data);
        setFormData({
          category_id: String(svcResp.data.category_id),
          barber_id: svcResp.data.barber_id?.toString() || '',
          service_name: svcResp.data.service_name,
          description: svcResp.data.description || '',
          price: svcResp.data.price.toString(),
          discount_price: svcResp.data.discount_price?.toString() || '',
          duration_minutes: svcResp.data.duration_minutes,
          service_image: svcResp.data.service_image || '',
          service_icon: svcResp.data.service_icon || '',
          is_featured: svcResp.data.is_featured,
          is_available: svcResp.data.is_available,
          max_customers_per_slot: svcResp.data.max_customers_per_slot,
          preparation_time: svcResp.data.preparation_time || 0,
          cleanup_time: svcResp.data.cleanup_time || 0,
          booking_buffer_time: svcResp.data.booking_buffer_time || 0,
          service_type: svcResp.data.service_type,
          status: svcResp.data.status,
        });

        if (svcResp.data.service_image) {
          setImagePreview(
            svcResp.data.service_image.startsWith('http')
              ? svcResp.data.service_image
              : `${BACKEND_URL}${svcResp.data.service_image}`
          );
        } else {
          setImagePreview(null);
        }
      } catch (e: any) {
        setFormError(e?.message || 'Failed to load edit service page');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [serviceId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
    if (!file) {
      setImageFile(null);
      return;
    }
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    setSaving(true);
    setFormError(null);

    try {
      const payload: any = {
        category_id: parseInt(formData.category_id),
        barber_id: formData.barber_id ? parseInt(formData.barber_id) : null,
        service_name: formData.service_name,
        description: formData.description,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        duration_minutes: parseInt(String(formData.duration_minutes)),
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

      if (imageFile) payload.imageFile = imageFile;

      const resp = await serviceApi.update(service.id, payload);
      if (!resp.success) throw new Error(resp.message || 'Failed to update service');

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/services');
      }, 1200);
    } catch (e: any) {
      setFormError(e?.message || 'Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <div className="d-flex justify-content-between align-items-center mb-4 gap-2">
      <div>
        <h2 className="h3 mb-0">Edit Service</h2>
        <p className="text-muted mb-0">
          Update details, media, and availability.
        </p>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary" onClick={() => navigate('/services')} type="button">
          <FaTimes className="me-1" /> Back
        </button>
        <div className="d-flex align-items-center gap-2">
          {service?.service_type ? getServiceTypeBadge(service.service_type) : null}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {header}

      {formError && <div className="alert alert-danger">{formError}</div>}
      {formSuccess && (
        <div className="alert alert-success">
          <strong>Success!</strong> Service updated successfully.
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-8">
                <h6 className="fw-bold mb-3">
                  <FaCut className="me-2 text-primary" /> Basic Information
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
                  <Form.Select name="barber_id" value={formData.barber_id} onChange={handleInputChange}>
                    <option value="">Unassigned (General Service)</option>
                    {barbers.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.full_name}
                      </option>
                    ))}
                  </Form.Select>
                  <small className="text-muted">Specific barber can be assigned (optional)</small>
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
                      <Form.Select name="service_type" value={formData.service_type} onChange={handleInputChange}>
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
                      <Form.Select name="status" value={formData.status} onChange={handleInputChange}>
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
                            <FaStar className="me-2 text-warning" /> Featured Service
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
                          style={{ maxHeight: '200px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                          }}
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
                    <Form.Control type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
                    <small className="text-muted d-block mt-1">Recommended: 400x300px</small>
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
                  <small className="text-muted">Optional: FontAwesome class or SVG markup</small>
                </Form.Group>

                <div className="alert alert-info small">
                  <strong>Note:</strong> Active services will automatically appear on the customer booking page.
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => navigate('/services')}>
                    <FaTimes className="me-1" /> Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1" disabled={saving || formSuccess}>
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" /> Saving...
                      </>
                    ) : (
                      <>
                        <FaEdit className="me-2" /> Update Service
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Form>
        </div>
      </div>

      {/* Scrollbar CSS for this page's card */}
      <style>{`
        .card-body::-webkit-scrollbar { width: 10px; }
        .card-body::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 5px; }
        .card-body::-webkit-scrollbar-thumb { background: #0d6efd; border-radius: 5px; }
        .card-body::-webkit-scrollbar-thumb:hover { background: #0b5ed7; }
      `}</style>
    </div>
  );
};

export default EditServicePage;

