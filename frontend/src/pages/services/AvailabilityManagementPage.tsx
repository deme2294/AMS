import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Spinner } from 'react-bootstrap';
import { serviceApi, bookingApi } from '../../services/serviceService';
import { availabilityApi } from '../../services/availabilityService';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../components/Auth/AuthContext';

export type AvailabilitySlot = {
  id: number;

  barber_id: number | null;
  service_id: number;

  available_date: string;

  start_time: string;
  end_time: string;

  max_bookings: number;
  current_bookings: number;

  slot_status: 'available' | 'booked' | 'closed' | 'paused';

  notes?: string | null;

  created_by?: number | null;

  created_at?: string;
  updated_at?: string;

  // Joined fields from other tables
  service_name?: string;
  barber_name?: string;

  // UI-only fields
  start_time_ampm?: string;
  end_time_ampm?: string;
};

type Barber = { id: number; full_name: string };

const AvailabilityManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const [servicesLoading, setServicesLoading] = useState(false);
  const [services, setServices] = useState<Array<{ id: number; service_name: string }>>([]);

  const [barbers, setBarbers] = useState<Barber[]>([]);

  // Filters
  const [serviceId, setServiceId] = useState<string>('');
  const [barberId, setBarberId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form (create/edit)
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    service_id: '',
    barber_id: '',
    available_date: date,

    // Explicit AM/PM inputs (persist exactly what admin selects)
    start_hour: '9',
    start_minute: '00',
    start_ampm: 'AM' as 'AM' | 'PM',

    end_hour: '6',
    end_minute: '00',
    end_ampm: 'PM' as 'AM' | 'PM',

    max_bookings: 1,
    slot_status: 'available',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(t);
  }, [successMessage]);

  const refreshBarbers = async () => {
    const res = await bookingApi.getBarbers();
    if (res.success) setBarbers(res.data);
  };

  const refreshServices = async () => {
    setServicesLoading(true);
    try {
      const res = await serviceApi.getAll({ available: true } as any);
      if (res.success) {
        setServices(res.data.map((s: any) => ({ id: s.id, service_name: s.service_name })));
      }
    } finally {
      setServicesLoading(false);
    }
  };

  const loadSlots = async () => {
    const params: Parameters<typeof availabilityApi.list>[0] = {};
    if (serviceId) params.service_id = Number(serviceId);
    if (barberId)  params.barber_id  = Number(barberId);
    if (date)      params.date       = date;
    const res = await availabilityApi.list(params);
    if (res.success) setSlots(res.data);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/services/availability' } });
      return;
    }

    const init = async () => {
      setLoading(true);
      setFormError(null);
      try {
        await Promise.all([refreshBarbers(), refreshServices()]);
      } catch (e: any) {
        setFormError(e.message || 'Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isAuthenticated]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, available_date: date }));
  }, [date]);

  useEffect(() => {
    loadSlots();
  }, [serviceId, barberId, date]);

  const resetForm = () => {
    setMode('create');
    setEditingId(null);
    setFormData({
      service_id: serviceId,
      barber_id: barberId,
      available_date: date,

      start_hour: '9',
      start_minute: '00',
      start_ampm: 'AM',

      end_hour: '6',
      end_minute: '00',
      end_ampm: 'PM',

      max_bookings: 1,
      slot_status: 'available',
    });
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      service_id: serviceId,
      barber_id: barberId,
      available_date: date,
    }));
  }, [serviceId, barberId, date]);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const to24hTime = (hourStr: string, minuteStr: string, ampm: 'AM' | 'PM') => {
        const hour12 = Number(hourStr);
        const minute = Number(minuteStr);
        if (Number.isNaN(hour12) || Number.isNaN(minute)) return null;
        const hour24 = (hour12 % 12) + (ampm === 'PM' ? 12 : 0);
        return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      };

      const start24 = to24hTime(formData.start_hour, formData.start_minute, formData.start_ampm);
      const end24 = to24hTime(formData.end_hour, formData.end_minute, formData.end_ampm);
      if (!start24 || !end24) {
        setFormError('Start time and end time are required');
        return;
      }

      const [sh, sm] = start24.split(':').map(Number);
      const [eh, em] = end24.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      if (endMinutes <= startMinutes) {
        setFormError('End time must be later than start time');
        return;
      }

      if (endMinutes < startMinutes + 30) {
        setFormError('End time must be at least 30 minutes after start time');
        return;
      }

      // Only enforce "time must be in the future" for NEW slots — not when editing existing ones
      if (mode === 'create') {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        if (formData.available_date === today) {
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          if (startMinutes < nowMinutes) {
            const h24 = now.getHours();
            const m = now.getMinutes();
            const ampm = h24 >= 12 ? 'PM' : 'AM';
            const h12 = ((h24 + 11) % 12) + 1;
            const mm = String(m).padStart(2, '0');
            setFormError(`Start time must be later than the current time (${h12}:${mm} ${ampm})`);
            return;
          }
        }
      }

      // Normalize a date value from the DB (may be ISO string) or form to plain YYYY-MM-DD
      const normalizeDate = (d: string) => (d ? d.split('T')[0] : d);

      const normalizedBarberId = formData.barber_id ? Number(formData.barber_id) : null;
      const formDateNorm = normalizeDate(formData.available_date);

      const sameKeyExists = slots.some((s) => {
        const sBarber = s.barber_id ? Number(s.barber_id) : null;
        return (
          s.service_id === Number(formData.service_id) &&
          normalizeDate(s.available_date) === formDateNorm &&
          sBarber === normalizedBarberId &&
          s.start_time.slice(0, 5) === start24 &&
          s.end_time.slice(0, 5) === end24
        );
      });

      if (mode === 'create' && sameKeyExists) {
        setFormError('This availability slot already exists for the selected service/barber and time range');
        return;
      }

      if (mode === 'edit' && editingId) {
        const otherDuplicateExists = slots.some((s) => {
          if (s.id === editingId) return false;
          const sBarber = s.barber_id ? Number(s.barber_id) : null;
          return (
            s.service_id === Number(formData.service_id) &&
            normalizeDate(s.available_date) === formDateNorm &&
            sBarber === normalizedBarberId &&
            s.start_time.slice(0, 5) === start24 &&
            s.end_time.slice(0, 5) === end24
          );
        });
        if (otherDuplicateExists) {
          setFormError('Another availability slot already exists for the selected time range');
          return;
        }
      }

      const payload = {
        service_id: Number(formData.service_id),
        barber_id: formData.barber_id ? Number(formData.barber_id) : null,
        available_date: formData.available_date,
        start_time: `${start24}:00`,
        end_time: `${end24}:00`,
        max_bookings: Number(formData.max_bookings),
        slot_status: formData.slot_status,
      };

      const wasEditing = mode === 'edit';
      const editedServiceId = Number(formData.service_id);

      let response;
      if (mode === 'create') {
        response = await availabilityApi.create(payload);
      } else if (mode === 'edit' && editingId) {
        response = await availabilityApi.update(editingId, payload);
      }

      if (response && response.success) {
        if (wasEditing && response.data) {
          const updatedSlot = response.data as AvailabilitySlot;
          // Optimistic update: merge changed row immediately so table reflects edits without flicker
          setSlots((prev) =>
            prev.map((s) => (s.id === updatedSlot.id ? { ...s, ...updatedSlot } : s))
          );
          setSuccessMessage(
            `✅ Availability slot updated successfully and saved to the database!`
          );
        } else if (!wasEditing) {
          setSuccessMessage(`✅ New availability slot created successfully!`);
        }
      }

      resetForm();

      // Always reload slots after edit/create.
      // This ensures the updated row remains visible in the Active Slots Schedule table
      // even if server-side logic/joins affect the result ordering.
      await loadSlots();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save availability');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (slot: AvailabilitySlot) => {
    setMode('edit');
    setEditingId(slot.id);

    const startHH = Number(slot.start_time.slice(0, 2));
    const startMM = slot.start_time.slice(3, 5);
    const endHH = Number(slot.end_time.slice(0, 2));
    const endMM = slot.end_time.slice(3, 5);

    const start_ampm = (slot.start_time_ampm as 'AM' | 'PM') || (startHH >= 12 ? 'PM' : 'AM');
    const end_ampm = (slot.end_time_ampm as 'AM' | 'PM') || (endHH >= 12 ? 'PM' : 'AM');

    const to12h = (hh24: number) => {
      const h = hh24 % 12;
      return String(h === 0 ? 12 : h);
    };

    const formattedDate = slot.available_date ? slot.available_date.split('T')[0] : date;

    setFormData({
      service_id: String(slot.service_id),
      barber_id: slot.barber_id ? String(slot.barber_id) : '',
      available_date: formattedDate,

      start_hour: to12h(startHH),
      start_minute: startMM,
      start_ampm,

      end_hour: to12h(endHH),
      end_minute: endMM,
      end_ampm,

      max_bookings: Number(slot.max_bookings),
      slot_status: slot.slot_status,
    });
  };

  const handleDelete = async (slot: AvailabilitySlot) => {
    if (!confirm('Delete this availability slot?')) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await availabilityApi.remove(slot.id);
      await loadSlots();
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeWithAmpm = (timeStr: string, ampmStr?: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const hh = Number(parts[0]);
    const mm = parts[1] || '00';
    if (ampmStr) {
      const h12 = hh % 12 === 0 ? 12 : hh % 12;
      return `${String(h12).padStart(2, '0')}:${mm} ${ampmStr}`;
    }
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${String(h12).padStart(2, '0')}:${mm} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid py-6 max-w-[1600px] mx-auto animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-slate-900 dark:text-white">Availability Management</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 mb-0">Set up, adjust, and monitor barber availability slot configurations</p>
        </div>
        <button className="btn btn-outline-secondary rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700 font-semibold px-4 py-2" onClick={resetForm} disabled={submitting}>
          <FaTimes className="me-2" /> Reset Form
        </button>
      </div>

      {successMessage && (
        <div
          className="alert rounded-xl border p-4 mb-4 d-flex align-items-center gap-3 shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            borderColor: '#6ee7b7',
            color: '#065f46',
          }}
          role="alert"
        >
          <span style={{ fontSize: '1.3rem' }}>✅</span>
          <div>
            <strong style={{ display: 'block', marginBottom: 2 }}>Saved to Database</strong>
            <span style={{ fontSize: '0.92rem' }}>{successMessage.replace('✅ ', '')}</span>
          </div>
          <button
            type="button"
            className="btn-close ms-auto"
            aria-label="Close"
            onClick={() => setSuccessMessage(null)}
          />
        </div>
      )}

      {formError && (
        <div className="alert alert-danger rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 shadow-sm p-4 mb-4">{formError}</div>
      )}

      <div className="row g-4">
        {/* Left Side: Form and Filters */}
        <div className="col-lg-4">
          <div className="card border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm p-4 sticky-top" style={{ top: '90px' }}>
            <h6 className="fw-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider text-xs">Filters & Parameters</h6>

            <Form.Group className="mb-3">
              <Form.Label className="text-slate-600 dark:text-slate-400 text-xs font-bold">1. Service Type</Form.Label>
              <Form.Select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2.5 font-medium cursor-pointer">
                <option value="">Select service...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.service_name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-slate-600 dark:text-slate-400 text-xs font-bold">2. Barber Assignment (Optional)</Form.Label>
              <Form.Select value={barberId} onChange={(e) => setBarberId(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2.5 font-medium cursor-pointer">
                <option value="">Global (Any Barber)</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>{b.full_name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="text-slate-600 dark:text-slate-400 text-xs font-bold">3. Slot Date</Form.Label>
              <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2.5 font-medium" />
            </Form.Group>

            <hr className="my-4 border-slate-200 dark:border-slate-800" />

            <h6 className="fw-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider text-xs">{mode === 'create' ? 'Create Availability Slot' : 'Edit Availability Slot'}</h6>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Form.Group className="mb-3">
                <Form.Label className="text-slate-600 dark:text-slate-400 text-xs font-bold">Start Time</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="number"
                    min={1}
                    max={12}
                    name="start_hour"
                    value={formData.start_hour}
                    onChange={handleChange}
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2"
                    required
                  />
                  <Form.Control
                    type="text"
                    name="start_minute"
                    value={formData.start_minute}
                    onChange={handleChange}
                    placeholder="MM"
                    style={{ width: 90 }}
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2 text-center"
                    required
                  />
                  <Form.Select name="start_ampm" value={formData.start_ampm} onChange={handleChange} style={{ width: 110 }} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2 cursor-pointer">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </Form.Select>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-slate-600 dark:text-slate-400 text-xs font-bold">End Time</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="number"
                    min={1}
                    max={12}
                    name="end_hour"
                    value={formData.end_hour}
                    onChange={handleChange}
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2"
                    required
                  />
                  <Form.Control
                    type="text"
                    name="end_minute"
                    value={formData.end_minute}
                    onChange={handleChange}
                    placeholder="MM"
                    style={{ width: 90 }}
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2 text-center"
                    required
                  />
                  <Form.Select name="end_ampm" value={formData.end_ampm} onChange={handleChange} style={{ width: 110 }} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2 cursor-pointer">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </Form.Select>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-slate-600 dark:text-slate-400 text-xs font-bold">Max Booking Capacity</Form.Label>
                <Form.Control type="number" min={1} name="max_bookings" value={formData.max_bookings} onChange={handleChange} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2.5 font-medium" required />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="text-slate-600 dark:text-slate-400 text-xs font-bold">Status</Form.Label>
                <Form.Select name="slot_status" value={formData.slot_status} onChange={handleChange} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-2.5 font-medium cursor-pointer">
                  <option value="available">Available</option>
                  <option value="closed">Closed</option>
                  <option value="paused">Paused</option>
                  <option value="booked">Booked</option>
                </Form.Select>
              </Form.Group>

              <button className="btn btn-primary w-100 rounded-xl py-3 fw-bold tracking-tight shadow-md hover:shadow-lg transition-all" disabled={submitting || !serviceId || Number(formData.max_bookings) < 1}>
                {submitting ? <Spinner animation="border" size="sm" /> : (mode === 'create' ? <><FaPlus className="me-2" /> Add Slot</> : <><FaEdit className="me-2" /> Update Slot</>)}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Slots List Table */}
        <div className="col-lg-8">
          <div className="card border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm p-4 min-h-[600px]">
            <h6 className="fw-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-xs">Active Slots Schedule</h6>
            {!serviceId ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
                  <FaPlus className="text-3xl text-slate-400" />
                </div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Select a Service Type</h5>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">Pick a service from the left dropdown filter to review the current active availability slot configurations.</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
                  <FaTimes className="text-3xl text-slate-400" />
                </div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">No Configured Slots Found</h5>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">No availability slots configured on the selected date for this service type. Use the slot creator on the left to add one.</p>
              </div>
            ) : (
              <div className="table-responsive rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr><th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Start Time</th><th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">End Time</th><th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Service Type</th><th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Assigned Barber</th><th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Capacity</th><th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Slot Status</th><th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-end" style={{ width: '120px' }}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {slots.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/40"><td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{formatTimeWithAmpm(s.start_time, s.start_time_ampm)}</td><td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{formatTimeWithAmpm(s.end_time, s.end_time_ampm)}</td><td className="py-3.5 px-4 fw-semibold text-slate-600 dark:text-slate-300">{s.service_name || `Service #${s.service_id}`}</td><td className="py-3.5 px-4">{s.barber_id ? (
                            <span className="badge bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg px-2.5 py-1.5 font-semibold text-xs border border-blue-200/40">
                              {s.barber_name || `Barber #${s.barber_id}`}
                            </span>
                          ) : (
                            <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-lg px-2.5 py-1.5 font-semibold text-xs border border-slate-200/40">Global (Any Barber)</span>
                          )}</td><td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{s.max_bookings}</td><td className="py-3.5 px-4"><span
                            className={`badge rounded-lg px-2.5 py-1.5 font-bold text-[10px] uppercase border ${
                              s.slot_status === 'available'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/40'
                                : s.slot_status === 'closed'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/40'
                                  : s.slot_status === 'paused'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-200/40'
                                    : 'bg-slate-100 text-slate-800 dark:bg-slate-950/20 dark:text-slate-400 border-slate-200/40'
                            }`}
                          >
                            {s.slot_status}
                          </span></td><td className="py-3.5 px-4 text-end"><div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-sm btn-outline-primary rounded-lg p-2 flex items-center justify-center hover:bg-primary hover:text-white border-slate-200 dark:border-slate-800" onClick={() => handleEdit(s)} disabled={submitting} title="Edit Availability Slot">
                              <FaEdit />
                            </button>
                            <button className="btn btn-sm btn-outline-danger rounded-lg p-2 flex items-center justify-center hover:bg-danger hover:text-white border-slate-200 dark:border-slate-800" onClick={() => handleDelete(s)} disabled={submitting} title="Delete Availability Slot">
                              <FaTrash />
                            </button>
                          </div></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManagementPage;
