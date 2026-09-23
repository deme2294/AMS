import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  serviceCategoryApi, 
  ServiceCategory 
} from '../../services/serviceService';
import { BACKEND_URL, fixImageUrl } from '../../services/apiService';
import Pagination from '../../components/Pagination';
import { Modal, Spinner, Form, Alert, Badge } from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaFolder, FaTimes,
  FaImage, FaArrowLeft, FaSpa, FaToggleOn, FaToggleOff, FaLayerGroup, FaPalette, FaSortNumericDown
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 8;

const PRESET_COLORS = [
  { name: 'Rose Pink', hex: '#ec4899' },
  { name: 'Amethyst Purple', hex: '#8b5cf6' },
  { name: 'Crimson Glow', hex: '#f43f5e' },
  { name: 'Fuchsia Glam', hex: '#d946ef' },
  { name: 'Ocean Cyan', hex: '#06b6d4' },
  { name: 'Golden Amber', hex: '#eab308' },
  { name: 'Royal Indigo', hex: '#3b82f6' },
  { name: 'Emerald Spa', hex: '#10b981' }
];

const PRESET_ICONS = [
  { label: 'Spa / Lotus', value: 'fa-solid fa-spa' },
  { label: 'Styling Scissors', value: 'fa-solid fa-scissors' },
  { label: 'Nails & Sparkle', value: 'fa-solid fa-hand-sparkles' },
  { label: 'Glamour Wand', value: 'fa-solid fa-wand-magic-sparkles' },
  { label: 'Bath / Hot Tub', value: 'fa-solid fa-hot-tub-person' },
  { label: 'Feather / Waxing', value: 'fa-solid fa-feather' },
  { label: 'Gentleman Crown', value: 'fa-solid fa-crown' },
  { label: 'Heart / Bridal', value: 'fa-solid fa-heart' }
];

const ServiceCategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    image: '',
    banner_image: '',
    color: '#ec4899',
    icon: 'fa-solid fa-spa',
    sort_order: 1,
    status: 'active' as 'active' | 'inactive',
  });

  // Image preview and file
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await serviceCategoryApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      });
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCategories();
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return categories.slice(start, start + ITEMS_PER_PAGE);
  }, [categories, currentPage]);

  const resetForm = () => {
    setFormData({
      category_name: '',
      description: '',
      image: '',
      banner_image: '',
      color: '#ec4899',
      icon: 'fa-solid fa-spa',
      sort_order: categories.length + 1,
      status: 'active',
    });
    setEditingCategory(null);
    setImagePreview(null);
    setImageFile(null);
    setFormError(null);
    setFormSuccess(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (category: ServiceCategory) => {
    resetForm();
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      description: category.description || '',
      image: category.category_image || '',
      banner_image: category.banner_image || '',
      color: category.color || '#ec4899',
      icon: category.icon || 'fa-solid fa-spa',
      sort_order: category.sort_order ?? 1,
      status: category.status,
    });
    if (category.category_image) {
      setImagePreview(fixImageUrl(category.category_image));
    } else {
      setImagePreview(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        category_name: formData.category_name,
        description: formData.description,
        status: formData.status,
        color: formData.color,
        icon: formData.icon,
        sort_order: Number(formData.sort_order) || 1,
        banner_image: formData.banner_image || undefined,
        category_image: formData.image || undefined,
      };
      
      if (imageFile) {
        payload.imageFile = imageFile;
      }

      if (editingCategory) {
        await serviceCategoryApi.update(editingCategory.id, payload);
        setFormSuccess(true);
        setTimeout(() => {
          closeModal();
          fetchCategories();
        }, 1200);
      } else {
        await serviceCategoryApi.create(payload);
        setFormSuccess(true);
        setTimeout(() => {
          closeModal();
          fetchCategories();
        }, 1200);
      }
    } catch (error: any) {
      setFormError(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: ServiceCategory) => {
    const newStatus = cat.status === 'active' ? 'inactive' : 'active';
    try {
      await serviceCategoryApi.update(cat.id, {
        category_name: cat.category_name,
        status: newStatus
      });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, status: newStatus } : c));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id: number, categoryName?: string) => {
    const nameStr = categoryName ? ` "${categoryName}"` : "";
    if (confirm(`Are you sure you want to delete category${nameStr}? All linked services may lose category assignment.`)) {
      try {
        await serviceCategoryApi.delete(id);
        fetchCategories();
      } catch (error: any) {
        alert(error.message || 'Failed to delete category');
      }
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 mb-2 rounded-lg"
            title="Go back to previous page"
          >
            <FaArrowLeft /> Back
          </button>
          <div className="d-flex align-items-center gap-2">
            <h2 className="h3 mb-0 font-bold text-slate-900 dark:text-white">Beauty Salon & Spa Categories</h2>
            <Badge bg="pink" className="bg-pink-500 text-white font-semibold">Live Salon</Badge>
          </div>
          <p className="text-muted mb-0 small">
            Configure, style, and publish hair, skincare, nail studio, spa, and bridal categories
          </p>
        </div>
        <button 
          className="btn text-white font-semibold px-4 py-2 rounded-xl shadow-sm d-flex align-items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}
          onClick={openCreateModal}
        >
          <FaPlus /> Add New Category
        </button>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <div className="position-relative">
            <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              className="form-control ps-5 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Search beauty categories by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Visibility (Active & Inactive)</option>
            <option value="active">Active & Published Publicly</option>
            <option value="inactive">Inactive / Hidden</option>
          </select>
        </div>
        <div className="col-md-4 text-md-end d-flex align-items-center justify-content-md-end gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {categories.length} Categories Configured
          </span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading salon categories...</p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && (
        <div className="row g-4 mb-4">
          <AnimatePresence>
            {paginatedCategories.map((cat) => (
              <motion.div
                key={cat.id}
                className="col-xl-3 col-lg-4 col-md-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  className="card border-0 shadow-sm rounded-2xl overflow-hidden h-100 position-relative transition-all hover:shadow-lg dark:bg-slate-800"
                  style={{ borderTop: `4px solid ${cat.color || '#ec4899'}` }}
                >
                  {/* Banner / Header Image */}
                  <div 
                    className="position-relative w-100" 
                    style={{ 
                      height: '140px',
                      background: cat.banner_image 
                        ? `url("${fixImageUrl(cat.banner_image)}") center/cover no-repeat`
                        : cat.category_image 
                          ? `url("${fixImageUrl(cat.category_image)}") center/cover no-repeat`
                          : `linear-gradient(135deg, ${cat.color || '#ec4899'}33 0%, ${cat.color || '#ec4899'}99 100%)`
                    }}
                  >
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Status Toggle Badge */}
                    <div className="position-absolute top-2 end-2">
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`btn btn-sm py-1 px-2.5 rounded-full font-semibold border-0 text-xs d-flex align-items-center gap-1 ${
                          cat.status === 'active' 
                            ? 'bg-emerald-500 text-white shadow-sm' 
                            : 'bg-slate-700/80 text-slate-200'
                        }`}
                        title="Click to toggle public visibility"
                      >
                        {cat.status === 'active' ? <><FaToggleOn /> Active</> : <><FaToggleOff /> Hidden</>}
                      </button>
                    </div>

                    {/* Order Pill */}
                    <div className="position-absolute top-2 start-2">
                      <span className="badge bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                        Order #{cat.sort_order ?? 0}
                      </span>
                    </div>

                    {/* Icon Accent */}
                    <div 
                      className="position-absolute bottom-2 start-3 p-2 rounded-xl text-white shadow-md d-flex align-items-center justify-content-center"
                      style={{ backgroundColor: cat.color || '#ec4899', width: '38px', height: '38px' }}
                    >
                      <FaSpa />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white mb-1.5 fs-6">
                        {cat.category_name}
                      </h5>
                      <p className="text-muted small mb-3 text-clamp-2" style={{ minHeight: '38px' }}>
                        {cat.description || 'Professional beauty, salon & personal styling category.'}
                      </p>
                    </div>

                    <div className="d-flex align-items-center justify-content-between pt-2 border-top border-slate-100 dark:border-slate-700 mt-2">
                      <div className="d-flex align-items-center gap-1.5">
                        <span 
                          className="d-inline-block rounded-circle" 
                          style={{ width: '12px', height: '12px', backgroundColor: cat.color || '#ec4899' }}
                        />
                        <span className="text-xs text-muted">Theme Accent</span>
                      </div>
                      <div className="d-flex gap-1.5">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-lg py-1 px-2.5"
                          onClick={() => openEditModal(cat)}
                          title="Edit Category Details"
                        >
                          <FaEdit className="me-1" /> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-lg py-1 px-2"
                          onClick={() => handleDelete(cat.id, cat.category_name)}
                          title="Delete Category"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {paginatedCategories.length === 0 && (
            <div className="col-12 text-center py-5">
              <div className="p-4 glass-card rounded-2xl max-w-md mx-auto">
                <FaSpa className="fs-1 text-pink-400 mb-2" />
                <h5 className="font-bold text-slate-800 dark:text-white">No categories found</h5>
                <p className="text-muted small">Try adjusting your search or add a new category.</p>
                <button className="btn btn-primary btn-sm rounded-xl" onClick={openCreateModal}>
                  <FaPlus className="me-1" /> Create Category
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalItems={categories.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Create / Edit Category Modal */}
      <Modal show={showModal} onHide={closeModal} centered size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header 
            closeButton 
            className="text-white"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}
          >
            <Modal.Title className="d-flex align-items-center gap-2 fs-5">
              <FaSpa /> {editingCategory ? 'Edit Salon Category' : 'Create New Salon Category'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {formError && <Alert variant="danger">{formError}</Alert>}
            {formSuccess && (
              <Alert variant="success">
                {editingCategory ? 'Category updated successfully!' : 'Category created successfully!'}
              </Alert>
            )}

            <div className="row g-3">
              <div className="col-md-7">
                <Form.Group className="mb-3">
                  <Form.Label className="font-semibold text-xs text-uppercase text-muted">Category Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="category_name"
                    value={formData.category_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Luxury Facials & Skincare"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="font-semibold text-xs text-uppercase text-muted">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe treatments, specialty techniques, or customer benefits..."
                  />
                </Form.Group>

                <div className="row g-2">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="font-semibold text-xs text-uppercase text-muted">Theme Color</Form.Label>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control
                          type="color"
                          name="color"
                          value={formData.color}
                          onChange={handleInputChange}
                          style={{ width: '45px', height: '38px', padding: '2px' }}
                        />
                        <span className="text-xs font-mono text-muted">{formData.color}</span>
                      </div>
                      <div className="d-flex gap-1 mt-1.5 flex-wrap">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            className="border-0 rounded-circle"
                            style={{ 
                              width: '18px', 
                              height: '18px', 
                              backgroundColor: c.hex,
                              boxShadow: formData.color === c.hex ? '0 0 0 2px #000' : 'none'
                            }}
                            title={c.name}
                            onClick={() => setFormData(prev => ({ ...prev, color: c.hex }))}
                          />
                        ))}
                      </div>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="font-semibold text-xs text-uppercase text-muted">Sort Order</Form.Label>
                      <Form.Control
                        type="number"
                        name="sort_order"
                        value={formData.sort_order}
                        onChange={handleInputChange}
                        min="1"
                      />
                    </Form.Group>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label className="font-semibold text-xs text-uppercase text-muted">Public Visibility</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active & Visible in Customer App</option>
                    <option value="inactive">Inactive / Draft Mode</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-5">
                {/* Background Banner URL */}
                <Form.Group className="mb-3">
                  <Form.Label className="font-semibold text-xs text-uppercase text-muted">Banner Image URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="banner_image"
                    value={formData.banner_image}
                    onChange={handleInputChange}
                    placeholder="https://images.unsplash.com/... or relative path"
                  />
                  <small className="text-muted d-block mt-1">Wide header banner for public showcase.</small>
                </Form.Group>

                {/* Thumbnail Image */}
                <Form.Group className="mb-3">
                  <Form.Label className="font-semibold text-xs text-uppercase text-muted">Category Thumbnail / Photo</Form.Label>
                  <div className="border rounded-xl p-2.5 text-center bg-slate-50 dark:bg-slate-800">
                    {imagePreview ? (
                      <div className="position-relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="img-fluid rounded-lg shadow-sm"
                          style={{ maxHeight: '110px', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-full p-1"
                          onClick={() => { setImagePreview(null); setImageFile(null); setFormData(p => ({ ...p, image: '' })); }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <div className="py-3">
                        <FaImage className="fs-3 text-muted mb-1" />
                        <p className="text-muted small mb-0">Select or drop category image</p>
                      </div>
                    )}
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2 form-control-sm"
                    />
                  </div>
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="bg-slate-50 dark:bg-slate-800">
            <button type="button" className="btn btn-secondary rounded-xl" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn text-white rounded-xl font-semibold px-4"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}
              disabled={submitting || formSuccess}
            >
              {submitting ? <><Spinner animation="border" size="sm" /> Saving...</> : 
               editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceCategoriesPage;
