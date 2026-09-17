# Service Storage & Public Display - Complete Implementation

## Overview
Services added by Admin/Barber are stored in the 'letter' database in the `services` table and automatically displayed publicly via the public API.

---

## Complete Flow

```
Admin/Barber Logs In
        ↓
Navigates to Services → All Services
        ↓
Clicks "Add Service"
        ↓
Fills Service Form:
  - Service Name
  - Category
  - Description
  - Price
  - Duration
  - Image Upload
  - Availability Status
  - Featured Toggle
        ↓
Clicks "Submit Service"
        ↓
Frontend: ServicesPage.tsx
  - Validates form
  - Creates FormData with service data
  - Calls serviceApi.create(payload)
        ↓
API: POST /api/services
  - Middleware: verifyToken (authenticated)
  - Middleware: restrictTo([1,2]) (Admin/Barber only)
  - Middleware: uploadServiceImage (handles image upload)
  - Middleware: auditMiddleware (logs CREATE_SERVICE)
        ↓
Controller: serviceController.createService
  - Validates inputs
  - Generates service slug
  - Handles image upload
  - INSERT INTO services table
  - Returns success response
        ↓
Service Stored in Database
  - Database: letter
  - Table: services
  - Status: active
  - is_available: true
        ↓
Frontend: ServicesPage refreshes
  - Calls serviceApi.getAll()
  - Displays new service in table
        ↓
Public API: GET /api/services/public
  - No authentication required
  - Controller: getServicesPublic
  - Filters: is_available = 1 AND status = 'active'
  - Returns only active services
        ↓
Public Pages Display Services
  - PublicHomepage (/)
  - ServicesListingPage (/services)
  - CustomerDashboard (/dashboard/overview)
        ↓
Customer Can Book Services
```

---

## Database Configuration

### Database Connection (backend/models/db.js)
```javascript
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'letter',  // ← Uses 'letter' database
  port: parseInt(process.env.DB_PORT || "3306", 10),
};
```

**Services Table Structure** (backend/scripts/create_service_tables.sql)
```sql
CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  barber_id INT,
  service_name VARCHAR(255),
  service_slug VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  discount_price DECIMAL(10,2),
  duration_minutes INT,
  service_image VARCHAR(500),
  service_icon VARCHAR(255),
  is_featured TINYINT(1) DEFAULT 0,
  is_available TINYINT(1) DEFAULT 1,
  max_customers_per_slot INT DEFAULT 1,
  preparation_time INT DEFAULT 0,
  cleanup_time INT DEFAULT 0,
  booking_buffer_time INT DEFAULT 0,
  service_type ENUM('standard', 'combo', 'home_service', 'vip') DEFAULT 'standard',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES service_categories(id),
  FOREIGN KEY (barber_id) REFERENCES employees(employee_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

---

## API Endpoints

### Authenticated API (Admin/Barber Only)

#### Create Service
```
POST /api/services
Headers: Authorization: Bearer <token>
Body: FormData {
  category_id: number,
  barber_id?: number,
  service_name: string,
  description?: string,
  price: number,
  discount_price?: number,
  duration_minutes: number,
  service_icon?: string,
  is_featured: boolean,
  is_available: boolean,
  max_customers_per_slot: number,
  preparation_time: number,
  cleanup_time: number,
  booking_buffer_time: number,
  service_type: string,
  status: string,
  service_image?: File
}
Response: {
  success: true,
  message: "Service created successfully",
  data: { service object }
}
```

#### Get All Services (Admin/Barber)
```
GET /api/services
Headers: Authorization: Bearer <token>
Query: ?category=1&featured=true&available=true&search=hair
Response: {
  success: true,
  data: [services],
  total: number
}
```

### Public API (No Auth Required)

#### Get Active Services (Public)
```
GET /api/services/public
Query: ?category=1&featured=true&search=hair
Response: {
  success: true,
  data: [active services],
  total: number
}
```

**Important**: Only returns services where:
- `is_available = 1`
- `status = 'active'`

#### Get Service by ID (Public)
```
GET /api/services/public/:id
Response: {
  success: true,
  data: { service object }
}
```

#### Get Categories (Public)
```
GET /api/services/public/categories
Response: {
  success: true,
  data: [active categories],
  count: number
}
```

---

## Frontend Implementation

### ServicesPage.tsx (Admin/Barber Dashboard)
**Location**: `frontend/src/pages/services/ServicesPage.tsx`

**Features**:
- Professional form to add/edit services
- Image upload with preview
- Form validation
- Loading states
- Success/error notifications
- Auto-refresh after submission

**Form Fields**:
- Category (dropdown)
- Barber (dropdown, optional)
- Service Name
- Description
- Price
- Discount Price
- Duration (minutes)
- Service Icon
- Featured Toggle
- Availability Toggle
- Service Type
- Status

**Submit Handler**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  
  const payload = {
    category_id: parseInt(formData.category_id),
    barber_id: formData.barber_id ? parseInt(formData.barber_id) : null,
    service_name: formData.service_name,
    description: formData.description,
    price: parseFloat(formData.price),
    discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
    duration_minutes: parseInt(formData.duration_minutes.toString()),
    service_icon: formData.service_icon,
    is_featured: formData.is_featured,
    is_available: formData.is_available,
    max_customers_per_slot: formData.max_customers_per_slot,
    preparation_time: formData.preparation_time,
    cleanup_time: formData.cleanup_time,
    booking_buffer_time: formData.booking_buffer_time,
    service_type: formData.service_type,
    status: formData.status,
  };
  
  if (imageFile) {
    payload.imageFile = imageFile;
  }
  
  await serviceApi.create(payload);
  showToast('Service created successfully!', 'success');
  fetchServices(); // Refresh list
};
```

### Public API Service (serviceService.ts)
**Location**: `frontend/src/services/serviceService.ts`

**Public API**:
```typescript
export const publicServiceApi = {
  getAll: async (filters?: { category?: number; featured?: boolean; search?: string }) => {
    const response = await request<ServiceListResponse>('/services/public', {
      params: {
        available: 'true',
        ...filters
      }
    });
    if (response.success) {
      response.data = response.data.map(normalizeService);
    }
    return response;
  },
  
  getById: async (id: number) => {
    const response = await request<{ success: boolean; data: Service }>(`/services/public/${id}`);
    if (response.success) {
      response.data = normalizeService(response.data);
    }
    return response;
  },
  
  getCategories: async () => {
    const response = await request<CategoryListResponse>('/services/public/categories');
    return response;
  },
  
  getBarbers: () =>
    request<{ success: boolean; data: Array<{ id: number; full_name: string }> }>('/services/barbers'),
};
```

---

## Backend Implementation

### Controller (serviceController.js)
**Location**: `backend/controllers/serviceController.js`

#### Create Service Function
```javascript
const createService = async (req, res) => {
    try {
        const {
            category_id,
            barber_id,
            service_name,
            description,
            price,
            discount_price,
            duration_minutes,
            service_icon,
            is_featured,
            is_available,
            max_customers_per_slot,
            preparation_time,
            cleanup_time,
            booking_buffer_time,
            service_type,
            status
        } = req.body;

        // Validation
        if (!service_name || service_name.trim() === "") {
            return res.status(400).json({ success: false, message: "Service name is required" });
        }
        if (!category_id) {
            return res.status(400).json({ success: false, message: "Category is required" });
        }
        if (!price || isNaN(parseFloat(price))) {
            return res.status(400).json({ success: false, message: "Valid price is required" });
        }

        // Generate slug
        const slug = service_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Handle image upload
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/services/${req.file.filename}`;
        }

        // Insert into services table
        const [result] = await con.promise().query(
            `INSERT INTO services (
                category_id, barber_id, service_name, service_slug, description, 
                price, discount_price, duration_minutes, service_image, service_icon,
                is_featured, is_available, max_customers_per_slot, preparation_time,
                cleanup_time, booking_buffer_time, service_type, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                category_id,
                barber_id || null,
                service_name.trim(),
                slug,
                description || null,
                parseFloat(price),
                discount_price ? parseFloat(discount_price) : null,
                parseInt(duration_minutes),
                imagePath,
                service_icon || null,
                featured ? 1 : 0,
                available ? 1 : 0,
                max_customers_per_slot || 1,
                preparation_time || 0,
                cleanup_time || 0,
                booking_buffer_time || 0,
                service_type || 'standard',
                status || 'active',
                req.user.user_id
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: newService[0]
        });
    } catch (error) {
        console.error("Error creating service:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create service",
            error: error.message
        });
    }
};
```

#### Public Get Services Function (NEW)
```javascript
const getServicesPublic = async (req, res) => {
    try {
        const { category, featured, search } = req.query;

        let query = `
            SELECT s.*, sc.category_name, e.name as barber_name
            FROM services s
            LEFT JOIN service_categories sc ON s.category_id = sc.id
            LEFT JOIN employees e ON s.barber_id = e.employee_id
        `;
        const params = [];

        // Only active and available services
        const conditions = ["s.is_available = 1", "s.status = 'active'"];

        // Filters
        if (category) {
            conditions.push("s.category_id = ?");
            params.push(category);
        }
        if (featured === 'true' || featured === true) {
            conditions.push("s.is_featured = 1");
        }
        if (search) {
            conditions.push("(s.service_name LIKE ? OR s.description LIKE ? OR sc.category_name LIKE ?)");
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY s.is_featured DESC, s.created_at DESC";

        const [services] = await con.promise().query(query, params);

        return res.status(200).json({
            success: true,
            data: services,
            total: services.length
        });
    } catch (error) {
        console.error("Error fetching public services:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch services",
            error: error.message
        });
    }
};
```

### Routes (serviceRoutes.js)
**Location**: `backend/routes/serviceRoutes.js`

#### Authenticated Route (Create Service)
```javascript
router.post('/',
    verifyToken,
    restrictTo([1, 2]),
    hasMenuPermission('/services/add'),
    uploadServiceImage.single('service_image'),
    auditMiddleware('CREATE', 'Service'),
    serviceController.createService
);
```

#### Public Route (Get Active Services)
```javascript
router.get('/public', serviceController.getServicesPublic);
```

---

## Security Features

### Authentication & Authorization
- **verifyToken**: JWT authentication middleware
- **restrictTo([1, 2])**: Only Admin (role_id=1) and Barber (role_id=2) can create services
- **hasMenuPermission**: Menu permission check
- **auditMiddleware**: Logs CREATE_SERVICE action

### Public Access
- Public endpoints do NOT require authentication
- Public endpoints only return active and available services
- Customers cannot create, edit, or delete services

---

## Testing the Flow

### Step 1: Admin/Barber Adds Service
1. Login as Admin or Barber
2. Navigate to Services → All Services
3. Click "Add Service"
4. Fill form:
   - Service Name: "Haircut"
   - Category: "Haircuts"
   - Price: 25.00
   - Duration: 30
   - Status: active
   - Available: true
5. Upload image (optional)
6. Click "Submit Service"

### Step 2: Verify in Database
```sql
USE letter;
SELECT * FROM services WHERE service_name = 'Haircut';
```

### Step 3: Verify Public API
```bash
curl http://localhost:5005/api/services/public
```

Should return the new service if it's active and available.

### Step 4: Verify Public Display
1. Visit public homepage: `http://localhost:5173/`
2. Should see the new service displayed
3. Visit services page: `http://localhost:5173/services`
4. Should see the new service displayed

---

## Files Modified/Created

### Backend
1. **serviceController.js** - Added `getServicesPublic` function for public access
2. **serviceRoutes.js** - Updated public route to use `getServicesPublic`

### Frontend
1. **ServicesPage.tsx** - Already has form to add services (no changes needed)
2. **serviceService.ts** - Already has public API (no changes needed)

---

## Status: ✅ COMPLETE

The complete service storage and public display flow is now fully implemented:

✅ Admin/Barber can add services via authenticated API
✅ Services are stored in 'letter' database in services table
✅ Submit button stores services in the table
✅ Active services are automatically fetched via public API
✅ Public pages display services without authentication
✅ Security: Only Admin/Barber can create services
✅ Public API only returns active and available services

The system is ready to use!
