import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Space,
  Popconfirm,
  Tag,
  Tooltip,
  Spin,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BgColorsOutlined,
  EyeOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import categoryService, { ServiceCategory, CategoryFormData } from '../../services/categoryService';
import { fixImageUrl } from '../../services/apiService';
import { useAuth } from '../../components/Auth/AuthContext';
import './CategoriesManagement.css';

/**
 * Normalizes any category image path to a full or root-relative URL
 * so that Vite proxy and static serving handle it cleanly without "undefined/".
 */
export const getCategoryImageUrl = (img?: string | null): string => {
  if (!img) return '';
  const fixed = fixImageUrl(img);
  if (fixed) return fixed;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return img.startsWith('/') ? img : `/${img}`;
};

const CategoriesManagement: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const canManage = Boolean(isAdmin || isManager);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAllCategories();
      setCategories(data || []);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to load categories';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: ServiceCategory) => {
    if (!canManage) {
      message.warning('Access denied: Only Administrators and Managers can modify categories.');
      return;
    }

    if (category) {
      setEditingCategory(category);
      // Set existing image preview with fixed URL
      if (category.image) {
        setFileList([
          {
            uid: '-1',
            name: 'category-image',
            status: 'done',
            url: getCategoryImageUrl(category.image),
          },
        ]);
      } else {
        setFileList([]);
      }
    } else {
      setEditingCategory(null);
      setFileList([]);
    }
    setImageFile(undefined);
    setIsModalOpen(true);
  };

  // Synchronize form fields safely when modal is open and Form element is mounted
  useEffect(() => {
    if (isModalOpen) {
      if (editingCategory) {
        form.setFieldsValue({
          category_name: editingCategory.category_name,
          description: editingCategory.description || '',
          icon: editingCategory.icon || '',
          color: editingCategory.color || '#6366f1',
          sort_order: editingCategory.sort_order ?? 0,
          status: editingCategory.status || 'active',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          category_name: '',
          description: '',
          icon: '',
          color: '#6366f1',
          sort_order: categories.length + 1,
          status: 'active',
        });
      }
    }
  }, [isModalOpen, editingCategory, categories.length, form]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFileList([]);
    setImageFile(undefined);
  };

  const handleSubmit = async (values: CategoryFormData) => {
    if (!canManage) {
      message.error('Access denied: You do not have permission to perform this action.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, values, imageFile);
        message.success(`Category "${values.category_name}" updated successfully`);
      } else {
        await categoryService.createCategory(values, imageFile);
        message.success(`Category "${values.category_name}" created successfully`);
      }
      handleCloseModal();
      await loadCategories();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Operation failed';
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canManage) {
      message.error('Access denied: You do not have permission to delete categories.');
      return;
    }

    try {
      await categoryService.deleteCategory(id);
      message.success('Category deleted successfully');
      await loadCategories();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to delete category';
      message.error(errMsg);
    }
  };

  const handleToggleStatus = async (id: number) => {
    if (!canManage) {
      message.warning('Access denied: Only Admins and Managers can toggle category status.');
      return;
    }

    try {
      const res = await categoryService.toggleCategoryStatus(id);
      message.success(`Category status updated to ${res?.status || 'new status'}`);
      await loadCategories();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to update status';
      message.error(errMsg);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);

    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      setImageFile(newFileList[0].originFileObj as File);
    } else {
      setImageFile(undefined);
    }
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.category_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 75,
      render: (id: number) => (
        <span className="font-mono text-xs font-semibold text-slate-500">#{id}</span>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 90,
      render: (image: string, record: ServiceCategory) => {
        const imageSrc = record.image ? getCategoryImageUrl(record.image) : null;
        const isFaIcon = record.icon && (record.icon.startsWith('fa-') || record.icon.includes('fa '));

        return (
          <div className="flex items-center justify-center">
            {imageSrc ? (
              <div
                className="relative group cursor-pointer"
                onClick={() => setPreviewImage(imageSrc)}
                title="Click to view image"
              >
                <img
                  src={imageSrc}
                  alt={record.category_name}
                  className="w-12 h-12 object-cover rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <EyeOutlined className="text-white text-xs" />
                </div>
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg shadow-sm"
                style={{ backgroundColor: record.color || '#6366f1' }}
              >
                {isFaIcon ? (
                  <i className={record.icon}></i>
                ) : (
                  <span>{record.icon || record.category_name?.charAt(0).toUpperCase() || '✂️'}</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Category Name',
      dataIndex: 'category_name',
      key: 'category_name',
      sorter: (a: ServiceCategory, b: ServiceCategory) =>
        a.category_name.localeCompare(b.category_name),
      render: (text: string, record: ServiceCategory) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{text}</span>
            {record.color && (
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: record.color }}
                title={`Color: ${record.color}`}
              />
            )}
          </div>
          {record.icon && (
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <span>Icon:</span>
              <span className="font-mono text-[11px]">{record.icon}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => (
        <span className="text-slate-600 dark:text-slate-300 text-sm">{desc || '—'}</span>
      ),
    },
    {
      title: 'Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 90,
      sorter: (a: ServiceCategory, b: ServiceCategory) => a.sort_order - b.sort_order,
      render: (order: number) => (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
          {order ?? 0}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: ServiceCategory) => {
        const isActive = status === 'active';
        return (
          <span
            onClick={() => canManage && handleToggleStatus(record.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
              canManage ? 'cursor-pointer active:scale-95' : 'cursor-default opacity-85'
            } ${
              isActive
                ? 'badge-emerald text-emerald-700 dark:text-emerald-300'
                : 'badge-rose text-rose-700 dark:text-rose-300'
            }`}
            title={canManage ? 'Click to toggle status' : 'Status managed by Admin/Manager'}
          >
            {isActive ? (
              <>
                <CheckCircleOutlined className="text-xs" /> Active
              </>
            ) : (
              <>
                <CloseCircleOutlined className="text-xs" /> Inactive
              </>
            )}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: ServiceCategory) => (
        <Space size="small">
          {canManage ? (
            <>
              <Tooltip title="Edit Category">
                <Button
                  type="text"
                  icon={<EditOutlined className="text-indigo-600 dark:text-indigo-400" />}
                  onClick={() => handleOpenModal(record)}
                  className="hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg"
                />
              </Tooltip>
              <Popconfirm
                title="Delete Category"
                description="Are you sure you want to delete this category? If it has linked services, deletion will be blocked."
                onConfirm={() => handleDelete(record.id)}
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete Category">
                  <Button type="text" danger icon={<DeleteOutlined />} className="rounded-lg" />
                </Tooltip>
              </Popconfirm>
            </>
          ) : (
            <Tooltip title="Requires Admin or Manager permissions to modify">
              <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                <LockOutlined className="text-xs" /> View only
              </span>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="categories-management space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
              Service Categories
            </h1>
            <span className="badge-indigo text-xs py-1 px-3">
              {categories.length} Categories
            </span>
            {!canManage && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
                <LockOutlined className="text-xs" /> View Only
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize catalog categories, icons, brand colors, images, and sequence for bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManage ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              className="btn-modern-primary !h-10 !px-5 !rounded-xl !border-0 flex items-center gap-1.5"
            >
              Add Category
            </Button>
          ) : (
            <Tooltip title="Only Admins and Managers can create categories">
              <Button
                disabled
                icon={<LockOutlined />}
                className="!h-10 !px-5 !rounded-xl flex items-center gap-1.5"
              >
                Add Category
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      <Card className="glass-card !border-slate-200/80 dark:!border-slate-800/80 !shadow-sm overflow-hidden">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="max-w-md w-full">
            <Input
              placeholder="Search categories by name or description..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="input-modern"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing {filteredCategories.length} of {categories.length}
          </div>
        </div>

        <Spin spinning={loading}>
          {filteredCategories.length === 0 ? (
            <Empty description="No categories found" />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredCategories}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} categories`,
              }}
            />
          )}
        </Spin>
      </Card>

      {/* Edit / Create Modal */}
      <Modal
        title={
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {editingCategory ? `Edit: ${editingCategory.category_name}` : 'Add New Category'}
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={620}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            color: '#6366f1',
            sort_order: 0,
            status: 'active',
          }}
          className="mt-4"
        >
          <Form.Item
            name="category_name"
            label={<span className="font-semibold text-slate-700 dark:text-slate-300">Category Name</span>}
            rules={[
              { required: true, message: 'Please enter category name' },
              { min: 3, message: 'Category name must be at least 3 characters' },
            ]}
          >
            <Input placeholder="e.g., Hair Styling, Beard Grooming" className="input-modern" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="font-semibold text-slate-700 dark:text-slate-300">Description</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Brief description of the services included in this category"
              className="input-modern"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-semibold text-slate-700 dark:text-slate-300">Category Image</span>}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
              onPreview={(file) => {
                if (file.url || file.thumbUrl) {
                  setPreviewImage(file.url || file.thumbUrl || null);
                }
              }}
            >
              {fileList.length === 0 && (
                <div className="flex flex-col items-center justify-center p-3 text-slate-500">
                  <UploadOutlined className="text-lg mb-1" />
                  <div className="text-xs">Upload Image</div>
                </div>
              )}
            </Upload>
            <div className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WebP up to 5MB. Uploading a new image replaces the previous one.
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="icon"
                label={<span className="font-semibold text-slate-700 dark:text-slate-300">Icon / Emoji</span>}
              >
                <Input placeholder="e.g., fa-solid fa-scissors or ✂️" className="input-modern" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="color"
                label={<span className="font-semibold text-slate-700 dark:text-slate-300">Accent Color</span>}
              >
                <Input
                  type="color"
                  prefix={<BgColorsOutlined />}
                  className="input-modern !h-10 !p-1 cursor-pointer"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label={<span className="font-semibold text-slate-700 dark:text-slate-300">Display Order</span>}
                rules={[{ required: true, message: 'Please enter sort order' }]}
              >
                <Input type="number" min={0} className="input-modern" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label={<span className="font-semibold text-slate-700 dark:text-slate-300">Status</span>}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="!mb-0 !mt-6 text-right">
            <Space>
              <Button onClick={handleCloseModal} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                className="btn-modern-primary !rounded-xl !border-0"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={Boolean(previewImage)}
        footer={null}
        onCancel={() => setPreviewImage(null)}
        centered
        width={500}
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="Category Preview"
            className="w-full h-auto max-h-[75vh] object-contain rounded-xl mt-4"
          />
        )}
      </Modal>
    </div>
  );
};

export default CategoriesManagement;
