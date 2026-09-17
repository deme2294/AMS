import apiClient from './apiService';

export interface ServiceCategory {
  id: number;
  category_name: string;
  description?: string;
  image?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CategoryFormData {
  category_name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  status?: 'active' | 'inactive';
}

class CategoryService {
  private baseUrl = '/api/service-categories';

  /**
   * Get all categories (Admin/Manager)
   */
  async getAllCategories(params?: {
    status?: 'active' | 'inactive';
    search?: string;
  }): Promise<ServiceCategory[]> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data.data;
  }

  /**
   * Get public categories (no auth required)
   */
  async getPublicCategories(): Promise<ServiceCategory[]> {
    const response = await apiClient.get(`${this.baseUrl}/public`);
    return response.data.data;
  }

  /**
   * Get single category by ID
   */
  async getCategoryById(id: number): Promise<ServiceCategory> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  /**
   * Create new category with optional image
   */
  async createCategory(
    data: CategoryFormData,
    imageFile?: File
  ): Promise<ServiceCategory> {
    const formData = new FormData();
    
    formData.append('category_name', data.category_name);
    if (data.description) formData.append('description', data.description);
    if (data.icon) formData.append('icon', data.icon);
    if (data.color) formData.append('color', data.color);
    if (data.sort_order !== undefined) formData.append('sort_order', data.sort_order.toString());
    if (data.status) formData.append('status', data.status);
    if (imageFile) formData.append('image', imageFile);

    const response = await apiClient.post(this.baseUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  /**
   * Update category with optional image
   */
  async updateCategory(
    id: number,
    data: Partial<CategoryFormData>,
    imageFile?: File
  ): Promise<void> {
    const formData = new FormData();
    
    if (data.category_name) formData.append('category_name', data.category_name);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.icon !== undefined) formData.append('icon', data.icon || '');
    if (data.color) formData.append('color', data.color);
    if (data.sort_order !== undefined) formData.append('sort_order', data.sort_order.toString());
    if (data.status) formData.append('status', data.status);
    if (imageFile) formData.append('image', imageFile);

    await apiClient.put(`${this.baseUrl}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Delete category
   */
  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Toggle category status (active/inactive)
   */
  async toggleCategoryStatus(id: number): Promise<{ status: string }> {
    const response = await apiClient.patch(`${this.baseUrl}/${id}/toggle-status`);
    return response.data.data;
  }

  /**
   * Update category sort order (batch update)
   */
  async updateSortOrder(
    categories: Array<{ id: number; sort_order: number }>
  ): Promise<void> {
    await apiClient.put(`${this.baseUrl}/sort-order/update`, { categories });
  }
}

export default new CategoryService();
