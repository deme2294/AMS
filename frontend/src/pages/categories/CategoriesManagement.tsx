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
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import categoryService, { ServiceCategory, CategoryFormData } from '../../services/categoryService';
import './CategoriesManagement.css';

const CategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageFile, setImageFile] = useState<File | undefined>();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: ServiceCategory) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({
        category_name: category.category_name,
        description: category.description,
        icon: category.icon,
        color: category.color || '#6366f1',
        sort_order: category.sort_order,
        status: category.status,
      });
      
      // Set existing image
      if (category.image) {
        setFileList([
          {
            uid: '-1',
            name: 'category-image',
            status: 'done',
            url: `${import.meta.env.VITE_API_BASE_URL}${category.image}`,
          },
        ]);
      }
    } else {
      setEditingCategory(null);
      form.resetFields();
      form.setFieldsValue({
        color: '#6366f1',
        sort_order: 0,
        status: 'active',
      });
      setFileList([]);
    }
    setImageFile(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
    setFileList([]);
    setImageFile(undefined);
  };

  const handleSubmit = async (values: CategoryFormData) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, values, imageFile);
        message.success('Category updated successfully');
      } else {
        await categoryService.createCategory(values, imageFile);
        message.success('Category created successfully');
      }
      handleCloseModal();
      loadCategories();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await categoryService.deleteCategory(id);
      message.success('Category deleted successfully');
      loadCategories();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete category');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await categoryService.toggleCategoryStatus(id);
      message.success('Category status updated');
      loadCategories();
    } catch (error: any) {
      message.error(error.message || 'Failed to update status');
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
      cat.category_name.toLowerCase().includes(searchText.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 90,
      render: (image: string, record: ServiceCategory) => {
        const imageSrc = image
          ? (image.startsWith('http') ? image : `${import.meta.env.VITE_API_BASE_URL || ''}${image}`)
          : null;

        const isFaIcon = record.icon && (record.icon.startsWith('fa-') || record.icon.includes('fa '));

        return (
          <div className="flex items-center justify-center">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={record.category_name}
                className="w-12 h-12 object-cover rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700/80"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg shadow-sm"
                style={{ backgroundColor: record.color || '#6366f1' }}
              >
                {isFaIcon ? (
                  <i className={record.icon}></i>
                ) : (
                  <span>{record.icon || record.category_name.charAt(0).toUpperCase()}</span>
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
          <div className="font-semibold text-slate-900 dark:text-white">{text}</div>
          <div className="text-xs text-slate-400">ID #{record.id}</div>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => <span className="text-slate-600 dark:text-slate-300 text-sm">{desc || '—'}</span>,
    },
    {
      title: 'Sort Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 110,
      sorter: (a: ServiceCategory, b: ServiceCategory) => a.sort_order - b.sort_order,
      render: (order: number) => (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
          {order}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: ServiceCategory) => (
        <span
          onClick={() => handleToggleStatus(record.id)}
          className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all active:scale-95 ${
            status === 'active'
              ? 'badge-emerald text-emerald-700 dark:text-emerald-300'
              : 'badge-rose text-rose-700 dark:text-rose-300'
          }`}
          title="Click to toggle status"
        >
          {status === 'active' ? (
            <>
              <CheckCircleOutlined className="text-xs" /> Active
            </>
          ) : (
            <>
              <CloseCircleOutlined className="text-xs" /> Inactive
            </>
          )}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_: any, record: ServiceCategory) => (
        <Space size="small">
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
            description="Are you sure you want to delete this category? This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Category">
              <Button type="text" danger icon={<DeleteOutlined />} className="rounded-lg" />
            </Tooltip>
          </Popconfirm>
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
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize and manage catalog categories, icons, brand colors, and display sequence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="btn-modern-primary !h-10 !px-5 !rounded-xl !border-0 flex items-center gap-1.5"
          >
            Add Category
          </Button>
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

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
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
        >
          <Form.Item
            name="category_name"
            label="Category Name"
            rules={[
              { required: true, message: 'Please enter category name' },
              { min: 3, message: 'Category name must be at least 3 characters' },
            ]}
          >
            <Input placeholder="e.g., Hair Styling, Spa Services" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="Brief description of this category"
            />
          </Form.Item>

          <Form.Item label="Category Image">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
            <small style={{ color: '#888' }}>
              Max size: 5MB. Supported formats: JPG, PNG, GIF
            </small>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="icon" label="Icon (Optional)">
                <Input placeholder="e.g., ✂️, 💇, 🧖" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="color" label="Color">
                <Input
                  type="color"
                  prefix={<BgColorsOutlined />}
                  style={{ height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label="Sort Order"
                rules={[{ required: true, message: 'Please enter sort order' }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <select className="ant-input" style={{ width: '100%', height: 40 }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesManagement;
