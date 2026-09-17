# Service Management System - Quick Start Guide

## System Status: ✅ FULLY OPERATIONAL

All components are implemented and connected. The system is ready for production use.

---

## Access URLs

### Backend API
- Base URL: `http://localhost:5005`
- API Endpoint: `http://localhost:5005/api/services`

### Frontend Dashboard (Admin/Barber)
- Login: `http://localhost:5173/panal`
- Services: `http://localhost:5173/services`
- Categories: `http://localhost:5173/services/categories`

### Public Customer Pages (Standalone)
- Services Listing: `http://localhost:5173/services`
- Book Service: `http://localhost:5173/services/book/:id`

---

## Step-by-Step Usage

### For Admin/Barber (Manage Services)

1. **Login**
   - Navigate to `http://localhost:5173/panal`
   - Enter credentials

2. **Create Service Category** (First Time)
   - Go to Services → Categories
   - Click "Add Category"
   - Enter category name (e.g., "Haircut", "Beard")
   - Upload optional image
   - Submit

3. **Create Service**
   - Go to Services → All Services
   - Click "Add Service"
   - Fill the form:
     - **Basic Info**: Name, Category, Description
     - **Pricing**: Price (ETB), Discount Price (optional)
     - **Timing**: Duration, Preparation, Cleanup, Buffer time
     - **Options**: Featured toggle, Availability toggle, Status
     - **Media**: Upload service image
   - Click "Submit Service"
   - Success toast appears, table auto-refreshes

4. **Manage Services**
   - Toggle availability (green button)
   - Edit (blue button)
   - Delete (red button)
   - Search and filter

### For Customers (Book Services)

1. **Browse Services**
   - Visit `http://localhost:5173/services`
   - See only ACTIVE and AVAILABLE services
   - Search by name
   - Filter by category
   - View featured services

2. **Book Appointment**
   - Click "Book Now" on desired service
   - Select barber (optional)
   - Select date
   - Choose available time slot
   - Fill customer details (name, phone, email)
   - Confirm booking

---

## API Reference (Quick)

### Public Endpoints (No Authentication)
```bash
# List active services
curl http://localhost:5005/api/services/public

# List active categories
curl http://localhost:5005/api/services/public/categories

# Get single service
curl http://localhost:5005/api/services/public/1

# Get barbers
curl http://localhost:5005/api/services/barbers

# Get available slots
curl "http://localhost:5005/api/services/available-slots?service_id=1&date=2026-05-15"

# Create booking
curl -X POST http://localhost:5005/api/services/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "barber_id": 1,
    "booking_date": "2026-05-15",
    "time_slot": "10:00",
    "customer_name": "John Doe",
    "customer_phone": "+251911223344"
  }'
```

### Protected Endpoints (JWT Required)
```bash
# List all services (Admin/Barber)
curl -H "Authorization: Bearer <token>" http://localhost:5005/api/services

# Create service
curl -X POST http://localhost:5005/api/services \
  -H "Authorization: Bearer <token>" \
  -F "service_name=Classic Haircut" \
  -F "category_id=1" \
  -F "price=250" \
  -F "duration_minutes=30" \
  -F "service_image=@/path/to/image.jpg"

# Update service
curl -X PUT http://localhost:5005/api/services/1 \
  -H "Authorization: Bearer <token>" \
  -F "price=300"

# Delete service
curl -X DELETE http://localhost:5005/api/services/1 \
  -H "Authorization: Bearer <token>"

# Toggle availability
curl -X PUT http://localhost:5005/api/services/1/toggle-availability \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"is_available": false}'
```

---

## Database Quick Commands

### View All Services
```sql
SELECT s.id, s.service_name, s.price, s.is_available, s.status,
       sc.category_name, e.name as barber_name
FROM services s
LEFT JOIN service_categories sc ON s.category_id = sc.id
LEFT JOIN employees e ON s.barber_id = e.employee_id;
```

### View All Bookings
```sql
SELECT sb.id, s.service_name, sb.customer_name, sb.booking_date,
       sb.time_slot, sb.status, e.name as barber_name
FROM service_bookings sb
LEFT JOIN services s ON sb.service_id = s.id
LEFT JOIN employees e ON sb.barber_id = e.employee_id
ORDER BY sb.booking_date DESC;
```

### View Audit Logs for Services
```sql
SELECT * FROM audit_logs
WHERE entity_type = 'Service'
ORDER BY created_at DESC
LIMIT 10;
```

---

## File Locations

### Backend
- Controller: `backend/controllers/serviceController.js`
- Routes: `backend/routes/serviceRoutes.js`
- Schema: `backend/scripts/create_service_tables.sql`
- Middleware:
  - Auth: `backend/middleware/verifyToken.js`
  - Roles: `backend/middleware/roleMiddleware.js`
  - Audit: `backend/middleware/auditMiddleware.js`
  - Upload: `backend/middleware/uploadMiddleware.js`

### Frontend
- Service API: `frontend/src/services/serviceService.ts`
- Admin Pages:
  - Services: `frontend/src/pages/services/ServicesPage.tsx`
  - Categories: `frontend/src/pages/services/ServiceCategoriesPage.tsx`
- Customer Pages:
  - Listing: `frontend/src/pages/standalone/ServicesListingPage.tsx`
  - Booking: `frontend/src/pages/standalone/ServiceBookingPage.tsx`
- Routes: `frontend/src/components/DynamicRoutes.tsx`

---

## Troubleshooting

### Services Not Appearing on Customer Page
- Check service has `status = 'active'` AND `is_available = true`
- Verify API returns data: `GET /api/services/public`

### Cannot Create Service
- Ensure user has role_id 1 (Admin) or 2 (Barber)
- Check menu permission `/services/add` exists
- Verify JWT token is valid

### Image Upload Fails
- Check upload directory exists: `backend/uploads/services/`
- Verify file type (jpg, png, gif, webp)
- Max file size: Check multer limits in uploadMiddleware.js

### Booking Slots Not Showing
- Verify service exists and is available
- Check no existing bookings for same barber/date/slot
- Barber working hours default to 9AM-6PM

---

## Role Permissions

| Action | Admin (role_id=1) | Barber (role_id=2) | Customer |
|--------|-------------------|-------------------|----------|
| Create Service | ✅ | ✅ | ❌ |
| Edit Service | ✅ | ✅ (own) | ❌ |
| Delete Service | ✅ | ❌ | ❌ |
| Toggle Availability | ✅ | ✅ | ❌ |
| View All Services | ✅ | ✅ | ❌ |
| View Active Services | ✅ | ✅ | ✅ |
| Book Service | ✅ | ✅ | ✅ |

---

## Support

For detailed documentation, see: `SERVICE_MANAGEMENT_SYSTEM_SUMMARY.md`

For database schema, see: `backend/scripts/create_service_tables.sql`

For API documentation, examine: `backend/controllers/serviceController.js`
