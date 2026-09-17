import { request } from './apiService';

export interface AvailabilitySlot {
    id: number;
    barber_id: number | null;
    service_id: number;
    available_date: string;
    start_time: string;
    end_time: string;
    max_bookings: number;
    current_bookings: number;
    slot_status: 'available' | 'booked' | 'closed' | 'paused';
    notes?: string;
    barber_name?: string;
    service_name?: string;
}

export interface BookingService {
    id: number;
    reference_number: string;
    customer_id: number | null;
    service_id: number;
    barber_id: number | null;
    availability_slot_id: number | null;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    appointment_date: string;
    appointment_time: string;
    booking_note: string | null;
    attachment_file: string | null;
    booking_status: 'pending' | 'approved' | 'queued' | 'serving' | 'completed' | 'rejected' | 'cancelled';
    approval_status: 'waiting' | 'approved' | 'rejected';
    queue_status: 'not_started' | 'queued' | 'serving' | 'completed';
    created_at: string;
    updated_at?: string;
    service_name?: string;
    barber_name?: string;
    price?: number;
    duration_minutes?: number;
}

export const availabilityApi = {
    create: (data: {
        service_id: number;
        barber_id?: number | null;
        available_date: string;
        start_time: string;
        end_time: string;
        max_bookings?: number;
        slot_status?: string;
        notes?: string;
    }) =>
        request<{ success: boolean; message: string; data: AvailabilitySlot }>('/availability', {
            method: 'POST',
            data,
        }),

    list: (params?: {
        service_id?: number;
        barber_id?: number;
        date?: string;
        slot_status?: string;
    }) =>
        request<{ success: boolean; data: AvailabilitySlot[] }>('/availability', {
            params: {
                ...(params?.service_id !== undefined && { service_id: params.service_id }),
                ...(params?.barber_id !== undefined && { barber_id: params.barber_id }),
                ...(params?.date !== undefined && { date: params.date }),
                ...(params?.slot_status !== undefined && { slot_status: params.slot_status }),
            },
        }),

    update: (id: number, data: Partial<{
        service_id: number;
        barber_id: number | null;
        available_date: string;
        start_time: string;
        end_time: string;
        max_bookings: number;
        slot_status: string;
        notes: string;
    }>) =>
        request<{ success: boolean; message: string; data: AvailabilitySlot }>(`/availability/${id}`, {
            method: 'PUT',
            data,
        }),

    remove: (id: number) =>
        request<{ success: boolean; message: string }>(`/availability/${id}`, {
            method: 'DELETE',
        }),
};

export const bookingApi = {
    create: (data: {
        service_id: number;
        barber_id?: number;
        appointment_date: string;
        appointment_time: string;
        availability_slot_id?: number;
        customer_name: string;
        customer_phone: string;
        customer_email?: string;
        booking_note?: string;
    }) =>
        request<{ success: boolean; message: string; data: BookingService }>('/service_bookings', {
            method: 'POST',
            data: {
                ...data,
                booking_date: data.appointment_date,
                time_slot: data.appointment_time,
                notes: data.booking_note,
            },
        }),

    getByReference: (reference_number: string) =>
        request<{ success: boolean; data: BookingService }>(`/service_bookings/${reference_number}`),

    getMy: () =>
        request<{ success: boolean; data: BookingService[] }>('/service_bookings/my'),

    approve: (id: number) =>
        request<{ success: boolean; message: string; data: BookingService }>(`/service_bookings/${id}/approve`, {
            method: 'PUT',
        }),

    reject: (id: number, rejection_reason?: string) =>
        request<{ success: boolean; message: string; data: BookingService }>(`/service_bookings/${id}/reject`, {
            method: 'PUT',
            data: { rejection_reason },
        }),
};

