import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import {
  FaStar,
  FaArrowLeft,
  FaSave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaSearch,
  FaShieldAlt,
  FaCut,
  FaChevronRight,
  FaCommentDots,
  FaHome
} from 'react-icons/fa';
import { useAuth } from '../../components/Auth/AuthContext';
import { publicServiceApi, Service } from '../../services/serviceService';
import ThemeToggle from '../../components/ThemeToggle';
import './RateServicePage.css';

/* ── Helper: Resolve User's Dedicated Dashboard Overview Route ─────────── */
export const getRolePrefix = (user: any): string => {
  if (!user) return 'customer';
  const roleId = Number(user.role_id);
  if (roleId === 1) return 'admin';
  if (roleId === 2) return 'barber';
  if (roleId === 3) return 'customer';
  if (roleId === 4) return 'manager';
  if (roleId === 5) return 'receptionist';

  const roleName = String(user.role_name || '').toLowerCase().trim();
  if (roleName.includes('admin')) return 'admin';
  if (roleName.includes('barber')) return 'barber';
  if (roleName.includes('customer')) return 'customer';
  if (roleName.includes('manager')) return 'manager';
  if (roleName.includes('receptionist')) return 'receptionist';

  return 'customer';
};

export const getUserDashboardOverview = (user: any): string => {
  return `/${getRolePrefix(user)}/dashboard/overview`;
};

/* ── Rating textual descriptor ─────────────────────────────────────────── */
const getRatingDescriptor = (rating: number): string => {
  switch (rating) {
    case 1:
      return '1.0 — Poor Experience';
    case 2:
      return '2.0 — Fair / Needs Improvement';
    case 3:
      return '3.0 — Good & Satisfactory';
    case 4:
      return '4.0 — Very Good Service';
    case 5:
      return '5.0 — Outstanding & Highly Recommended! ★★★★★';
    default:
      return 'Select your rating score above';
  }
};

/* ── Interactive Star Rating Input Component ───────────────────────────── */
const StarRatingInput: React.FC<{
  rating: number;
  hover: number | null;
  onRate: (value: number) => void;
  onHover: (value: number | null) => void;
}> = ({ rating, hover, onRate, onHover }) => {
  const activeRating = hover ?? rating;

  return (
    <div className="d-flex flex-column align-items-center">
      <div 
        className="rs-star-row" 
        onMouseLeave={() => onHover(null)}
        role="radiogroup"
        aria-label="Star rating options"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating;
          return (
            <button
              key={star}
              type="button"
              className="rs-star-btn"
              onClick={() => onRate(star)}
              onMouseEnter={() => onHover(star)}
              aria-label={`Rate ${star} out of 5 stars`}
              title={`${star} star${star > 1 ? 's' : ''}`}
            >
              <FaStar
                className={`rs-star-icon ${isFilled ? 'active' : 'inactive'}`}
              />
            </button>
          );
        })}
      </div>

      {/* Score Pill */}
      <div className="rs-rating-score-badge">
        <FaStar style={{ color: activeRating > 0 ? '#f59e0b' : '#94a3b8' }} />
        <span>{activeRating > 0 ? `${activeRating}.0` : '0.0'}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--rs-text-muted)', fontWeight: 500 }}>
          / 5.0
        </span>
      </div>

      {/* Dynamic Descriptor */}
      <div className={`rs-rating-descriptor ${activeRating > 0 ? 'gold' : 'empty'}`}>
        {getRatingDescriptor(activeRating)}
      </div>
    </div>
  );
};

/* ── Static star renderer for badges & summaries ───────────────────────── */
const renderStars = (rating: number): JSX.Element[] => {
  return Array.from({ length: 5 }, (_, i) => {
    const filled = rating >= i + 1;
    return (
      <FaStar
        key={i}
        style={{
          color: filled ? '#f59e0b' : 'var(--rs-star-inactive)',
          fontSize: '0.9rem',
          marginRight: '2px'
        }}
      />
    );
  });
};

const formatRating = (rating: number | null | undefined): string => {
  if (rating == null || isNaN(rating)) return '0.0';
  return rating.toFixed(1);
};

/* ═════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════════════════ */
const RateServicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Mode: rate specific service vs pick a service
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
  // Track whether user already has an existing rating (to show Edit vs New mode)
  const [hasExistingRating, setHasExistingRating] = useState(false);
  const [originalRating, setOriginalRating] = useState(0);
  const [successMessage, setSuccessMessage] = useState('Your rating has been submitted!');

  const rolePrefix = getRolePrefix(user);
  const overviewPath = getUserDashboardOverview(user);

  /* ── Auth gate ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: id ? `/rate-service/${id}` : '/rate-services' } });
    }
  }, [isAuthenticated, id, navigate]);

  /* ── Load services list (picker mode) ────────────────────────────────── */
  const loadServicesList = useCallback(async () => {
    try {
      setLoading(true);
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
      setLoading(true);
      const [svcRes, myRatingRes] = await Promise.allSettled([
        publicServiceApi.getById(sid),
        publicServiceApi.getMyRating(sid),
      ]);

      if (svcRes.status === 'fulfilled' && svcRes.value.success) {
        setService(svcRes.value.data);
      } else {
        setFormError('Service details could not be loaded.');
      }

      if (myRatingRes.status === 'fulfilled' && myRatingRes.value.success && myRatingRes.value.data) {
        const existing = myRatingRes.value.data;
        setSelectedRating(existing.rating);
        setOriginalRating(existing.rating);
        setReviewText(existing.review_text || '');
        setHasExistingRating(true);  // User has already rated → Edit Mode
      } else {
        setHasExistingRating(false); // No rating yet → New submission
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
  }, [isAuthenticated, serviceId, loadServiceDetail, loadServicesList]);

  /* ── Filter services as user searches in picker ──────────────────────── */
  useEffect(() => {
    if (services.length === 0) return;
    const q = searchTerm.toLowerCase();
    setFilteredServices(
      services.filter(
        (s) =>
          s.service_name.toLowerCase().includes(q) ||
          (s.category_name || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q)
      )
    );
  }, [searchTerm, services]);

  /* ── Submit rating (create or update) ───────────────────────────────── */
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRating) {
      setFormError('Please select a star rating between 1 and 5 before submitting.');
      return;
    }
    if (!service) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const res: any = await publicServiceApi.submitRating(service.id, selectedRating, reviewText);
      const wasUpdate = res?.isUpdate === true || (hasExistingRating && originalRating > 0);
      setSuccessMessage(
        wasUpdate
          ? 'Your rating has been updated successfully!'
          : 'Thank you! Your rating has been submitted.'
      );
      setFormSuccess(true);
      setSubmitting(false);
      const targetOverview = getUserDashboardOverview(user);
      setTimeout(() => {
        navigate(targetOverview);
      }, 1800);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit rating. Please try again.');
      setSubmitting(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
     LOADING STATE
     ═══════════════════════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="rs-page-container">
        <header className="rs-navbar">
          <div className="rs-navbar-inner">
            <button className="rs-back-link" onClick={() => navigate(overviewPath)}>
              <FaArrowLeft /> Return to Dashboard
            </button>
            <ThemeToggle variant="segmented" showLabels={false} />
          </div>
        </header>
        <div className="rs-loading-box">
          <Spinner animation="border" variant="warning" style={{ width: '3rem', height: '3rem' }} />
          <p className="fw-semibold">Loading service details...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SERVICE PICKER MODE (/rate-services)
     ═══════════════════════════════════════════════════════════════════════ */
  if (!serviceId || isNaN(serviceId)) {
    return (
      <div className="rs-page-container">
        {/* Navigation Bar with White/Dark Theme Toggle */}
        <header className="rs-navbar">
          <div className="rs-navbar-inner">
            <button className="rs-back-link" onClick={() => navigate(overviewPath)}>
              <FaArrowLeft /> Back to Dashboard
            </button>
            <ThemeToggle variant="segmented" showLabels={false} />
          </div>
        </header>

        <main className="rs-content-wrapper">
          {/* Header Banner */}
          <div className="rs-header-banner">
            <div className="rs-title-area">
              <h1>
                <FaStar style={{ color: '#f59e0b' }} /> Rate a Barber Service
              </h1>
              <p>Select any service you have experienced to leave an authentic rating & review.</p>
            </div>
          </div>

          {/* Search Box */}
          <div className="rs-search-container">
            <FaSearch className="rs-search-icon" />
            <input
              type="text"
              className="rs-search-input"
              placeholder="Search services by name, category, or treatment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Services Grid */}
          <div className="rs-picker-grid">
            {filteredServices.map((svc) => (
              <div
                key={svc.id}
                className="rs-picker-card"
                onClick={() => navigate(`/${rolePrefix}/rate-service/${svc.id}`)}
              >
                <div className="rs-picker-rating-row">
                  {svc.avg_rating != null && svc.avg_rating > 0 ? (
                    <>
                      <div className="d-flex align-items-center">
                        {renderStars(svc.avg_rating)}
                      </div>
                      <span className="fw-bold" style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                        {formatRating(svc.avg_rating)}
                      </span>
                      <span style={{ color: 'var(--rs-text-muted)', fontSize: '0.78rem' }}>
                        ({svc.total_ratings || 0})
                      </span>
                    </>
                  ) : (
                    <span className="rs-badge rs-badge-gold">New Service</span>
                  )}
                </div>

                <h3 className="rs-picker-title">{svc.service_name}</h3>
                <span className="rs-picker-cat">{svc.category_name || 'Grooming & Styling'}</span>

                <div className="rs-picker-footer">
                  <span className="fw-bold" style={{ color: 'var(--rs-badge-price-text)', fontSize: '1.05rem' }}>
                    {svc.price.toFixed(2)} ETB
                  </span>
                  <button type="button" className="rs-picker-rate-btn">
                    Rate Now <FaChevronRight style={{ fontSize: '0.75rem' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-5" style={{ color: 'var(--rs-text-muted)' }}>
              <h5>No services match your search query.</h5>
              <p className="small">Try clearing the search box to browse all services.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SERVICE NOT FOUND FALLBACK
     ═══════════════════════════════════════════════════════════════════════ */
  if (!service) {
    return (
      <div className="rs-page-container">
        <header className="rs-navbar">
          <div className="rs-navbar-inner">
            <button className="rs-back-link" onClick={() => navigate(overviewPath)}>
              <FaArrowLeft /> Return to Dashboard
            </button>
            <ThemeToggle variant="segmented" showLabels={false} />
          </div>
        </header>
        <div className="rs-loading-box">
          <FaExclamationTriangle style={{ fontSize: '3rem', color: '#ef4444' }} />
          <h4 className="fw-bold mt-2">Service Not Found</h4>
          <p style={{ color: 'var(--rs-text-muted)' }}>{formError || 'The requested service does not exist.'}</p>
          <button className="rs-btn-back mt-2" onClick={() => navigate(`/${rolePrefix}/rate-services`)}>
            Explore Services
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RATING MODE (/rate-service/:id)
     ═══════════════════════════════════════════════════════════════════════ */
  const serviceImageUrl = service.service_image
    ? service.service_image.startsWith('http')
      ? service.service_image
      : `http://localhost:5005/${service.service_image}`
    : null;

  return (
    <div className="rs-page-container">
      {/* Toast Notifications */}
      {formSuccess && (
        <div className="rs-toast-banner">
          <div className="rs-alert-success">
            <FaCheckCircle style={{ fontSize: '1.25rem', flexShrink: 0 }} />
            <div>
              <strong>{hasExistingRating ? 'Rating Updated!' : 'Rating Submitted!'}</strong>
              <div className="small">{successMessage} Redirecting to your dashboard...</div>
            </div>
          </div>
        </div>
      )}

      {formError && !formSuccess && (
        <div className="rs-toast-banner">
          <div className="rs-alert-danger">
            <FaExclamationTriangle style={{ fontSize: '1.25rem', flexShrink: 0 }} />
            <div>
              <strong>Submission Notice</strong>
              <div className="small">{formError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar with Theme Toggle (Supports White and Dark) */}
      <header className="rs-navbar">
        <div className="rs-navbar-inner">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="rs-back-link"
              onClick={() => navigate(overviewPath)}
              title="Return to your Dashboard Overview"
            >
              <FaArrowLeft /> Dashboard
            </button>
            <span style={{ color: 'var(--rs-text-dim)', opacity: 0.5 }}>|</span>
            <button
              type="button"
              className="rs-back-link"
              onClick={() => navigate(`/${rolePrefix}/rate-services`)}
            >
              All Services
            </button>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Theme Toggle Component (Light / System / Dark) */}
            <ThemeToggle variant="segmented" showLabels={false} />
          </div>
        </div>
      </header>

      {/* Main Rating View */}
      <main className="rs-content-wrapper">
        <div className="rs-header-banner">
          <div className="rs-title-area">
            <h1>
              <FaStar style={{ color: '#f59e0b' }} />
              {hasExistingRating ? 'Update Your Service Rating' : 'Rate Your Experience'}
            </h1>
            <p>
              {hasExistingRating
                ? <><strong>You have already rated this service.</strong> You can update your score and review below.</>  
                : <>Your verified review helps maintain premium salon quality for <strong>{service.service_name}</strong></>}
            </p>
          </div>
        </div>

        <div className="row g-4">
          {/* Left Column: Interactive Rating & Review Form */}
          <div className="col-lg-7">
            <div className="rs-card">
              <div className="rs-card-header">
                <h2 className="rs-card-title">
                  <FaStar style={{ color: '#f59e0b' }} />
                  {hasExistingRating ? 'Edit Your Rating' : 'Service Evaluation'}
                </h2>
                <span className={`rs-badge ${hasExistingRating ? 'rs-badge-cat' : 'rs-badge-gold'}`}>
                  {hasExistingRating ? 'Edit Mode' : (selectedRating > 0 ? 'Rating Selected' : 'Required')}
                </span>
              </div>

              <div className="rs-card-body">
                {/* Edit Mode Banner: shown when user already has a rating */}
                {hasExistingRating && (
                  <div className="rs-notice-edit-mode">
                    <FaCheckCircle className="rs-notice-icon" />
                    <div>
                      <strong>You've already rated this service.</strong>
                      <div className="small mt-1">
                        Your previous rating was{' '}
                        <span className="rs-previous-stars">
                          {[1,2,3,4,5].map(s => (
                            <FaStar key={s} style={{ color: s <= originalRating ? '#f59e0b' : 'var(--rs-star-inactive)', fontSize: '1rem' }} />
                          ))}
                        </span>
                        {' '}({originalRating}.0 / 5.0). Update it below if you'd like to change your experience score.
                      </div>
                    </div>
                  </div>
                )}

                <form id="rate-service-form" onSubmit={handleSubmitRating} noValidate>
                  {/* Star Rating Interactive Panel */}
                  <div className="rs-star-box">
                    <div className="rs-star-prompt">Click or Tap a Star to Rate</div>
                    <StarRatingInput
                      rating={selectedRating}
                      hover={hoverRating}
                      onRate={setSelectedRating}
                      onHover={setHoverRating}
                    />
                  </div>

                  {/* Review Textarea */}
                  <div className="rs-form-group">
                    <div className="rs-label">
                      <label htmlFor="review-textarea" className="m-0">
                        <FaCommentDots className="me-1" style={{ color: '#f59e0b' }} /> Detailed Feedback
                      </label>
                      <span className="rs-label-optional">Optional review</span>
                    </div>
                    <textarea
                      id="review-textarea"
                      className="rs-textarea"
                      placeholder="Share highlights of your treatment, stylist technique, ambiance, or cleanliness..."
                      rows={5}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      maxLength={1000}
                    />
                    <div className="d-flex justify-content-between mt-1">
                      <span className="small text-muted">Max 1000 characters</span>
                      <span className="small text-muted">{reviewText.length}/1000</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="rs-btn-group">
                    <button
                      type="button"
                      className="rs-btn-back"
                      onClick={() => navigate(overviewPath)}
                      disabled={submitting}
                    >
                      <FaHome className="me-1" /> Return to Dashboard
                    </button>

                    <button
                      type="submit"
                      className="rs-btn-submit"
                      disabled={submitting || formSuccess || selectedRating === 0}
                    >
                      {submitting ? (
                        <>
                          <Spinner animation="border" size="sm" />
                          <span>{hasExistingRating ? 'Updating...' : 'Submitting...'}</span>
                        </>
                      ) : formSuccess ? (
                        <>
                          <FaCheckCircle />
                          <span>{hasExistingRating ? 'Updated!' : 'Submitted!'}</span>
                        </>
                      ) : (
                        <>
                          <FaSave />
                          <span>
                            {selectedRating === 0
                              ? 'Select a Rating First'
                              : hasExistingRating
                              ? 'Update My Rating'
                              : 'Submit Rating & Review'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Service Summary Showcase Card */}
          <div className="col-lg-5">
            <div className="rs-card rs-sidebar-card">
              <div className="rs-card-header">
                <h2 className="rs-card-title">
                  <FaCut style={{ color: '#6366f1' }} /> Service Overview
                </h2>
                <span className="rs-badge rs-badge-cat">
                  {service.category_name || 'Service # ' + service.id}
                </span>
              </div>

              <div className="rs-card-body">
                {/* Media Image Showcase */}
                {serviceImageUrl ? (
                  <div className="rs-service-preview-media">
                    <img
                      src={serviceImageUrl}
                      alt={service.service_name}
                      className="rs-service-img"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="rs-service-preview-media d-flex align-items-center justify-content-center"
                    style={{ background: 'var(--rs-star-box-bg)' }}
                  >
                    <FaCut style={{ fontSize: '3rem', color: 'var(--rs-text-dim)' }} />
                  </div>
                )}

                <h3 className="fw-bold mb-1" style={{ color: 'var(--rs-text-primary)', fontSize: '1.2rem' }}>
                  {service.service_name}
                </h3>
                <p className="text-muted small mb-3">
                  {service.category_name ? `${service.category_name} Specialist Treatment` : 'Luxury Grooming'}
                </p>

                {/* Pricing & Duration Details */}
                <div className="rs-service-info-row">
                  <span className="rs-info-label">Investment Price</span>
                  <span className="rs-badge rs-badge-price">
                    {service.price.toFixed(2)} ETB
                  </span>
                </div>

                <div className="rs-service-info-row">
                  <span className="rs-info-label">Session Duration</span>
                  <span className="rs-info-val d-flex align-items-center gap-1">
                    <FaClock style={{ color: '#64748b' }} />
                    {service.duration_minutes} Minutes
                  </span>
                </div>

                <div className="rs-service-info-row">
                  <span className="rs-info-label">Community Rating</span>
                  <span className="rs-info-val d-flex align-items-center gap-1">
                    <FaStar style={{ color: '#f59e0b' }} />
                    {formatRating(service.avg_rating)} / 5.0
                    <span className="text-muted fw-normal small">
                      ({service.total_ratings || 0} reviews)
                    </span>
                  </span>
                </div>

                {/* Service Description */}
                {service.description && (
                  <div className="rs-description-quote">
                    "{service.description}"
                  </div>
                )}

                {/* Trust Guarantee Box */}
                <div className="rs-guarantee-box">
                  <FaShieldAlt style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Quality Assurance Guarantee</strong>
                    <div>
                      Ratings are reviewed by management to uphold elite service excellence across our salon.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RateServicePage;
