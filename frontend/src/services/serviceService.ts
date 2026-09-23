// services/serviceService.ts
// Service Management Module - API Service

import { request, fixImageUrl } from './apiService';


// Normalization helper to convert MySQL string/number types to proper TS types
const normalizeService = (data: any): any => {
  return {
    ...data,
    price: Number(data.price),
    discount_price: data.discount_price ? Number(data.discount_price) : null,
    duration_minutes: Number(data.duration_minutes),
    max_customers_per_slot: Number(data.max_customers_per_slot),
    preparation_time: Number(data.preparation_time),
    cleanup_time: Number(data.cleanup_time),
    booking_buffer_time: Number(data.booking_buffer_time),
    // Avg rating from DB (decimal): round to 1 decimal
    avg_rating: data.avg_rating != null ? Math.round(Number(data.avg_rating) * 10) / 10 : (data.rating_avg != null ? Math.round(Number(data.rating_avg) * 10) / 10 : null),
    total_ratings: data.total_ratings != null ? Number(data.total_ratings) : (data.rating_count != null ? Number(data.rating_count) : null),
    rating_avg: data.rating_avg != null ? Number(data.rating_avg) : (data.avg_rating != null ? Number(data.avg_rating) : 0),
    rating_count: data.rating_count != null ? Number(data.rating_count) : (data.total_ratings != null ? Number(data.total_ratings) : 0),
    // Ensure booleans
    is_featured: data.is_featured == 1 || data.is_featured === true,
    is_available: data.is_available == 1 || data.is_available === true,
    service_image: fixImageUrl(data.service_image || data.image_url),
    banner_image: fixImageUrl(data.banner_image || data.service_image || data.image_url),
  };
};

// -------------------------
// Types & Interfaces
// -------------------------
export interface ServiceCategory {
  id: number;
  category_name: string;
  description: string | null;
  category_image: string | null;
  banner_image?: string | null;
  color?: string;
  sort_order?: number;
  icon?: string;
  status: 'active' | 'inactive';
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  category_id: number;
  category_name?: string;
  category_color?: string;
  category_banner?: string;
  barber_id: number | null;
  barber_name?: string;
  service_name: string;
  service_slug: string;
  description: string | null;
  short_description?: string | null;
  price: number;
  discount_price: number | null;
  duration_minutes: number;
  service_image: string | null;
  image_url?: string | null;
  banner_image?: string | null;
  service_icon: string | null;
  is_featured: boolean;
  is_available: boolean;
  max_customers_per_slot: number;
  preparation_time: number;
  cleanup_time: number;
  booking_buffer_time: number;
  service_type: 'standard' | 'combo' | 'home_service' | 'vip' | string;
  status: 'active' | 'inactive';
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  avg_rating?: number | null;
  total_ratings?: number | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  // rating counts by star (1..5)
  stars_1?: number;
  stars_2?: number;
  stars_3?: number;
  stars_4?: number;
  stars_5?: number;
}

export interface ServicePackage {
  id: number;
  package_name: string;
  package_slug: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  duration_minutes: number;
  package_image: string | null;
  included_services: string | null;
  is_featured: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}



export interface ServiceFilters {
  category?: number | string;
  featured?: boolean;
  available?: boolean;
  barber_id?: number | string;
  search?: string;
  service_type?: string;
  created_by?: number | string;
  limit?: number;
  offset?: number;
}

export interface ServiceListResponse {
  success: boolean;
  data: Service[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface CategoryListResponse {
  success: boolean;
  data: ServiceCategory[];
  count: number;
}

// -------------------------
// Service Categories API
// -------------------------
export const serviceCategoryApi = {
  // GET all categories
  getAll: async (params?: { status?: string; search?: string }) => {
    const response = await request<CategoryListResponse>('/services/categories', { params });
    if (response.success) {
      response.data = response.data.map(cat => ({ ...cat, category_image: fixImageUrl(cat.category_image) as string | null }));
    }
    return response;
  },

  // GET single category
  getById: async (id: number) => {
    const response = await request<{ success: boolean; data: ServiceCategory }>(`/services/categories/${id}`);
    if (response.success) {
      response.data.category_image = fixImageUrl(response.data.category_image) as string | null;
    }
    return response;
  },

  // CREATE category with optional image (uses FormData for file upload)
  create: async (data: Partial<ServiceCategory> & { imageFile?: File }) => {
    const formData = new FormData();
    if (data.category_name) formData.append('category_name', data.category_name);
    if (data.description) formData.append('description', data.description);
    if (data.status) formData.append('status', data.status);
    if (data.banner_image) formData.append('banner_image', data.banner_image);
    if (data.color) formData.append('color', data.color);
    if (data.sort_order !== undefined) formData.append('sort_order', String(data.sort_order));
    if (data.icon) formData.append('icon', data.icon);
    if (data.category_image) formData.append('image', data.category_image);
    if (data.imageFile) formData.append('image', data.imageFile);

    return request<{ success: boolean; message: string; data: ServiceCategory }>('/services/categories', {
      method: 'POST',
      data: formData,
      // Don't set Content-Type; axios will set it with proper boundary
    });
  },

  // UPDATE category with optional image
  update: async (id: number, data: Partial<ServiceCategory> & { imageFile?: File }) => {
    const formData = new FormData();
    if (data.category_name) formData.append('category_name', data.category_name);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.status) formData.append('status', data.status);
    if (data.banner_image) formData.append('banner_image', data.banner_image);
    if (data.color) formData.append('color', data.color);
    if (data.sort_order !== undefined) formData.append('sort_order', String(data.sort_order));
    if (data.icon) formData.append('icon', data.icon);
    if (data.category_image) formData.append('image', data.category_image);
    if (data.imageFile) formData.append('image', data.imageFile);

    return request<{ success: boolean; message: string; data: ServiceCategory }>(`/services/categories/${id}`, {
      method: 'PUT',
      data: formData,
      // Don't set Content-Type; axios will set it with proper boundary
    });
  },

  // DELETE category
  delete: (id: number) =>
    request<{ success: boolean; message: string }>(`/services/categories/${id}`, {
      method: 'DELETE',
    }),
};

// -------------------------
// Services API (Admin & Customer with Auth)
// -------------------------
export const serviceApi = {
  // GET all services with filters & pagination
  getAll: async (params?: ServiceFilters) => {
    const response = await request<ServiceListResponse>('/services', { params });
    if (response.success) {
      response.data = response.data.map(normalizeService);
    }
    return response;
  },

  // GET single service
  getById: async (id: number) => {
    const response = await request<{ success: boolean; data: Service }>(`/services/${id}`);
    if (response.success) {
      response.data = normalizeService(response.data);
    }
    return response;
  },

  // CREATE service
  create: async (data: Partial<Service> & { imageFile?: File }) => {
    const formData = new FormData();
    if (data.category_id) formData.append('category_id', String(data.category_id));
    if (data.barber_id !== undefined) formData.append('barber_id', data.barber_id ? String(data.barber_id) : '');
    if (data.service_name) formData.append('service_name', data.service_name);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.short_description !== undefined) formData.append('short_description', data.short_description || '');
    if (data.price) formData.append('price', String(data.price));
    if (data.discount_price !== undefined) formData.append('discount_price', data.discount_price ? String(data.discount_price) : '');
    if (data.duration_minutes) formData.append('duration_minutes', String(data.duration_minutes));
    if (data.service_icon) formData.append('service_icon', data.service_icon);
    if (data.is_featured !== undefined) formData.append('is_featured', data.is_featured ? '1' : '0');
    if (data.is_available !== undefined) formData.append('is_available', data.is_available ? '1' : '0');
    if (data.max_customers_per_slot) formData.append('max_customers_per_slot', String(data.max_customers_per_slot));
    if (data.preparation_time) formData.append('preparation_time', String(data.preparation_time));
    if (data.cleanup_time) formData.append('cleanup_time', String(data.cleanup_time));
    if (data.booking_buffer_time) formData.append('booking_buffer_time', String(data.booking_buffer_time));
    if (data.service_type) formData.append('service_type', data.service_type);
    if (data.status) formData.append('status', data.status);
    if (data.banner_image) formData.append('banner_image', data.banner_image);
    if (data.image_url) formData.append('image_url', data.image_url);
    if (data.service_image) formData.append('service_image', data.service_image);
    if (data.imageFile) formData.append('service_image', data.imageFile);

    return request<{ success: boolean; message: string; data: Service }>('/services', {
      method: 'POST',
      data: formData,
      // Don't set Content-Type; axios will set it with proper boundary
    });
  },

  // UPDATE service
  update: async (id: number, data: Partial<Service> & { imageFile?: File }) => {
    const formData = new FormData();
    if (data.category_id !== undefined) formData.append('category_id', String(data.category_id));
    if (data.barber_id !== undefined) formData.append('barber_id', data.barber_id ? String(data.barber_id) : '');
    if (data.service_name) formData.append('service_name', data.service_name);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.short_description !== undefined) formData.append('short_description', data.short_description || '');
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.discount_price !== undefined) formData.append('discount_price', data.discount_price ? String(data.discount_price) : '');
    if (data.duration_minutes !== undefined) formData.append('duration_minutes', String(data.duration_minutes));
    if (data.service_icon !== undefined) formData.append('service_icon', data.service_icon || '');
    if (data.is_featured !== undefined) formData.append('is_featured', data.is_featured ? '1' : '0');
    if (data.is_available !== undefined) formData.append('is_available', data.is_available ? '1' : '0');
    if (data.max_customers_per_slot !== undefined) formData.append('max_customers_per_slot', String(data.max_customers_per_slot));
    if (data.preparation_time !== undefined) formData.append('preparation_time', String(data.preparation_time));
    if (data.cleanup_time !== undefined) formData.append('cleanup_time', String(data.cleanup_time));
    if (data.booking_buffer_time !== undefined) formData.append('booking_buffer_time', String(data.booking_buffer_time));
    if (data.service_type) formData.append('service_type', data.service_type);
    if (data.status) formData.append('status', data.status);
    if (data.banner_image) formData.append('banner_image', data.banner_image);
    if (data.image_url) formData.append('image_url', data.image_url);
    if (data.service_image) formData.append('service_image', data.service_image);
    if (data.imageFile) formData.append('service_image', data.imageFile);

    return request<{ success: boolean; message: string; data: Service }>(`/services/${id}`, {
      method: 'PUT',
      data: formData,
      // Don't set Content-Type; axios will set it with proper boundary
    });
  },

  // DELETE service
  delete: (id: number) =>
    request<{ success: boolean; message: string }>(`/services/${id}`, {
      method: 'DELETE',
    }),

  // Toggle availability (quick action)
  toggleAvailability: (id: number, is_available: boolean) =>
    request<{ success: boolean; message: string; data: Service }>(`/services/${id}/toggle-availability`, {
      method: 'PUT',
      data: { is_available },
    }),
};

// -------------------------
// Service Packages API
// -------------------------
export const servicePackageApi = {
  getAll: async (params?: { status?: string; search?: string }) => {
    const response = await request<{ success: boolean; data: ServicePackage[]; count: number }>('/services/packages', { params });
    if (response.success && response.data) {
      response.data = response.data.map(pkg => ({
        ...pkg,
        price: Number(pkg.price),
        discount_price: pkg.discount_price ? Number(pkg.discount_price) : null,
        duration_minutes: Number(pkg.duration_minutes),
        is_featured: Boolean((pkg as any).is_featured),
        package_image: fixImageUrl(pkg.package_image) as string | null
      }));
    }
    return response;
  },

  getPublic: async (params?: { search?: string }) => {
    const response = await request<{ success: boolean; data: ServicePackage[]; count: number }>('/services/public/packages', { params });
    if (response.success && response.data) {
      response.data = response.data.map(pkg => ({
        ...pkg,
        price: Number(pkg.price),
        discount_price: pkg.discount_price ? Number(pkg.discount_price) : null,
        duration_minutes: Number(pkg.duration_minutes),
        is_featured: Boolean((pkg as any).is_featured),
        package_image: fixImageUrl(pkg.package_image) as string | null
      }));
    }
    return response;
  },


  getById: async (id: number) => {
    const response = await request<{ success: boolean; data: ServicePackage }>(`/services/packages/${id}`);
    if (response.success && response.data) {
      response.data.package_image = fixImageUrl(response.data.package_image) as string | null;
      response.data.price = Number(response.data.price);
    }
    return response;
  },

  create: async (data: Partial<ServicePackage> & { imageFile?: File }) => {
    const formData = new FormData();
    if (data.package_name) formData.append('package_name', data.package_name);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.discount_price !== undefined) formData.append('discount_price', data.discount_price ? String(data.discount_price) : '');
    if (data.duration_minutes !== undefined) formData.append('duration_minutes', String(data.duration_minutes));
    if (data.included_services !== undefined) formData.append('included_services', data.included_services || '');
    if (data.is_featured !== undefined) formData.append('is_featured', data.is_featured ? '1' : '0');
    if (data.status) formData.append('status', data.status);
    if (data.imageFile) formData.append('package_image', data.imageFile);

    return request<{ success: boolean; message: string; data: ServicePackage }>('/services/packages', {
      method: 'POST',
      data: formData,
    });
  },

  update: async (id: number, data: Partial<ServicePackage> & { imageFile?: File }) => {
    const formData = new FormData();
    if (data.package_name) formData.append('package_name', data.package_name);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.discount_price !== undefined) formData.append('discount_price', data.discount_price ? String(data.discount_price) : '');
    if (data.duration_minutes !== undefined) formData.append('duration_minutes', String(data.duration_minutes));
    if (data.included_services !== undefined) formData.append('included_services', data.included_services || '');
    if (data.is_featured !== undefined) formData.append('is_featured', data.is_featured ? '1' : '0');
    if (data.status) formData.append('status', data.status);
    if (data.imageFile) formData.append('package_image', data.imageFile);

    return request<{ success: boolean; message: string; data: ServicePackage }>(`/services/packages/${id}`, {
      method: 'PUT',
      data: formData,
    });
  },

  delete: (id: number) =>
    request<{ success: boolean; message: string }>(`/services/packages/${id}`, {
      method: 'DELETE',
    }),
};


// -------------------------
// Booking APIs
// -------------------------
export const bookingApi = {
  // NOTE: types below are intentionally loose because backend responses are inconsistent
  // and this module is only used to drive UI flows.

  // GET available time slots
  getAvailableSlots: (serviceId: number, date: string, barberId?: number) =>
    request<{ success: boolean; data: { available_slots: string[]; service: { duration_minutes: number }; date: string } }>(
      '/services/available-slots',
      { params: { service_id: serviceId, date, barber_id: barberId } }
    ),

  // POST create booking
  createBooking: (data: {
    service_id: number;
    barber_id?: number;
    booking_date: string;
    time_slot: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    notes?: string;
  }) =>
    request<{ success: boolean; message: string; data: any }>('/service_bookings', {
      method: 'POST',
      data,
    }),

  // GET barbers (for selection) - barber users only; includes username
  getBarbers: (params?: { role_id?: number | string }) =>
    request<{ success: boolean; data: Array<{ id: number; full_name: string; username?: string }> }>('/services/barbers', {
      params,
    }),

  // GET bookings (admin/barber)
  getBookings: (filters?: { date?: string; barber_id?: number; status?: string; approval_status?: string }) =>
    request<{ success: boolean; data: any[] }>('/service_bookings', { params: filters }),

  // GET customer bookings (authenticated customers only)
  getCustomerBookings: () =>
    request<{ success: boolean; data: any[] }>('/service_bookings/my'),

  // Confirm booking
  confirmBooking: (id: number) =>
    request<{ success: boolean; message: string }>(`/service_bookings/${id}/confirm`, { method: 'PUT' }),

  // Cancel booking
  cancelBooking: (id: number) =>
    request<{ success: boolean; message: string }>(`/service_bookings/${id}/cancel`, { method: 'PUT' }),

  // Approve booking (admin/barber)
  approveBooking: (id: number) =>
    request<{ success: boolean; message: string; data: any }>(`/service_bookings/${id}/approve`, { method: 'PUT' }),

  // Approve booking by reference number (admin/barber)
  approveBookingByReference: (referenceNumber: string) =>
    request<{ success: boolean; message: string; data: any }>('/service_bookings/approve-by-ref', {
      method: 'POST',
      data: { reference_number: referenceNumber }
    }),

  // Reject booking (admin/barber)
  rejectBooking: (id: number, rejection_reason?: string) =>
    request<{ success: boolean; message: string; data: any }>(`/service_bookings/${id}/reject`, {
      method: 'PUT',
      data: { rejection_reason }
    }),

  // Delete/Remove booking (admin/barber)
  deleteBooking: (id: number) =>
    request<{ success: boolean; message: string }>(`/service_bookings/${id}`, {
      method: 'DELETE',
    }),
};

// -------------------------
// Booking Workflow APIs (Enhanced Approval Workflow)
// -------------------------
export const workflowApi = {
  // Request changes to a booking
  requestChanges: (id: number, change_requests: string, internal_note?: string) =>
    request<{ success: boolean; message: string; data: any }>(
      `/booking_workflow/${id}/request-changes`,
      {
        method: 'PUT',
        data: { change_requests, internal_note }
      }
    ),

  // Customer resubmits after making changes
  resubmitAfterChanges: (id: number, updated_notes?: string) =>
    request<{ success: boolean; message: string; data: any }>(
      `/booking_workflow/${id}/resubmit`,
      {
        method: 'PUT',
        data: { updated_notes }
      }
    ),

  // Get workflow history for a booking
  getWorkflowHistory: (id: number) =>
    request<{ success: boolean; data: any[] }>(
      `/booking_workflow/${id}/history`
    ),

  // Get workflow history by reference number
  getWorkflowHistoryByReference: (referenceNumber: string) =>
    request<{ success: boolean; data: any[] }>(
      `/booking_workflow/reference/${referenceNumber}/history`
    ),

  // Get available workflow actions
  getAvailableActions: (id: number) =>
    request<{ 
      success: boolean; 
      data: { 
        current_status: string; 
        available_actions: Array<{
          to_state: string;
          requires_note: boolean;
          description: string;
        }>
      }
    }>(
      `/booking_workflow/${id}/actions`
    ),

  // Check pending change requests
  checkPendingChangeRequests: (id: number) =>
    request<{ 
      success: boolean; 
      data: {
        requiresChanges: boolean;
        latestRequest: any | null;
      }
    }>(
      `/booking_workflow/${id}/change-requests`
    ),

  // Get workflow statistics
  getWorkflowStats: (filters?: {
    date_from?: string;
    date_to?: string;
    action?: string;
    role?: string;
  }) =>
    request<{ success: boolean; data: any[] }>(
      `/booking_workflow/stats/workflow`,
      { params: filters }
    ),
};

// -------------------------
// Public/Customer APIs (no auth required for view)
// -------------------------
export const publicServiceApi = {
  // GET all available services
  getAll: async (filters?: { category?: number; featured?: boolean; search?: string }) => {
    const response = await request<ServiceListResponse>('/services/public', {
      params: {
        available: 'true',
        ...filters,
      }
    });
    if (response.success) {
      response.data = response.data.map(normalizeService);
    }
    // Fetch ratings summary for each service in parallel
    if (response.success && response.data.length > 0) {
      try {
        await Promise.allSettled(
          response.data.map(async (service: any) => {
            try {
              const summary = await request<{
                success: boolean;
                data: {
                  avg_rating: number;
                  total_ratings: number;
                  stars_1: number;
                  stars_2: number;
                  stars_3: number;
                  stars_4: number;
                  stars_5: number;
                };
              }>(`/services/public/${service.id}/ratings/summary`);

              if (summary.success) {
                service.avg_rating = summary.data.avg_rating;
                service.total_ratings = summary.data.total_ratings;
                service.stars_1 = summary.data.stars_1;
                service.stars_2 = summary.data.stars_2;
                service.stars_3 = summary.data.stars_3;
                service.stars_4 = summary.data.stars_4;
                service.stars_5 = summary.data.stars_5;
              }
            } catch {
              // rating endpoint not available for this service, leave as null
            }
          })
        );
      } catch {
        // swallow rating fetch errors silently
      }
    }

    return response;
  },

  // GET single service
  getById: async (id: number) => {
    let response = await request<{ success: boolean; data: Service }>(`/services/public/${id}`);
    if (response.success) {
      response.data = normalizeService(response.data);
      try {
        const summary = await request<{ success: boolean; data: { avg_rating: number; total_ratings: number } }>(
          `/services/public/${id}/ratings/summary`
        );
        if (summary.success) {
          response.data.avg_rating = summary.data.avg_rating;
          response.data.total_ratings = summary.data.total_ratings;
        }
      } catch {
        // rating endpoint not available, leave as null
      }
    }
    return response;
  },

  // GET service ratings summary (public)
  getRatingsSummary: async (serviceId: number) =>
    request<{
      success: boolean;
      data: {
        avg_rating: number;
        total_ratings: number;
        stars_1: number;
        stars_2: number;
        stars_3: number;
        stars_4: number;
        stars_5: number;
      };
    }>(`/services/public/${serviceId}/ratings/summary`),


  // POST submit a rating (authenticated)
  submitRating: async (serviceId: number, rating: number, review_text?: string) =>
    request<{ success: boolean; message: string }>(`/services/public/${serviceId}/rate`, {
      method: 'POST',
      data: { rating, review_text: review_text || '' }
    }),

  // GET my rating for a service (authenticated)
  getMyRating: async (serviceId: number) =>
    request<{ success: boolean; data: any }>(`/services/public/${serviceId}/rate`),

  // GET categories for public display
  getCategories: async () => {
    const response = await request<CategoryListResponse>('/services/public/categories');
    if (response.success) {
      response.data = response.data.map(cat => ({ ...cat, category_image: fixImageUrl(cat.category_image) as string | null }));
    }
    return response;
  },

  // GET barbers for public display
  getBarbers: async () => {
    const response = await request<{ success: boolean; data: Array<{ id: number; full_name: string }> }>('/services/barbers');
    return response;
  },
};

// -------------------------
// Queue Management APIs
// -------------------------
export interface QueueEntry {
  id: number;
  booking_id: number;
  reference_number: string;
  queue_position: number;
  estimated_wait_time: number;
  queue_status: 'not_started' | 'queued' | 'serving' | 'completed';
  customer_name?: string;
  phone_number?: string;
  service_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  barber_name?: string;
  approval_status?: 'waiting' | 'approved' | 'rejected';
  booking_queue_status?: 'not_started' | 'queued' | 'serving' | 'completed';
  created_at: string;
  updated_at: string;
}

export const queueApi = {
  // Track queue by reference number (public/customer)
  trackByReference: (referenceNumber: string) =>
    request<{ success: boolean; data: QueueEntry }>(`/queues/track/${referenceNumber}`),

  // GET all queue entries (admin/barber)
  getQueues: (filters?: { queue_status?: string; barber_id?: number; date?: string }) =>
    request<{ success: boolean; data: QueueEntry[] }>('/queues', { params: filters }),

  // Update queue status (serving, completed)
  updateStatus: (id: number, queueStatus: 'not_started' | 'queued' | 'serving' | 'completed') =>
    request<{ success: boolean; message: string; data: QueueEntry }>(`/queues/${id}/status`, {
      method: 'PUT',
      data: { queue_status: queueStatus },
    }),

  // Call next customer for a barber
  callNextForBarber: (barberId: number) =>
    request<{ success: boolean; message: string; data: QueueEntry }>(`/queues/barber/${barberId}/next`, {
      method: 'POST',
    }),

  // Call next customer overall
  callNextOverall: () =>
    request<{ success: boolean; message: string; data: QueueEntry }>('/queues/next', {
      method: 'POST',
    }),

  // Get queue stats
  getStats: (filters?: { barber_id?: number; date?: string }) =>
    request<{ success: boolean; data: { waiting_count: number; serving_count: number; completed_count: number; not_started_count: number; avg_wait_time: number } }>('/queues/stats', {
      params: filters,
    }),
};
// -------------------------
// Service Analytics API
// -------------------------
export interface ServiceStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  changes_requested: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  inQueue: number;
  serving: number;
}

export interface DailyBooking {
  date: string;
  total: number;
  approved: number;
  pending: number;
  completed: number;
}

export interface MonthlyBooking {
  month: string;
  month_name: string;
  total: number;
  approved: number;
  completed: number;
}

export interface CategoryBreakdown {
  category: string;
  total_bookings: number;
  completed: number;
  avg_price: number;
}

export interface ServiceBreakdown {
  service: string;
  price: number;
  category: string;
  total_bookings: number;
  completed: number;
}

export interface BarberPerformance {
  barber_id: number;
  barber_name: string;
  total_bookings: number;
  completed_bookings: number;
  avg_service_price: number;
}

export interface StatusDistribution {
  approval_status: Array<{ status: string; count: number }>;
  booking_status: Array<{ status: string; count: number }>;
}

export interface RevenueStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

export const analyticsApi = {
  // Core service/booking statistics
  getServiceStats: () =>
    request<{ success: boolean; data: ServiceStats }>('/service-analytics/service-stats'),

  // Daily bookings (last 30 days by default)
  getDailyBookings: (days?: number) =>
    request<{ success: boolean; data: DailyBooking[] }>('/service-analytics/daily-bookings', {
      params: { days },
    }),

  // Monthly bookings (last 12 months by default)
  getMonthlyBookings: (months?: number) =>
    request<{ success: boolean; data: MonthlyBooking[] }>('/service-analytics/monthly-bookings', {
      params: { months },
    }),

  // Category breakdown
  getCategoryBreakdown: () =>
    request<{ success: boolean; data: CategoryBreakdown[] }>('/service-analytics/category-breakdown'),

  // Service breakdown (popular services)
  getServiceBreakdown: () =>
    request<{ success: boolean; data: ServiceBreakdown[] }>('/service-analytics/service-breakdown'),

  // Barber performance
  getBarberPerformance: () =>
    request<{ success: boolean; data: BarberPerformance[] }>('/service-analytics/barber-performance'),

  // Status distribution
  getStatusDistribution: () =>
    request<{ success: boolean; data: StatusDistribution }>('/service-analytics/status-distribution'),

  // Recent bookings
  getRecentBookings: (limit?: number) =>
    request<{ success: boolean; data: any[] }>('/service-analytics/recent-bookings', {
      params: { limit },
    }),

  // Revenue statistics
  getRevenueStats: () =>
    request<{ success: boolean; data: RevenueStats }>('/service-analytics/revenue'),
};

// -------------------------
// Service Ratings & Reviews API
// -------------------------
export interface ServiceRatingItem {
  id: number;
  service_id: number;
  service_name: string;
  service_image?: string | null;
  user_id: number;
  customer_name: string;
  user_name?: string;
  rating: number;
  review_text: string;
  created_at: string;
}

export interface AdminRatingsStats {
  total_reviews: number;
  average_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

export interface AdminRatingsResponse {
  success: boolean;
  data: ServiceRatingItem[];
  stats: AdminRatingsStats;
}

export const ratingsApi = {
  // Admin: Get all ratings across all salon services
  getAllAdminRatings: (params?: { service_id?: number; rating?: number; search?: string; limit?: number; offset?: number }) =>
    request<AdminRatingsResponse>('/services/admin/ratings', { params }),

  // Customer: Submit rating & review for a service
  rateService: (serviceId: number, rating: number, reviewText?: string) =>
    request<{ success: boolean; message: string }>(`/services/${serviceId}/rate`, {
      method: 'POST',
      data: { rating, review_text: reviewText }
    }),

  // Customer: Get my rating for a service
  getMyRating: (serviceId: number) =>
    request<{ success: boolean; data: any }>(`/services/${serviceId}/rate`),

  // Public: Get all ratings for a single service
  getServiceRatings: (serviceId: number) =>
    request<{ success: boolean; data: any[] }>(`/services/${serviceId}/ratings`),

  // Public: Get rating summary (average & star counts) for a service
  getRatingsSummary: (serviceId: number) =>
    request<{ success: boolean; data: any }>(`/services/${serviceId}/ratings/summary`),
};