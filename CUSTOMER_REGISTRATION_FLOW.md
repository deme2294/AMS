# Customer Registration & Booking Flow

## Complete Workflow

```
Public Homepage (/)
        ↓
Customer clicks "Book Now"
        ↓
ServiceBookingPage checks auth
        ↓
Not authenticated? → Redirect to /register
        ↓
CustomerRegister displays form
        ↓
Submit → Account created (role=customer)
        ↓
Redirect to /login with success message
        ↓
LoginPage displays success + pre-filled email
        ↓
Customer logs in
        ↓
Redirect back to /services/book/:id
        ↓
Complete booking
```

---

## Pages & Routes

### 1. Public Homepage
- **Route**: `/`
- **File**: `PublicHomepage.tsx`
- **Purpose**: Display services publicly without authentication
- **Features**:
  - Browse all active services
  - Search and filter
  - "Book Now" button on each service
  - Register/Login buttons in header

### 2. Customer Registration (SEPARATE from Admin Login)
- **Route**: `/register`
- **File**: `CustomerRegister.tsx`
- **Purpose**: Customer-only registration
- **Design**: Clean, modern, customer-friendly (different from admin login)
- **Fields**:
  - Full Name
  - Email
  - Phone
  - Password
  - Confirm Password
- **Features**:
  - Form validation
  - Password strength check
  - Loading states
  - Success animation
  - Auto-redirect to login after 2 seconds

### 3. Login Page (EXISTING - Used by all)
- **Route**: `/login`
- **File**: `login.tsx`
- **Purpose**: Universal login for all roles
- **Updates**:
  - Displays success message when coming from registration
  - Pre-fills email from registration
  - Handles redirect to booking page after login

### 4. Service Booking
- **Route**: `/services/book/:serviceId`
- **File**: `ServiceBookingPage.tsx`
- **Purpose**: Book a specific service
- **Flow**:
  - Checks authentication on mount
  - Redirects to `/register` if not logged in
  - Pre-fills customer info if logged in

### 5. Customer Dashboard
- **Route**: `/customer/dashboard`
- **File**: `CustomerDashboard.tsx`
- **Purpose**: Customer account management
- **Features**:
  - View services
  - View appointments
  - Profile information

---

## Key Features

### Separate Registration Page
The customer registration page (`/register`) is completely different from the admin login page:
- Light, friendly design (vs dark admin login)
- Customer-focused branding
- Simple form with clear instructions
- Success animations

### Automatic Role Assignment
When customers register:
```javascript
role_id = 3 // Customer role
```

### Smart Redirects
1. Customer clicks "Book Now" → saves service ID → redirects to `/register`
2. After registration → redirects to `/login` with:
   - Success message
   - Pre-filled email
   - Original booking URL
3. After login → redirects back to booking page

---

## API Endpoints

### Registration
```
POST /api/register
Body: {
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+251911223344",
  "password": "password123"
}
Response: {
  "success": true,
  "message": "Account created successfully!",
  "user_id": 123
}
```

---

## Code Changes Summary

### Backend
1. **authRoutes.js** - Added `POST /register` endpoint
2. **authMiddleware.js** - Added `register` function import
3. **LoginModel.js** - Added `registerCustomer` function with:
   - Validation
   - Duplicate checking
   - Password hashing
   - Customer role assignment
   - Audit logging

### Frontend
1. **PublicHomepage.tsx** - Public services display with "Book Now"
2. **CustomerRegister.tsx** - Customer registration form
3. **CustomerDashboard.tsx** - Customer account dashboard
4. **ServiceBookingPage.tsx** - Updated to redirect to `/register` when not authenticated
5. **login.tsx** - Updated to:
   - Display success message from registration
   - Pre-fill email from registration
   - Handle string/object `from` parameter
   - Default redirect to `/customer/dashboard`
6. **StandaloneRouter.tsx** - Added new routes

---

## Testing the Flow

### Step 1: Visit Public Homepage
```
http://localhost:5173/
```
- See all active services
- No login required

### Step 2: Click "Book Now"
- Click on any service
- Redirects to `/register` (if not logged in)

### Step 3: Register Account
```
http://localhost:5173/register
```
- Fill form with:
  - Full Name: John Doe
  - Email: john@example.com
  - Phone: +251911223344
  - Password: password123
- Submit
- See success animation
- Auto-redirect to `/login` after 2 seconds

### Step 4: Login
```
http://localhost:5173/login
```
- See green success message
- Email pre-filled
- Enter password
- Click Login
- Redirected back to booking page

### Step 5: Complete Booking
- Select barber
- Select date
- Select time slot
- Add notes (optional)
- Submit booking

### Step 6: View Dashboard
```
http://localhost:5173/customer/dashboard
```
- View booking history
- Browse more services
- Manage profile

---

## Visual Differences

### Admin Login Page (`/panal`)
- Dark theme
- Professional/admin branding
- Complex security features
- Session conflict handling

### Customer Registration (`/register`)
- Light, friendly theme
- Customer-focused branding
- Simple, clean form
- Success animations

---

## Security

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting (30 requests per 15 min)
- Role-based access control
- Audit logging
- Form validation (client & server)

---

## Status: ✅ COMPLETE

The customer registration and booking flow is fully implemented with:
- ✅ Separate customer registration page
- ✅ Public service browsing
- ✅ Auth check before booking
- ✅ Redirect to registration when not logged in
- ✅ After registration → redirect to existing login page
- ✅ After login → redirect back to booking
- ✅ Customer dashboard

All components are connected and working!
