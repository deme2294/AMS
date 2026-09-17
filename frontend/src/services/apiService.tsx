import axios, { AxiosRequestConfig, AxiosError } from 'axios';

const getBaseUrl = (url: string, fallback: string): string => {
  let cleanUrl = (url || '').trim();
  // Fallback only if URL is invalid or undefined
  if (!cleanUrl || cleanUrl === 'undefined') {
    return fallback;
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `http://${cleanUrl}`;
  }
  return cleanUrl.replace(/\/+$/, '');
};

// Dev: backend port may auto-change (server scans from 5005).
// IMPORTANT: Force BACKEND_URL to localhost:5005 for this project to avoid stale ports.
const rawBaseUrl = "http://localhost:5005";
export const BACKEND_URL = getBaseUrl(rawBaseUrl, "http://localhost:5005");


export const WEBSITE_URL = getBaseUrl(import.meta.env.VITE_WEBSITE_URL || "https://ethiopianitpark.et", "https://ethiopianitpark.et");

// Logout Callback Mechanism
let onLogoutCallback: (() => void) | null = null;
export const registerLogoutCallback = (callback: () => void) => {
  onLogoutCallback = callback;
};

// Global Axios Interceptor for Automatic Session Expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[SECURITY] Session expired detected via interceptor. Triggering logout.');
      if (onLogoutCallback) onLogoutCallback();
    }
    return Promise.reject(error);
  }
);


// Generic request function using axios
export async function request<T>(url: string, options: AxiosRequestConfig = {}): Promise<T> {
  try {
    const isFormData = options.data instanceof FormData;
    const defaultHeaders: any = {
      ...options.headers,
    };

    // Only set application/json if we are not sending FormData
    if (!isFormData && !defaultHeaders['Content-Type']) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await axios({
      url: `${BACKEND_URL}/api${url}`,
      withCredentials: true,
      ...options,
      headers: defaultHeaders,
    });
    return response.data as T;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const errorData = axiosError.response.data as { message?: string; error?: string };

      // Don't log 403 errors to console (permission denied - expected behavior)
      if (axiosError.response.status !== 403) {
        // console.error('[SECURITY] API Error Response Masked');
      }

      const message = errorData?.message || errorData?.error || `Request failed with status ${axiosError.response.status}`;
      const apiError = new Error(message) as any;
      apiError.status = axiosError.response.status;
      apiError.response = axiosError.response;
      throw apiError;
    } else if (axiosError.request) {
      // console.error('[SECURITY] API No Response');
      throw new Error(`Connection issue. Please check your network connection and backend server.`);
    } else {
      // console.error('[SECURITY] API Request Setup Error');
      throw new Error('An unexpected error occurred during the request setup.');
    }
  }
}

// Helper to ensure image URLs are fully qualified
export const fixImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  let cleanUrl = String(url).trim();

  // 1. Handle JSON string arrays from database (e.g., '["/uploads/file.jpg"]')
  if (cleanUrl.startsWith('[') && cleanUrl.endsWith(']')) {
    try {
      const parsed = JSON.parse(cleanUrl);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cleanUrl = parsed[0]; // Get first image from array
      }
    } catch (e) {
      console.warn('[fixImageUrl] Failed to parse JSON:', cleanUrl);
    }
  }

  // 2. Remove any accidental surrounding quotes
  cleanUrl = cleanUrl.replace(/^['"]|['"]$/g, '');

  // 3. Handle production domain replacement for local development
  if (cleanUrl.includes('api.ethiopianitpark.et')) {
    cleanUrl = cleanUrl.replace(/https?:\/\/api\.ethiopianitpark\.et/, '');
  }

  // 4. If it's already an absolute URL, return it
  if (cleanUrl.startsWith('http')) return cleanUrl;

  // 5. If it starts with /uploads or uploads/, prepend backend URL
  if (cleanUrl.startsWith('/uploads')) return `${BACKEND_URL}${cleanUrl}`;
  if (cleanUrl.startsWith('uploads/')) return `${BACKEND_URL}/${cleanUrl}`;

  // 6. Otherwise return as-is (for frontend public assets)
  return cleanUrl;
};

export const getFullImageUrl = (baseUrl: string, imagePath?: string): string | undefined => {
  return fixImageUrl(imagePath) || undefined;
};

export interface NewsItem {
  id: number | string;
  title: string;
  date: string; // ISO string format expected from backend for date
  category: string;
  image: string[]; // Updated: Expect an array of image URLs from backend
  imageAltText?: string; // General alt text or for the primary image
  description: string;
  featured: boolean;
  readTime: string;
  youtubeUrl?: string;
  tags?: string[];
  comments?: number;
  createdAt?: string;
  updatedAt?: string; // Added based on your JSON response
}

export interface EventItem {
  id: number | string;
  title: string;
  date: string; // ISO string format expected from backend for date
  time: string;
  venue: string;
  image: string | null; // Updated: Expect a single image URL or null
  imageAltText?: string;
  description: string;
  featured: boolean;
  registrationLink: string;
  capacity: string;
  youtubeUrl?: string; // Added for consistency, though not in your event example
  tags?: string[];
  comments?: number;
  createdAt?: string;
  updatedAt?: string; // Added based on your JSON response (assuming events might have it too)
}

// FormData types for creating/updating posts
// NewsFormData now uses imageFiles for multiple image uploads
export type NewsFormData = Omit<NewsItem, 'id' | 'comments' | 'image' | 'createdAt' | 'updatedAt'> & {
  imageFiles?: File[]; // For multiple file uploads
};

export type EventFormData = Omit<EventItem, 'id' | 'comments' | 'image' | 'createdAt' | 'updatedAt'> & {
  imageFile?: File; // For single file upload
};

// --- MEDIA GALLERY API ---
export interface MediaItem {
  id: number | string;
  title: string;
  type: 'image' | 'video';
  src: string;
  date: string;
  category: string;
  description?: string;
  poster?: string;
}

export interface MediaFormData {
  title: string;
  date: string;
  category: string;
  type: 'image' | 'video';
  description?: string;
  mediaFiles?: File[]; // Support multiple files for batch upload
  posterFile?: File;
  youtubeUrl?: string;
  src?: string; // For video embed URL
}


// Helper to build FormData for News
const buildNewsFormData = (newsData: Partial<NewsFormData>): FormData => {
  const formData = new FormData();
  (Object.keys(newsData) as Array<keyof Partial<NewsFormData>>).forEach(key => {
    // Skip imageFiles and tags as they are handled separately
    if (key === 'imageFiles' || key === 'tags') return;

    const value = newsData[key];
    if (value !== undefined && value !== null) {
      if (key === 'youtubeUrl' && value === '') { // Don't append empty youtubeUrl
        return;
      }
      formData.append(key, typeof value === 'boolean' ? String(value) : String(value));
    }
  });

  if (newsData.tags && newsData.tags.length > 0) {
    newsData.tags.forEach(tag => formData.append('tags', tag));
  } else if (newsData.tags === undefined || (Array.isArray(newsData.tags) && newsData.tags.length === 0)) {
  }

  // Handle multiple image files for News
  if (newsData.imageFiles && newsData.imageFiles.length > 0) {
    newsData.imageFiles.forEach(file => {
      formData.append('newsImages', file, file.name); // Backend expects 'newsImages'
    });
  }
  return formData;
};

// Helper to build FormData for Events (remains for single image)
const buildEventFormData = (eventData: Partial<EventFormData>): FormData => {
  const formData = new FormData();
  (Object.keys(eventData) as Array<keyof Partial<EventFormData>>).forEach(key => {
    if (key === 'imageFile' || key === 'tags') return;
    const value = eventData[key];
    if (value !== undefined && value !== null) {
      if (typeof value === 'boolean') {
        formData.append(key, String(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });
  if (eventData.tags && eventData.tags.length > 0) {
    eventData.tags.forEach(tag => formData.append('tags', tag));
  } else if (eventData.tags === undefined || (Array.isArray(eventData.tags) && eventData.tags.length === 0)) {
  }

  if (eventData.imageFile instanceof File) {
    formData.append('imageFile', eventData.imageFile, eventData.imageFile.name); // Backend expects 'imageFile' for events
  }
  return formData;
};

// --- NEWS API ---
export const getNews = async (): Promise<NewsItem[]> => {
  const response = await request<{ success: boolean, news: NewsItem[] }>('/news', { method: 'GET' });
  if (response.success) {
    return response.news.map(n => ({
      ...n,
      date: n.date ? n.date.split('T')[0] : '',
      tags: Array.isArray(n.tags) ? n.tags : [],
      image: Array.isArray(n.image)
        ? n.image.map(img => fixImageUrl(img) as string)
        : (n.image ? [fixImageUrl(n.image) as string] : []),
    }));
  }
  throw new Error("Failed to fetch news or backend response was not successful.");
};

export const updateNewsItem = async (id: string | number, newsData: Partial<NewsFormData>): Promise<NewsItem> => {
  const formData = buildNewsFormData(newsData);
  const updatedItem = await request<NewsItem>(`/editNews/${id}`, {
    method: 'PUT',
    data: formData,
  });
  return {
    ...updatedItem,
    date: updatedItem.date ? updatedItem.date.split('T')[0] : '',
    tags: Array.isArray(updatedItem.tags) ? updatedItem.tags : [],
    image: Array.isArray(updatedItem.image) ? updatedItem.image : (updatedItem.image ? [updatedItem.image] : []),
  };
};

export const deleteNewsItem = async (id: string | number): Promise<void> => {
  await request<{ success: boolean, message?: string }>(`/deleteNews/${id}`, { method: 'DELETE' });
};

// --- EVENTS API ---
export const getEvents = async (): Promise<EventItem[]> => {
  const response = await request<{ success: boolean, events: EventItem[] }>('/events', { method: 'GET' });
  if (response.success) {
    return response.events.map(e => ({
      ...e,
      date: e.date ? e.date.split('T')[0] : '',
      tags: Array.isArray(e.tags) ? e.tags : [],
      image: fixImageUrl(e.image),
    }));
  }
  throw new Error("Failed to fetch events or backend response was not successful.");
};

export const updateEventItem = async (id: string | number, eventData: Partial<EventFormData>): Promise<EventItem> => {
  const formData = buildEventFormData(eventData);
  const updatedItem = await request<EventItem>(`/editEvent/${id}`, {
    method: 'PUT',
    data: formData,
  });
  return {
    ...updatedItem,
    date: updatedItem.date ? updatedItem.date.split('T')[0] : '',
    tags: Array.isArray(updatedItem.tags) ? updatedItem.tags : [],
    image: updatedItem.image === "" ? null : updatedItem.image,
  };
};

export const deleteEventItem = async (id: string | number): Promise<void> => {
  await request<{ success: boolean, message?: string }>(`/deleteEvent/${id}`, { method: 'DELETE' });
};

// --- CONTACT API ---
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export const getContactMessages = async (): Promise<ContactMessage[]> => {
  const response = await request<{ success: boolean, data: ContactMessage[] }>('/admin/messages', { method: 'GET' });
  if (response.success) {
    return response.data;
  }
  throw new Error("Failed to fetch contact messages");
};

export const markMessageAsRead = async (id: number | string): Promise<void> => {
  await request<{ success: boolean, message: string }>(`/admin/messages/${id}/read`, { method: 'PUT' });
};

export const deleteContactMessage = async (id: number | string): Promise<void> => {
  await request<{ success: boolean, message: string }>(`/admin/messages/${id}`, { method: 'DELETE' });
};

export const replyContactMessage = async (id: number | string, subject: string, replyMessage: string): Promise<void> => {
  await request<{ success: boolean, message: string }>(`/admin/messages/${id}/reply`, {
    method: 'POST',
    data: { subject, replyMessage }
  });
};

// --- INVESTOR INQUIRY API ---
export interface InvestorInquiry {
  id: number;
  full_name: string;
  email: string;
  organization?: string;
  area_of_interest?: string;
  status: 'pending' | 'read' | 'archived';
  created_at: string;
}

export const getInvestorInquiries = async (): Promise<InvestorInquiry[]> => {
  const response = await request<{ success: boolean, data: InvestorInquiry[] }>('/investor-inquiries/admin/inquiries', { method: 'GET' });
  if (response.success) {
    return response.data;
  }
  throw new Error("Failed to fetch investor inquiries");
};

// --- MEDIA API ---
export const getMediaItems = async (): Promise<MediaItem[]> => {
  const response = await request<{ success: boolean, mediaItems: MediaItem[] }>('/media', { method: 'GET' });
  if (response.success) {
    return response.mediaItems.map(item => ({
      ...item,
      src: fixImageUrl(item.src) as string,
      poster: fixImageUrl(item.poster) as string,
    }));
  }
  throw new Error("Failed to fetch media items");
};

export const addMediaItem = async (mediaData: MediaFormData): Promise<any> => {
  const formData = new FormData();
  formData.append('title', mediaData.title);
  formData.append('date', mediaData.date);
  formData.append('category', mediaData.category);
  formData.append('type', mediaData.type);
  if (mediaData.description) formData.append('description', mediaData.description);

  if (mediaData.type === 'image' && mediaData.mediaFiles && mediaData.mediaFiles.length > 0) {
    mediaData.mediaFiles.forEach(file => {
      formData.append('mediaFiles', file, file.name); // Corrected key to 'mediaFiles'
    });
  } else if (mediaData.type === 'video') {
    if (mediaData.src) formData.append('src', mediaData.src);
    if (mediaData.youtubeUrl) formData.append('youtubeUrl', mediaData.youtubeUrl);
  }

  if (mediaData.posterFile) {
    formData.append('posterFile', mediaData.posterFile);
  }

  return request<any>('/media', {
    method: 'POST',
    data: formData,
  });
};

export const updateMediaItem = async (id: number | string, mediaData: Partial<MediaFormData>): Promise<any> => {
  const formData = new FormData();
  if (mediaData.title) formData.append('title', mediaData.title);
  if (mediaData.date) formData.append('date', mediaData.date);
  if (mediaData.category) formData.append('category', mediaData.category);
  if (mediaData.type) formData.append('type', mediaData.type);
  if (mediaData.description) formData.append('description', mediaData.description);

  if (mediaData.type === 'image' && mediaData.mediaFiles && mediaData.mediaFiles.length > 0) {
    formData.append('mediaFiles', mediaData.mediaFiles[0]); // Update usually only takes one file
  } else if (mediaData.type === 'video') {
    if (mediaData.src) formData.append('src', mediaData.src);
    if (mediaData.youtubeUrl) formData.append('youtubeUrl', mediaData.youtubeUrl);
  }

  if (mediaData.posterFile) {
    formData.append('posterFile', mediaData.posterFile);
  }

  return request<any>(`/mediaup/${id}`, {
    method: 'PUT',
    data: formData,
  });
};

export const deleteMediaItem = async (id: number | string): Promise<void> => {
  await request<any>(`/media/${id}`, { method: 'DELETE' });
};

/* --- USER & ROLE API --- */

export interface Role {
  role_id: number;
  role_name: string;
  status: number;
}

export interface Department {
  department_id: number;
  name: string;
}

export interface User {
  user_id: number;
  user_name: string;
  role_id: number;
  status: number | string;
  created_at: string;
  name?: string;
  fname?: string;
  lname?: string;
  email?: string;
  phone?: string;
  role_name?: string;
  department_id?: number;
}

export const getUsers = async (): Promise<User[]> => {
  return request<User[]>('/users', { method: 'GET' });
};

export const addUser = async (userData: any): Promise<any> => {
  return request('/addUser', {
    method: 'POST',
    data: userData,
  });
};

export const updateUser = async (userId: number | string, userData: any): Promise<any> => {
  return request(`/updateUser/${userId}`, {
    method: 'PUT',
    data: userData,
  });
};

export const deleteUser = async (userId: number): Promise<void> => {
  await request<{ success: boolean }>(`/users/${userId}`, { method: 'DELETE' });
};

// --- BOARD MEMBERS & WHO WE ARE API ---
export interface BoardMember {
  id: number;
  name: string;
  english_name?: string;
  position?: string;
  bio?: string;
  image_url?: string;
  linkedin?: string;
  twitter?: string;
  order_index: number;
}

export interface WhoWeAreSection {
  id: number;
  section_type: 'hero' | 'section' | 'features' | 'voice' | 'cta';
  title?: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
  order_index: number;
  is_active: boolean;
}

export const getBoardMembers = async (): Promise<BoardMember[]> => {
  const response = await request<{ success: boolean, boardMembers: BoardMember[] }>('/about/board-members', { method: 'GET' });
  if (response.success) {
    return response.boardMembers.map(member => ({
      ...member,
      image_url: fixImageUrl(member.image_url) as string
    }));
  }
  throw new Error("Failed to fetch board members");
};

export const addBoardMember = async (memberData: Partial<BoardMember> | FormData): Promise<any> => {
  const isFormData = memberData instanceof FormData;
  return request<any>('/about/board-members', {
    method: 'POST',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    data: memberData,
  });
};

export const updateBoardMember = async (id: number, memberData: Partial<BoardMember> | FormData): Promise<any> => {
  const isFormData = memberData instanceof FormData;
  return request<any>(`/about/board-members/${id}`, {
    method: 'PUT',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    data: memberData,
  });
};

export const deleteBoardMember = async (id: number): Promise<void> => {
  await request<any>(`/about/board-members/${id}`, { method: 'DELETE' });
};

export const getWhoWeAreSections = async (): Promise<WhoWeAreSection[]> => {
  const response = await request<{ success: boolean, sections: WhoWeAreSection[] }>('/about/who-we-are', { method: 'GET' });
  if (response.success) {
    return response.sections.map(section => ({
      ...section,
      image_url: fixImageUrl(section.image_url) as string
    }));
  }
  throw new Error("Failed to fetch who we are sections");
};

export const addWhoWeAreSection = async (sectionData: Partial<WhoWeAreSection>): Promise<any> => {
  return request<any>('/about/who-we-are', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: sectionData,
  });
};

export const updateWhoWeAreSection = async (id: number, sectionData: Partial<WhoWeAreSection>): Promise<any> => {
  return request<any>(`/about/who-we-are/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: sectionData,
  });
};

export const deleteWhoWeAreSection = async (id: number): Promise<void> => {
  await request<any>(`/about/who-we-are/${id}`, { method: 'DELETE' });
};

export const changeUserStatus = async (userId: number | string, status: number | string): Promise<any> => {
  return request(`/${userId}/status`, {
    method: 'PUT',
    data: { status },
  });
};

export const getRoles = async (): Promise<Role[]> => {
  return request<Role[]>('/roles', { method: 'GET' });
};

export const createRole = async (roleData: { role_name: string }): Promise<any> => {
  return request('/roles', {
    method: 'POST',
    data: roleData,
  });
};

export const updateRole = async (roleId: number | string, roleData: { role_name: string, status: number }): Promise<any> => {
  return request(`/roles/${roleId}`, {
    method: 'PUT',
    data: roleData,
  });
};

export const deleteRole = async (roleId: number | string): Promise<any> => {
  return request(`/roles/${roleId}`, { method: 'DELETE' });
};

export const getDepartments = async (): Promise<Department[]> => {
  return request<Department[]>('/department', { method: 'GET' });
};

// --- MENU & PERMISSIONS API ---
export interface Menu {
  id: number;
  title: string;
  path?: string;
  icon?: string;
  color?: string;
  parent_id?: number | null;
  order_index: number;
  is_section: boolean;
  is_dropdown: boolean;
  is_active: boolean;
}

export const getMyNavigation = async (): Promise<Menu[]> => {
  const response = await request<{ success: boolean, data: Menu[] }>('/menus/my-nav', { method: 'GET' });
  return response.data;
};

export const getAllMenus = async (): Promise<Menu[]> => {
  const response = await request<{ success: boolean, data: Menu[] }>('/menus/all', { method: 'GET' });
  return response.data;
};

export const createMenu = async (formData: any): Promise<any> => {
  return request('/menus/create', { method: 'POST', data: formData });
};

export const updateMenu = async (id: number, formData: any): Promise<any> => {
  return request(`/menus/${id}`, { method: 'PUT', data: formData });
};

export const deleteMenu = async (id: number): Promise<any> => {
  return request(`/menus/${id}`, { method: 'DELETE' });
};

export interface RolePermission {
  menu_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export const getRolePermissions = async (roleId: number): Promise<RolePermission[]> => {
  const response = await request<{ success: boolean, data: RolePermission[] }>(`/menus/role/${roleId}`, { method: 'GET' });
  return response.data;
};

export const updateRolePermissions = async (roleId: number, permissions: RolePermission[]): Promise<any> => {
  return request(`/menus/role/${roleId}`, { method: 'POST', data: { permissions } });
};

export const getUserPermissions = async (userId: number): Promise<{ menu_id: number, permission_type: string }[]> => {
  const response = await request<{ success: boolean, data: { menu_id: number, permission_type: string }[] }>(`/menus/user/${userId}`, { method: 'GET' });
  return response.data;
};

export const updateUserPermissions = async (userId: number, permissions: { menu_id: number, permission_type: string }[]): Promise<any> => {
  return request(`/menus/user/${userId}`, { method: 'POST', data: { permissions } });
};

// --- ANALYTICS API ---
export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  pendingComments: number;
  activeSubscribers: number;
  pendingInquiries: number;
  newMessages: number;
}

export interface GrowthData {
  newsGrowth: { month: string; count: number }[];
  userGrowth: { month: string; count: number }[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await request<{ success: boolean; data: DashboardStats }>('/analytics/stats', { method: 'GET' });
  return response.data;
};

export const getGrowthData = async (): Promise<GrowthData> => {
  const response = await request<{ success: boolean; data: GrowthData }>('/analytics/growth', { method: 'GET' });
  return response.data;
};

// --- ID GENERATOR API ---
export const saveBulkIds = async (ids: any[]): Promise<any> => {
  return request('/ids/save-bulk', {
    method: 'POST',
    data: { ids }
  });
};

export const getIdHistory = async (): Promise<any[]> => {
  const response = await request<{ success: boolean; data: any[] }>('/ids/history', { method: 'GET' });
  return response.data;
};

// --- EMPLOYEE MANAGEMENT API ---
export interface Employee {
  employee_id?: number;
  name: string;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  sex: 'M' | 'F';
  role_id: number;
  department_id?: number;
  supervisor_id?: number;
  role_name?: string;
  department_name?: string;
}

export const getAllEmployees = async (): Promise<Employee[]> => {
  return request<Employee[]>('/employees/all', { method: 'GET' });
};

export const batchAddEmployees = async (employees: Employee[]): Promise<any> => {
  return request('/employees/batch', {
    method: 'POST',
    data: { employees }
  });
};

// --- ID CARD PERSONS API (Independent from employees) ---
export interface IdCardPerson {
  id?: number;
  id_number?: string;
  fname: string;
  lname: string;
  full_name?: string;
  position?: string;
  position_am?: string;
  department?: string;
  fname_am?: string;
  lname_am?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  sex?: 'M' | 'F';
  date_of_birth?: string;
  date_of_issue?: string;
  expiry_date?: string;
  photo_url?: string;
  signature_url?: string;
  qr_data?: string;
  custom_field_1_label?: string;
  custom_field_1_value?: string;
  custom_field_2_label?: string;
  custom_field_2_value?: string;
  custom_field_3_label?: string;
  custom_field_3_value?: string;
  status?: 'active' | 'inactive' | 'expired';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const getAllIdCardPersons = async (): Promise<IdCardPerson[]> => {
  const response = await request<{ success: boolean; data: IdCardPerson[] }>('/id-card-persons/all', { method: 'GET' });
  return response.data;
};

export const getPublicEmployeeData = async (idNumber: string): Promise<IdCardPerson> => {
  const response = await request<{ success: boolean; data: IdCardPerson }>(`/id-card-persons/public/${idNumber}`, { method: 'GET' });
  return response.data;
};

export const addIdCardPerson = async (person: IdCardPerson): Promise<any> => {
  return request('/id-card-persons/add', {
    method: 'POST',
    data: person
  });
};

export const batchAddIdCardPersons = async (persons: IdCardPerson[]): Promise<any> => {
  return request('/id-card-persons/batch', {
    method: 'POST',
    data: { persons }
  });
};

export const updateIdCardPerson = async (id: number, person: Partial<IdCardPerson>): Promise<any> => {
  return request(`/id-card-persons/${id}`, {
    method: 'PUT',
    data: person
  });
};

export const deleteIdCardPerson = async (id: number): Promise<any> => {
  return request(`/id-card-persons/${id}`, {
    method: 'DELETE'
  });
};

// --- ID CARD TEMPLATES API ---
export interface IdTemplateConfig {
  id?: number;
  template_name: string;
  config: any;
}

export const getAllIdTemplates = async (): Promise<IdTemplateConfig[]> => {
  const response = await request<{ success: boolean; data: IdTemplateConfig[] }>('/id-card-persons/templates', { method: 'GET' });
  return response.data;
};

export const saveIdTemplate = async (template: IdTemplateConfig): Promise<any> => {
  return request('/id-card-persons/templates', {
    method: 'POST',
    data: template
  });
};

export const updateIdTemplate = async (id: number, template: IdTemplateConfig): Promise<any> => {
  return request(`/id-card-persons/templates/${id}`, {
    method: 'PUT',
    data: template
  });
};

export const uploadIdCardPhoto = async (formData: FormData): Promise<any> => {
  return request('/id-card-persons/upload-photo', {
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// --- INCUBATION API ---
export interface IncubationProgram {
  id: number;
  title: string;
  icon: string;
  description: string;
  link: string;
}

export interface IncubationStory {
  id: number;
  image_url: string;
  title: string;
  description: string[];
  stats: { number: string; label: string }[];
  link: string;
}

export const getIncubationPrograms = async (): Promise<IncubationProgram[]> => {
  const response = await request<{ success: boolean; programs: IncubationProgram[] }>('/incubation/programs');
  return response.programs;
};

export const addIncubationProgram = async (program: Partial<IncubationProgram>): Promise<IncubationProgram> => {
  return request<IncubationProgram>('/incubation/programs', { method: 'POST', data: program });
};

export const updateIncubationProgram = async (id: number, program: Partial<IncubationProgram>): Promise<IncubationProgram> => {
  return request<IncubationProgram>(`/incubation/programs/${id}`, { method: 'PUT', data: program });
};

export const deleteIncubationProgram = async (id: number): Promise<void> => {
  await request(`/incubation/programs/${id}`, { method: 'DELETE' });
};

export const getIncubationStories = async (): Promise<IncubationStory[]> => {
  const response = await request<{ success: boolean; stories: IncubationStory[] }>('/incubation/stories');
  return response.stories;
};

export const addIncubationStory = async (formData: FormData): Promise<IncubationStory> => {
  return request<IncubationStory>('/incubation/stories', {
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateIncubationStory = async (id: number, formData: FormData): Promise<IncubationStory> => {
  return request<IncubationStory>(`/incubation/stories/${id}`, {
    method: 'PUT',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteIncubationStory = async (id: number): Promise<void> => {
  await request(`/incubation/stories/${id}`, { method: 'DELETE' });
};// --- CAREER API ---
export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  status: 'draft' | 'published' | 'closed';
  description: string;
  responsibilities: string;
  qualifications: string;
  start_date: string;
  deadline: string;
  created_at: string;
}

export interface Application {
  id: number;
  job_id: number;
  jobTitle: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  linkedin: string;
  portfolio: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'written_exam' | 'interview_shortlisted' | 'interviewing' | 'offered' | 'rejected';
  tracking_code: string;
  applied_at: string;
  resume_path: string;
  cover_letter: string;
  education: string;
  work_experience: string;
  skills: string;
  admin_notes: string;
  appointment_date: string;
  appointment_time: string;
  appointment_location: string;
  appointment_map_link: string;
  appointment_lat: number;
  appointment_lng: number;
  appointment_details: string;
}

export const getJobs = async (): Promise<Job[]> => {
  return request<Job[]>('/careers/admin/jobs');
};

export const addJob = async (jobData: any): Promise<Job> => {
  return request<Job>('/careers/admin/jobs', { method: 'POST', data: jobData });
};

export const updateJob = async (id: number, jobData: any): Promise<Job> => {
  return request<Job>(`/careers/admin/jobs/${id}`, { method: 'PUT', data: jobData });
};

export const deleteJob = async (id: number): Promise<void> => {
  await request(`/careers/admin/jobs/${id}`, { method: 'DELETE' });
};

export const getApplications = async (): Promise<Application[]> => {
  return request<Application[]>('/careers/admin/applications');
};

export const updateApplicationStatus = async (id: number, statusData: any): Promise<void> => {
  await request(`/careers/admin/applications/${id}/status`, { method: 'PUT', data: statusData });
};

export const bulkUpdateApplicationStatus = async (bulkData: any): Promise<void> => {
  await request('/careers/admin/applications/bulk-status', { method: 'POST', data: bulkData });
};

// --- PARTNERS & INVESTORS API ---
export interface Partner {
  id: number;
  partner_id: string;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  partnership_type?: string;
  country?: string;
  zone?: string;
  industry_type?: string;
  agreement_start_date?: string;
  agreement_end_date?: string;
  status: 'Active' | 'Inactive' | 'Ongoing';
  services_provided: string | string[];
  logo?: string;
  gallery?: string[];
  description?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  slug?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

export interface Investor {
  id: number;
  investor_id: string;
  company_name: string;
  property_name?: string;
  industry_type?: string;
  availability_status?: string;
  zone?: string;
  country?: string;
  description?: string;
  contact_name?: string;
  contact_phone?: string;
  investment_type?: string;
  established_date?: string;
  website?: string;
  image?: string;
  gallery?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  slug?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

export const getPartners = async (): Promise<Partner[]> => {
  const response = await request<{ success: boolean; partners: Partner[] }>('/partners-investors/partners');
  return response.partners;
};

export const addPartner = async (formData: FormData): Promise<any> => {
  return request('/partners-investors/partners', {
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updatePartner = async (id: number, formData: FormData): Promise<any> => {
  return request(`/partners-investors/partners/${id}`, {
    method: 'PUT',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deletePartner = async (id: number): Promise<void> => {
  await request(`/partners-investors/partners/${id}`, { method: 'DELETE' });
};

export const getInvestors = async (): Promise<Investor[]> => {
  const response = await request<{ success: boolean; investors: Investor[] }>('/partners-investors/investors');
  return response.investors;
};

export const addInvestor = async (formData: FormData): Promise<any> => {
  return request('/partners-investors/investors', {
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateInvestor = async (id: number, formData: FormData): Promise<any> => {
  return request(`/partners-investors/investors/${id}`, {
    method: 'PUT',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteInvestor = async (id: number): Promise<void> => {
  await request(`/partners-investors/investors/${id}`, { method: 'DELETE' });
};

// --- INVESTMENT ROADMAP & RESOURCES API ---
export interface InvestmentStep {
  id: number;
  step_number: number;
  title: string;
  description: string;
  doc_url?: string;
  status: string;
}

export interface InvestmentResource {
  id: number;
  label: string;
  icon: string;
  file_url: string;
  type: string;
}

export const getInvestmentSteps = async (): Promise<InvestmentStep[]> => {
  return request<InvestmentStep[]>('/invest/steps');
};

export const addInvestmentStep = async (formData: FormData): Promise<any> => {
  return request('/invest/steps', {
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateInvestmentStep = async (id: number, formData: FormData): Promise<any> => {
  return request(`/invest/steps/${id}`, {
    method: 'PUT',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteInvestmentStep = async (id: number): Promise<void> => {
  await request(`/invest/steps/${id}`, { method: 'DELETE' });
};

export const getInvestmentResources = async (): Promise<InvestmentResource[]> => {
  return request<InvestmentResource[]>('/invest/resources');
};

export const addInvestmentResource = async (formData: FormData): Promise<any> => {
  return request('/invest/resources', {
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteInvestmentResource = async (id: number): Promise<void> => {
  await request(`/invest/resources/${id}`, { method: 'DELETE' });
};

// --- LEASED LAND & ZONES API ---
export interface LandZone {
  id: number;
  name: string;
  description: string;
  total_size_sqm: number;
  available_size_sqm: number;
  icon_name: string;
}

export interface LeasedLand {
  id: string;
  zone_id: number;
  zone_name?: string;
  land_type: string;
  location: string;
  size_sqm: number;
  available_size_sqm: number;
  status: 'Available' | 'Leased';
  leased_by: string | null;
  leased_from: string;
  contact_name: string;
  contact_phone: string;
}

export const getLeasedLands = async (): Promise<LeasedLand[]> => {
  const response = await request<{ success: boolean; leasedLands: LeasedLand[] }>('/lands');
  return response.leasedLands;
};

export const addLeasedLand = async (data: any): Promise<any> => {
  return request('/lands', { method: 'POST', data });
};

export const updateLeasedLand = async (id: string, data: any): Promise<any> => {
  return request(`/lands/${encodeURIComponent(id)}`, { method: 'PUT', data });
};

export const deleteLeasedLand = async (id: string): Promise<void> => {
  await request(`/lands/${encodeURIComponent(id)}`, { method: 'DELETE' });
};

export const getLandZones = async (): Promise<LandZone[]> => {
  const response = await request<{ success: boolean; landZones: LandZone[] }>('/lands/zones');
  return response.landZones;
};

export const addLandZone = async (data: any): Promise<any> => {
  return request('/lands/zones', { method: 'POST', data });
};

export const updateLandZone = async (id: number, data: any): Promise<any> => {
  return request(`/lands/zones/${id}`, { method: 'PUT', data });
};

export const deleteLandZone = async (id: number): Promise<void> => {
  await request(`/lands/zones/${id}`, { method: 'DELETE' });
};

// --- LIVE EVENTS API ---
export interface LiveEvent {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  stream_url: string;
  stream_poster: string;
  status: 'draft' | 'published' | 'live' | 'ended';
  is_streaming: boolean;
  is_recording: boolean;
  estimated_viewers?: number;
  signaling_data?: string;
}

export const getLiveEvents = async (): Promise<LiveEvent[]> => {
  const response = await request<{ success: boolean; liveEvents: LiveEvent[] }>('/live-events');
  return response.liveEvents;
};

export const addLiveEvent = async (data: any): Promise<any> => {
  return request('/live-events', { method: 'POST', data });
};

export const updateLiveEvent = async (id: number, data: any): Promise<any> => {
  return request(`/live-events/${id}`, { method: 'PUT', data });
};

export const deleteLiveEvent = async (id: number): Promise<void> => {
  await request(`/live-events/${id}`, { method: 'DELETE' });
};

export const toggleLiveStream = async (id: number, state: boolean): Promise<any> => {
  return request(`/live-events/${id}/stream`, { method: 'POST', data: { state } });
};

export const toggleLiveRecording = async (id: number, state: boolean): Promise<any> => {
  return request(`/live-events/${id}/record`, { method: 'POST', data: { state } });
};

export const postLiveSignaling = async (id: number, data: any): Promise<void> => {
  await request(`/live-events/${id}/signaling`, { method: 'POST', data });
};

// --- TRAINING API ---
export interface Training {
  id: number;
  title: string;
  image_url?: string;
  event_date: string;
  duration: string;
  location: string;
  type: string;
  instructor: string;
  capacity: number;
  summary: string;
  description: string;
  tags: string[];
  link?: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
}

export const getTrainings = async (): Promise<Training[]> => {
  const response = await request<{ success: boolean; trainings: Training[] }>('/trainings');
  return response.trainings;
};

export const addTraining = async (formData: FormData): Promise<any> => {
  return request('/trainings', {
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateTraining = async (id: number, formData: FormData): Promise<any> => {
  return request(`/trainings/${id}`, {
    method: 'PUT',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteTraining = async (id: number): Promise<void> => {
  await request(`/trainings/${id}`, { method: 'DELETE' });
};

// --- OFFICE API ---
export interface Office {
  id: string;
  zone: string;
  building_id: number;
  building_name?: string;
  unit_number: string;
  floor: number;
  size_sqm: number;
  status: 'Available' | 'Rented';
  price_monthly: number;
  rented_by: string | null;
  available_from: string;
  contact_name: string;
  contact_phone: string;
}

export interface Building {
  id: number;
  name: string;
  description: string;
  total_offices: number;
  available_offices: number;
  total_size_sqm: number;
  icon_name: string;
}

export const getOffices = async (): Promise<Office[]> => {
  const response = await request<{ success: boolean; offices: Office[] }>('/offices');
  return response.offices;
};

export const addOffice = async (data: any): Promise<any> => {
  return request('/offices', { method: 'POST', data });
};

export const updateOffice = async (id: string, data: any): Promise<any> => {
  return request(`/offices/${encodeURIComponent(id)}`, { method: 'PUT', data });
};

export const deleteOffice = async (id: string): Promise<void> => {
  await request(`/offices/${encodeURIComponent(id)}`, { method: 'DELETE' });
};

export const getBuildings = async (): Promise<Building[]> => {
  const response = await request<{ success: boolean; buildings: Building[] }>('/offices/buildings');
  return response.buildings;
};

export const addBuilding = async (data: any): Promise<any> => {
  return request('/offices/buildings', { method: 'POST', data });
};

export const updateBuilding = async (id: number, data: any): Promise<any> => {
  return request(`/offices/buildings/${id}`, { method: 'PUT', data });
};

export const deleteBuilding = async (id: number): Promise<void> => {
  await request(`/offices/buildings/${id}`, { method: 'DELETE' });
};

// --- PAGES API ---
export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published';
  author?: string;
  created_at?: string;
}

export const getPages = async (): Promise<Page[]> => {
  return request<Page[]>('/pages');
};

export const addPage = async (data: any): Promise<any> => {
  return request('/pages', { method: 'POST', data });
};

export const updatePage = async (id: number, data: any): Promise<any> => {
  return request(`/pages/${id}`, { method: 'PUT', data });
};

export const deletePage = async (id: number): Promise<void> => {
  await request(`/pages/${id}`, { method: 'DELETE' });
};

// --- CATEGORIES API ---
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export const getCategories = async (): Promise<Category[]> => {
  return request<Category[]>('/categories');
};

export const addCategory = async (data: any): Promise<any> => {
  return request('/categories', { method: 'POST', data });
};

export const updateCategory = async (id: number, data: any): Promise<any> => {
  return request(`/categories/${id}`, { method: 'PUT', data });
};

export const deleteCategory = async (id: number): Promise<void> => {
  await request(`/categories/${id}`, { method: 'DELETE' });
};

// --- TAGS API ---
export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export const getTags = async (): Promise<Tag[]> => {
  return request<Tag[]>('/tags');
};

export const addTag = async (data: any): Promise<any> => {
  return request('/tags', { method: 'POST', data });
};

export const updateTag = async (id: number, data: any): Promise<any> => {
  return request(`/tags/${id}`, { method: 'PUT', data });
};

export const deleteTag = async (id: number): Promise<void> => {
  await request(`/tags/${id}`, { method: 'DELETE' });
};

// ==========================================
// THEME & APPEARANCE SETTINGS API
// ==========================================
export const getSystemSettings = async (): Promise<Record<string, string>> => {
  try {
    const res = await request('/settings', { method: 'GET' }) as any;
    return res.settings || {};
  } catch (error) {
    console.error("Failed to fetch settings from server", error);
    return {};
  }
};

export const updateSystemSettings = async (settings: Record<string, string>): Promise<any> => {
  return request('/settings', { method: 'PUT', data: settings });
};

// ==========================================
// ORGANIZATION STRUCTURE & EMPLOYEE POSITIONS API
// ==========================================

export interface OrganizationNode {
  id: number;
  name: string;
  name_amharic: string;
  type: string;
  parent_id: number | null;
  level: number;
  description: string | null;
  head_employee_id: number | null;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  head_fname?: string;
  head_lname?: string;
}

export interface OrganizationType {
  id: number;
  name: string;
  description?: string;
  color?: string;
  level_order: number;
}

export interface EmployeePosition {
  id: number;
  employee_id: number;
  org_node_id: number;
  is_primary: boolean | number;
  is_delegation: boolean | number;
  created_at?: string;
  fname?: string;
  lname?: string;
  email?: string;
  org_node_name?: string;
  org_node_type?: string;
}

export const getOrganizationStructure = async (): Promise<OrganizationNode[]> => {
  const res = await request<{ data: OrganizationNode[] }>('/organization/structure', { method: 'GET' });
  return res.data;
};

export const getOrganizationTypes = async (): Promise<OrganizationType[]> => {
  const res = await request<{ data: OrganizationType[] }>('/organization/types', { method: 'GET' });
  return res.data;
};

export const createOrganizationNode = async (data: Partial<OrganizationNode>): Promise<any> => {
  return request('/organization/structure', { method: 'POST', data });
};

export const updateOrganizationNode = async (id: number, data: Partial<OrganizationNode>): Promise<any> => {
  return request(`/organization/structure/${id}`, { method: 'PUT', data });
};

export const deleteOrganizationNode = async (id: number): Promise<any> => {
  return request(`/organization/structure/${id}`, { method: 'DELETE' });
};

export const getEmployeePositions = async (): Promise<EmployeePosition[]> => {
  const res = await request<{ data: EmployeePosition[] }>('/organization/positions', { method: 'GET' });
  return res.data;
};

export const assignEmployeePosition = async (data: Partial<EmployeePosition>): Promise<any> => {
  return request('/organization/positions', { method: 'POST', data });
};

export const removeEmployeePosition = async (id: number): Promise<any> => {
  return request(`/organization/positions/${id}`, { method: 'DELETE' });
};

// --- COMPLAINTS MANAGEMENT API ---
export interface Complaint {
  complaint_id: number;
  reference_number: string;
  user_id: number | null;
  name: string;
  email: string;
  phone_number: string;
  title: string;
  description: string;
  category_id: number | null;
  subcategory: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  assigned_to: number | null;
  department: string;
  created_at: string;
  updated_at: string;
  attachment_url: string | null;
  is_public: boolean;
  user_name?: string;
  user_email?: string;
  category_name?: string;
  assigned_to_name?: string;
  comments?: ComplaintComment[];
  history?: ComplaintHistory[];
  attachments?: ComplaintAttachment[];
  feedback?: ComplaintFeedback[];
}

export interface ComplaintComment {
  comment_id: number;
  complaint_id: number;
  user_id: number;
  message: string;
  created_at: string;
  user_name?: string;
}

export interface ComplaintHistory {
  history_id: number;
  complaint_id: number;
  status_before: string;
  status_after: string;
  changed_by: number;
  changed_at: string;
  changed_by_name?: string;
}

export interface ComplaintAttachment {
  attachment_id: number;
  complaint_id: number;
  file_url: string;
  uploaded_at: string;
}

export interface ComplaintFeedback {
  feedback_id: number;
  complaint_id: number;
  rating: number;
  feedback_comment: string;
  created_at: string;
}

export interface ComplaintCategory {
  category_id: number;
  category_name: string;
  description: string;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

export const getAllComplaints = async (): Promise<Complaint[]> => {
  const response = await request<{ success: boolean; data: Complaint[] }>('/complaints/all', { method: 'GET' });
  return response.data;
};

export const getComplaintById = async (id: number): Promise<Complaint> => {
  const response = await request<{ success: boolean; data: Complaint }>(`/complaints/${id}`, { method: 'GET' });
  return response.data;
};

export const updateComplaintStatus = async (id: number, data: { status?: string; assigned_to?: number; department?: string; priority?: string }): Promise<any> => {
  return request(`/complaints/${id}`, { method: 'PUT', data });
};

export const addComplaintComment = async (id: number, message: string): Promise<any> => {
  return request(`/complaints/${id}/comments`, { method: 'POST', data: { message } });
};

export const getComplaintCategories = async (): Promise<ComplaintCategory[]> => {
  const response = await request<{ success: boolean; data: ComplaintCategory[] }>('/complaints/categories', { method: 'GET' });
  return response.data;
};

export const getComplaintStats = async (): Promise<ComplaintStats> => {
  const response = await request<{ success: boolean; data: ComplaintStats }>('/complaints/stats', { method: 'GET' });
  return response.data;
};

export const deleteComplaint = async (id: number): Promise<any> => {
  return request(`/complaints/${id}`, { method: 'DELETE' });
};

export const submitComplaint = async (data: {
  title: string;
  description: string;
  category_id?: number;
  priority?: string;
  department?: string;
  phone_number?: string;
  location?: string;
  email?: string;
}): Promise<any> => {
  return request('/complaints/submit', { method: 'POST', data });
};

// --- PUBLIC COMPLAINT API (No authentication) ---
export interface PublicComplaintData {
  name: string;
  email: string;
  phone_number?: string;
  title: string;
  description: string;
  category_id?: number;
  subcategory?: string;
  location?: string;
  priority?: string;
}

export interface PublicComplaintResponse {
  success: boolean;
  message: string;
  reference_number: string;
}

export const submitPublicComplaint = async (data: PublicComplaintData): Promise<PublicComplaintResponse> => {
  const response = await axios({
    url: `/api/complaints/public/submit`,
    method: 'POST',
    data,
  });
  return response.data;
};

export const getPublicCategories = async (): Promise<ComplaintCategory[]> => {
  const response = await axios({
    url: `/api/complaints/public/categories`,
    method: 'GET',
  });
  return response.data.data;
};

export interface CategoryStats {
  category_id: number | null;
  category_name: string;
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

export const getComplaintStatsByCategory = async (): Promise<CategoryStats[]> => {
  const response = await request<{ success: boolean; data: CategoryStats[] }>('/complaints/stats-by-category', { method: 'GET' });
  return response.data;
};

// Get complaint for response (via token)
export const getComplaintForResponse = async (token: string) => {
  const response = await request<{ success: boolean; data: any }>(`/complaints/respond/${token}`, { method: 'GET' });
  return response;
};

// Submit response to complaint (via token)
export const submitComplaintResponse = async (token: string, responseText: string, status?: string) => {
  const response = await request<{ success: boolean; message: string }>(`/complaints/respond/${token}`, {
    method: 'POST',
    data: { response: responseText, status: status }
  });
  return response;
};

// Submit admin response to complaint sender
export const submitAdminResponse = async (complaintId: number, adminResponse: string) => {
  const response = await request<{ success: boolean; message: string }>(`/complaints/${complaintId}/admin-response`, {
    method: 'POST',
    data: { admin_response: adminResponse }
  });
  return response;
};

// Submit response to complaint (public form)
export const submitResponseComplaint = async (data: {
  complaint_id: number;
  reference_number: string;
  responder_name: string;
  responder_email: string;
  response_content: string;
  status?: string;
  token?: string;
}) => {
  const response = await request<{ success: boolean; message: string; response_id?: number }>(`/complaint-response/submit-response`, {
    method: 'POST',
    data
  });
  return response;
};

// Get complaint details for response form (public)
export const getComplaintDetailsForResponse = async (complaintId: number, referenceNumber: string) => {
  const response = await request<{ success: boolean; data: any }>(`/complaint-response/complaint-details?complaint_id=${complaintId}&reference_number=${referenceNumber}`);
  return response;
};

// Get all responses (Admin/Manager)
export const getAllResponseComplaints = async () => {
  const response = await request<{ success: boolean; data: any[] }>(`/complaint-response/responses`);
  return response;
};

// Get complaints assigned to the current user
export const getAssignedComplaints = async () => {
  const response = await request<{ success: boolean; data: any[] }>(`/complaints/assigned`);
  return response;
};

// Get single assigned complaint details (for admin dashboard)
export const getAssignedComplaintById = async (id: number) => {
  const response = await request<{ success: boolean; data: any }>(`/complaints/assigned/${id}`);
  return response;
};

// Approve or reject response (Admin/Manager)
export const approveResponseComplaint = async (responseId: number, status: 'Approved' | 'Rejected', adminNotes?: string) => {
  const response = await request<{ success: boolean; message: string }>(`/complaint-response/responses/${responseId}/approve`, {
    method: 'PUT',
    data: { status, admin_notes: adminNotes }
  });
  return response;
};

// Get response by reference number (public)
export const getResponseByRef = async (referenceNumber: string) => {
  const response = await request<{ success: boolean; data: any[] }>(`/complaint-response/response-by-ref/${referenceNumber}`);
  return response;
};

// Get single response by ID
export const getResponseComplaintById = async (responseId: number) => {
  const response = await request<{ success: boolean; data: any }>(`/complaint-response/responses/${responseId}`);
  return response;
};

// Send assigned response to complaint sender (Admin/Manager)
export const sendResponseToSender = async (complaintId: number, status?: string) => {
  const response = await request<{ success: boolean; message: string }>(`/complaints/${complaintId}/send-response-to-sender`, {
    method: 'POST',
    data: { status }
  });
  return response;
};

// Update complaint status (Admin/Manager) - alias with different signature
export const updateComplaintStatusSimple = async (complaintId: number, status: string, comment?: string) => {
  const response = await request<{ success: boolean; message: string }>(`/complaints/${complaintId}`, {
    method: 'PUT',
    data: { status, comment }
  });
  return response;
};


