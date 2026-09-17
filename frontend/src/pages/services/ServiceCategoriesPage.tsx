import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  serviceCategoryApi, 
  ServiceCategory, 
  Service 
} from '../../services/serviceService';
import { BACKEND_URL } from '../../services/apiService';
import Pagination from '../../components/Pagination';
import { Modal, Spinner, Form, Alert } from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaFolder, FaTimes,
  FaEye, FaEyeSlash, FaImage, FaLongArrowAltRight
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 10;

const ServiceCategoriesPage: React.FC = () => {
  const { t } = useTranslation();
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
      status: category.status,
    });
    if (category.category_image) {
      setImagePreview(category.category_image.startsWith('http') ? category.category_image : `${BACKEND_URL}${category.category_image}`);
    } else {
      setImagePreview(null);
    }
    // Do NOT set imageFile - we'll only set if user selects a new file
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file); // Store file for upload
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
      // Build FormData for potential image upload
      const payload: any = {
        category_name: formData.category_name,
        description: formData.description,
        status: formData.status,
      };
      
      // Include image file if selected
      if (imageFile) {
        payload.imageFile = imageFile;
      }

      if (editingCategory) {
        await serviceCategoryApi.update(editingCategory.id, payload);
        setFormSuccess(true);
        setTimeout(() => {
          closeModal();
          fetchCategories();
        }, 1500);
      } else {
        await serviceCategoryApi.create(payload);
        setFormSuccess(true);
        setTimeout(() => {
          closeModal();
          fetchCategories();
        }, 1500);
      }
    } catch (error: any) {
      setFormError(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('common.confirm_delete') || 'Are you sure you want to delete this category?')) {
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-0">Service Categories</h2>
          <p className="text-muted mb-0">Manage service categories for your barbershop</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <FaPlus className="me-2" /> Add Category
        </button>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="position-relative">
            <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading categories...</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '80px' }}>Image</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginatedCategories.map((category) => (
                      <motion.tr
                        key={category.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td>
                          {category.category_image ? (
                            <img
                              src={category.category_image.startsWith('http') ? category.category_image : `${BACKEND_URL}${category.category_image}`}
                              alt={category.category_name}
                              className="rounded"
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/50?text=No+Img'; }}
                            />
                          ) : (
                            <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                              <FaFolder className="text-muted" />
                            </div>
                          )}
                        </td>
                        <td>
                          <strong>{category.category_name}</strong>
                        </td>
                        <td>
                          <span className="text-muted">
                            {category.description ? category.description.substring(0, 60) + '...' : '-'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${category.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                            {category.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openEditModal(category)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(category.id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {paginatedCategories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        No categories found. Click "Add Category" to create one.
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
            totalItems={categories.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={closeModal} centered size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            {formSuccess && (
              <Alert variant="success">
                {editingCategory ? 'Category updated successfully!' : 'Category created successfully!'}
              </Alert>
            )}

            <div className="row g-3">
              <div className="col-md-8">
                <Form.Group className="mb-3">
                  <Form.Label>Category Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="category_name"
                    value={formData.category_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Haircut, Beard, Premium"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of this category..."
                  />
                </Form.Group>

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
                <Form.Group className="mb-3">
                  <Form.Label>Category Image</Form.Label>
                  <div className="border rounded p-3 text-center">
                    {imagePreview ? (
                      <div className="position-relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="img-fluid rounded"
                          style={{ maxHeight: '150px' }}
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
                        <p className="text-muted small mb-0">Upload an image</p>
                      </div>
                    )}
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2"
                    />
                    <small className="text-muted">Recommended: 300x300px</small>
                  </div>
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
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
