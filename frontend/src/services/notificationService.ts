import { request, getComplaintStats } from './apiService';

export interface NotificationItem {
  id: string | number;
  type: 'contact' | 'inquiry' | 'complaint' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link: string;
  priority?: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  complaints: number;
  contacts: number;
  inquiries: number;
  system: number;
}

// Get all notifications from different sources
export const getAllNotifications = async (): Promise<NotificationItem[]> => {
  try {
    const notifications: NotificationItem[] = [];

    // Fetch complaint statistics
    try {
      const complaintStats = await getComplaintStats();
      
      // Add high priority complaints notification
      if (complaintStats && complaintStats.pending > 0) {
        notifications.push({
          id: 'complaints-pending',
          type: 'complaint',
          title: `${complaintStats.pending} Pending Complaints`,
          message: 'Action required on pending complaints',
          time: new Date().toLocaleString(),
          isRead: false,
          link: '/complaints/analytics',
          priority: 'high',
          actionRequired: true
        });
      }

      // Add high priority complaints notification
      if (complaintStats && complaintStats.highPriority > 0) {
        notifications.push({
          id: 'complaints-high-priority',
          type: 'complaint',
          title: `${complaintStats.highPriority} High Priority Complaints`,
          message: 'Immediate attention required',
          time: new Date().toLocaleString(),
          isRead: false,
          link: '/complaints/analytics',
          priority: 'high',
          actionRequired: true
        });
      }
    } catch (error: any) {
      if (error?.response?.status !== 404 && error?.response?.status !== 403) {
        console.warn('Complaint notifications unavailable:', error?.message || error);
      }
    }

    // Fetch contact messages
    try {
      const contactMsgs = await request<{ data: any[] }>('/contact/messages', {
        method: 'GET',
      });

      if (contactMsgs && Array.isArray(contactMsgs.data)) {
        const contactNotifs: NotificationItem[] = contactMsgs.data
          .filter((msg: any) => msg.status === 'new')
          .map((msg: any) => ({
            id: `contact-${msg.id}`,
            type: 'contact' as const,
            title: `New Message from ${msg.name}`,
            message: msg.message.substring(0, 40) + '...',
            time: new Date(msg.created_at).toLocaleString(),
            isRead: false,
            link: '/interaction/contact-messages',
            priority: 'medium' as const,
            actionRequired: true
          }));
        
        notifications.push(...contactNotifs);
      }
    } catch (error: any) {
      if (error?.response?.status !== 404 && error?.response?.status !== 403) {
        console.warn('Contact notifications unavailable:', error?.message || error);
      }
    }

    // Fetch investor inquiries
    try {
      const inquiries = await request<{ data: any[] }>('/investor-inquiries', {
        method: 'GET',
      });

      if (inquiries && Array.isArray(inquiries.data)) {
        const inquiryNotifs: NotificationItem[] = inquiries.data
          .filter((inq: any) => inq.status === 'pending')
          .map((inq: any) => ({
            id: `inquiry-${inq.id}`,
            type: 'inquiry' as const,
            title: `New Inquiry from ${inq.organization || inq.full_name}`,
            message: `Interest: ${inq.area_of_interest || 'General'}`,
            time: new Date(inq.created_at).toLocaleString(),
            isRead: false,
            link: '/interaction/investor-inquiries',
            priority: 'medium' as const,
            actionRequired: true
          }));
        
        notifications.push(...inquiryNotifs);
      }
    } catch (error: any) {
      if (error?.response?.status !== 404 && error?.response?.status !== 403) {
        console.warn('Inquiry notifications unavailable:', error?.message || error);
      }
    }

    // Sort by priority and time
    return notifications.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority || 'low'];
      const bPriority = priorityOrder[b.priority || 'low'];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return [];
  }
};

// Get notification statistics
export const getNotificationStats = async (): Promise<NotificationStats> => {
  try {
    const notifications = await getAllNotifications();
    
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      complaints: notifications.filter(n => n.type === 'complaint').length,
      contacts: notifications.filter(n => n.type === 'contact').length,
      inquiries: notifications.filter(n => n.type === 'inquiry').length,
      system: notifications.filter(n => n.type === 'system').length,
    };

    return stats;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return {
      total: 0,
      unread: 0,
      complaints: 0,
      contacts: 0,
      inquiries: 0,
      system: 0,
    };
  }
};

// Mark notification as read (client-side only for now)
export const markNotificationAsRead = (notificationId: string | number): void => {
  // This would typically make an API call to update the backend
  // For now, we'll just handle it client-side
  console.log(`Marking notification ${notificationId} as read`);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = (): void => {
  // This would typically make an API call to update the backend
  console.log('Marking all notifications as read');
};

// Create a system notification
export const createSystemNotification = (
  title: string,
  message: string,
  link?: string,
  priority: 'low' | 'medium' | 'high' = 'low'
): NotificationItem => {
  return {
    id: `system-${Date.now()}`,
    type: 'system',
    title,
    message,
    time: new Date().toLocaleString(),
    isRead: false,
    link: link || '/dashboard',
    priority,
    actionRequired: false
  };
};

// Real-time notification listener (for WebSocket integration)
export const setupRealTimeNotifications = (
  callback: (notification: NotificationItem) => void
): (() => void) => {
  // This would typically set up a WebSocket connection
  // For now, we'll return a dummy cleanup function
  
  const dummyCleanup = () => {
    console.log('Cleaning up real-time notifications');
  };

  return dummyCleanup;
};
