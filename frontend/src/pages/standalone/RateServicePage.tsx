import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { FaStar, FaArrowLeft, FaSave, FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../components/Auth/AuthContext';
import { publicServiceApi, Service } from '../../services/serviceService';

/* ── Reusable star input ─────────────────────────────────────────────────── */
const StarRatingInput: React.FC<{
  rating: number;
  hover: number | null;
  onRate: (value: number) => void;
  onHover: (value: number | null) => void;
}> = ({ rating, hover, onRate, onHover }) => {
  return (
    <div className="d-inline-flex gap-1" onMouseLeave={() => onHover(null)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover ?? rating);
        return (
          <FaStar
            key={star}
            onClick={() => onRate(star)}
            onMouseEnter={() => onHover(star)}
            className={`fs-3 transition-all ${filled ? 'text-yellow-400' : 'text-slate-600'}`}
            style={{ cursor: 'pointer' }}
          />
        );
      })}
    </div>
  );
};

/* ── Page data shape ─────────────────────────────────────────────────────── */
type RatingEntry = {
  id: number;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_name: string | null;
  full_name: string | null;
};

/* ── Helper: render star visuals from a decimal rating ───────────────────── */
const renderStars = (rating: number): JSX.Element[] => {
  return Array.from({ length: 5 }, (_, i) => {
    const filled = rating >= i + 1;
    return (
      <FaStar
        key={i}
        className={filled ? 'text-yellow-400' : 'text-slate-600'}
      />
    );
  });
};

const formatRating = (rating: number | null | undefined): string => {
  if (rating == null || isNaN(rating)) return '0.0';
  return rating.toFixed(1);
};

/* ── Component ───────────────────────────────────────────────────────────── */
const RateServicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // When id != null we're rating a specific service; otherwise we show the picker
  const serviceId = id ? Number(id) : null;

  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  /* ── Auth gate ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: id ? `/rate-service/${id}` : '/rate-services' } });
      return;
    }
  }, [isAuthenticated, id]);

  /* ── Load services list (picker mode) ────────────────────────────────── */
  const loadServicesList = useCallback(async () => {
    try {
      const res = await publicServiceApi.getAll();
      if (res.success) {
        setServices(res.data);
        setFilteredServices(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Load single service + existing rating (rating mode) ─────────────── */
  const loadServiceDetail = useCallback(async (sid: number) => {
    try {
      const [svcRes, myRatingRes] = await Promise.allSettled([
        publicServiceApi.getById(sid),
        publicServiceApi.getMyRating(sid),
      ]);

      if (svcRes.status === 'fulfilled' && svcRes.value.success) {
        setService(svcRes.value.data);
      } else {
        setFormError('Service not found or unavailable.');
      }

      if (myRatingRes.status === 'fulfilled' && myRatingRes.value.success && myRatingRes.value.data) {
        setSelectedRating(myRatingRes.value.data.rating);
        setReviewText(myRatingRes.value.data.review_text || '');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Fetch on mount based on mode ────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) return;
    if (serviceId && !isNaN(serviceId)) {
      loadServiceDetail(serviceId);
    } else {
      loadServicesList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  /* ── Filter services as user types in picker ─────────────────────────── */
  useEffect(() => {
    if (services.length === 0) return;
    const q = searchTerm.toLowerCase();
    setFilteredServices(
      services.filter(
        (s) =>
          s.service_name.toLowerCase().includes(q) ||
          (s.category_name || '').toLowerCase().includes(q)
      )
    );
  }, [searchTerm, services]);

  /* ── Submit rating ───────────────────────────────────────────────────── */
  const handleRateApi = async (sid: number, rating: number, review: string): Promise<boolean> => {
    try {
      await publicServiceApi.submitRating(sid, rating, review);
      return true;
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit rating.');
      return false;
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRating) {
      setFormError('Please select a star rating before submitting.');
      return;
    }
    if (!service) return;
    setSubmitting(true);
    setFormError(null);
    const ok = await handleRateApi(service.id, selectedRating, reviewText);
    if (ok) {
      setFormSuccess(true);
      setSubmitting(false);
      setTimeout(() => navigate('/'), 2000);
    } else {
      setSubmitting(false);
    }
  };

  const handlePickService = (sid: number) => {
    navigate(`/rate-service/${sid}`);
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  LOADING STATE                                                          */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  SERVICE PICKER MODE  (nav bar link → /rate-services)                   */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (!serviceId || isNaN(serviceId)) {
    return (
      <div className="min-h-screen bg-light" style={{ minHeight: '100vh' }}>
        {formSuccess && (
          <div className="position-fixed top-0 start-0 w-100" style={{ zIndex: 1060 }}>
            <div className="container py-3">
              <Alert variant="success" className="mb-0 text-center shadow">
                <FaCheckCircle className="me-2" /> Rating submitted!
              </Alert>
            </div>
          </div>
        )}

        {formError && !formSuccess && (
          <div className="position-fixed top-0 start-0 w-100" style={{ zIndex: 1060 }}>
            <div className="container py-3">
              <Alert variant="danger" className="mb-0 text-center shadow">
                <FaExclamationTriangle className="me-2" /> {formError}
              </Alert>
            </div>
          </div>
        )}

        <div className="container py-5">
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <Button variant="outline-secondary" onClick={() => navigate('/')}>
              <FaArrowLeft className="me-2" /> Back
            </Button>
            <div>
              <h4 className="mb-0 fw-bold"><FaStar className="text-warning me-2" /> Rate a Service</h4>
              <p className="text-muted mb-0">Select a service to rate</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 position-relative">
            <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Search services to rate…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Service Cards */}
          <div className="row g-3">
            {filteredServices.map((svc) => (
              <div className="col-md-6 col-lg-4" key={svc.id}>
                <Card
                  className="h-100 shadow-sm cursor-pointer border border-slate-200"
                  onClick={() => handlePickService(svc.id)}
                  style={{ transition: 'box-shadow 0.2s, border-color 0.2s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                    e.currentTarget.style.borderColor = '#facc15';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.borderColor = '';
                  }}
                >
                  <Card.Body className="d-flex flex-column align-items-start">
                    {/* Rating row */}
                    <div className="d-flex align-items-center gap-2 mb-2">
                      {svc.avg_rating != null && svc.avg_rating > 0 ? (
                        <>
                          <div className="d-flex gap-0.5">{renderStars(svc.avg_rating)}</div>
                          <small className="text-yellow-400 fw-bold">{formatRating(svc.avg_rating)}</small>
                          <small className="text-muted">({svc.total_ratings || 0})</small>
                        </>
                      ) : (
                        <small className="text-muted">No ratings yet</small>
                      )}
                    </div>
                    {/* Name + category */}
                    <h6 className="fw-bold mb-1">{svc.service_name}</h6>
                    <small className="text-muted">{svc.category_name || 'General'}</small>
                    {/* Price */}
                    <div className="mt-auto pt-2">
                      <span className="fw-bold text-success">{svc.price.toFixed(2)} ETB</span>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
            {filteredServices.length === 0 && (
              <div className="col-12 text-center py-8 text-muted">No services found.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RATING MODE  (/rate-service/:id)                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (!service) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center flex-column gap-3">
        <FaExclamationTriangle className="text-danger" style={{ fontSize: '3rem' }} />
        <p className="text-muted">{formError || 'Service not found.'}</p>
        <Button variant="primary" onClick={() => navigate('/rate-services')}>Choose a Service</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light" style={{ minHeight: '100vh' }}>
      {/* Success toast */}
      {formSuccess && (
        <div className="position-fixed top-0 start-0 w-100" style={{ zIndex: 1060 }}>
          <div className="container py-3">
            <Alert variant="success" className="mb-0 text-center shadow">
              <FaCheckCircle className="me-2" /> Thank you! Your rating has been submitted.
            </Alert>
          </div>
        </div>
      )}

      {/* Error toast */}
      {formError && !formSuccess && (
        <div className="position-fixed top-0 start-0 w-100" style={{ zIndex: 1060 }}>
          <div className="container py-3">
            <Alert variant="danger" className="mb-0 text-center shadow">
              <FaExclamationTriangle className="me-2" /> {formError}
            </Alert>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="bg-white border-bottom py-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button
                variant="link"
                className="text-muted p-0 mb-1"
                onClick={() => navigate('/rate-services')}
              >
                <FaArrowLeft className="me-1" /> All Services
              </Button>
              <h4 className="mb-0 fw-bold">
                <FaStar className="text-warning me-2" />
                {selectedRating > 0 ? 'Edit Your Rating' : 'Rate Service'}
              </h4>
              <p className="text-muted mb-0">
                Share your experience — <strong>{service.service_name}</strong>
              </p>
            </div>
            {service.service_image && (
              <img
                src={service.service_image.startsWith('http') ? service.service_image : `http://localhost:5005/${service.service_image}`}
                alt={service.service_name}
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="container py-5" style={{ maxWidth: '700px' }}>
        <div className="row g-4">
          {/* ── Rating Form ── */}
          <div className="col-md-7">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h6 className="fw-bold mb-4">
                  <FaStar className="me-2 text-warning" /> Your Stars
                </h6>
                <Form id="rating-form" onSubmit={handleSubmitRating} noValidate>
                  <div
                    className="text-center py-4 rounded d-flex flex-column align-items-center"
                    style={{ background: '#f8f9fa' }}
                  >
                    <p className="text-muted mb-3 small" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Tap to rate
                    </p>
                    <StarRatingInput
                      rating={selectedRating}
                      hover={hoverRating}
                      onRate={setSelectedRating}
                      onHover={setHoverRating}
                    />
                    <p
                      className="mt-3 mb-0"
                      style={{ fontSize: '1.5rem', fontWeight: 700, color: selectedRating > 0 ? '#facc15' : '#94a3b8' }}
                    >
                      {selectedRating > 0 ? `${selectedRating}.0 / 5.0` : '- / 5.0'}
                    </p>
                  </div>

                  <Form.Group className="mt-4">
                    <Form.Label>
                      Your Review <small className="text-muted">(optional)</small>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Share your experience with this service…"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />
                  </Form.Group>
                </Form>
              </div>

              <div className="bg-light border-top d-flex justify-content-between px-4 py-3 flex-wrap gap-2">
                <Button variant="outline-secondary" onClick={() => navigate('/rate-services')} disabled={submitting}>
                  <FaArrowLeft className="me-2" /> Cancel
                </Button>
                <Button
                  variant="warning"
                  type="submit"
                  form="rating-form"
                  disabled={submitting || formSuccess || selectedRating === 0}
                  style={{ minWidth: '180px' }}
                >
                  {submitting ? (
                    <><Spinner animation="border" size="sm" className="me-2" /> Submitting…</>
                  ) : formSuccess ? (
                    <><FaCheckCircle className="me-2" /> Submitted</>
                  ) : (
                    <><FaSave className="me-2" /> Submit Rating</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ── Service Summary ── */}
          <div className="col-md-5">
            <div className="card shadow-sm" style={{ position: 'sticky', top: '1rem' }}>
              <div className="card-body">
                <h6 className="fw-bold mb-3">
                  <FaCalendarAlt className="text-primary me-2" /> Service Details
                </h6>
                <p className="fw-bold mb-1">{service.service_name}</p>
                {service.category_name && (
                  <small className="text-muted">{service.category_name}</small>
                )}
                <div className="mt-3">
                  <span className="fw-bold text-success">{service.price.toFixed(2)} ETB</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-500 small">Duration: {service.duration_minutes} min</span>
                </div>
                {service.description && (
                  <p
                    className="mt-3 text-muted small"
                    style={{ borderTop: '1px solid #e9ecef', paddingTop: '1rem' }}
                  >
                    {service.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateServicePage;
