# Services Module - Verification Guide

## Changes Made to the System

### 1. Database Changes
- Added "Add Service" menu item (id=103) under Services section
- Path: /service-submission
- Granted permissions to Admin and Barber roles

### 2. Files Created
- backend/scripts/add-add-service-menu.js (menu creation script)
- backend/scripts/fix-menu-parent.js (menu structure fix)
- backend/scripts/verify-services-menu.js (verification script)
- SERVICES_MODULE_SUMMARY.md (documentation)

========================================
VERIFICATION METHODS
========================================

## Method 1: Database Verification (Run this script)
Location: backend/scripts/verify-services-menu.js
Command: node scripts/verify-services-menu.js

## Method 2: Check Menu in Database Directly
Command: 
  mysql -u root -p letter -e "SELECT * FROM cms_menus WHERE path = '/service-submission';"

## Method 3: Check Permissions
Command:
  mysql -u root -p letter -e "SELECT * FROM role_menu_permissions WHERE menu_id = 103;"

## Method 4: Frontend Visual Verification
1. Start backend: cd backend && npm start
2. Start frontend: cd frontend && npm run dev
3. Open browser: http://localhost:3034
4. Login as Admin
5. Check sidebar: Services -> Add Service (should be visible)

## Method 5: API Endpoint Test
Test authenticated endpoint:
  curl -X GET http://localhost:5005/api/services ^
    -H "Cookie: your-auth-cookie"

Test public endpoint:
  curl http://localhost:5005/api/services/public

## Method 6: Test Service Submission
1. Navigate to: http://localhost:3034/service-submission
2. Fill the form
3. Click "Submit Service to Database"
4. Check database: SELECT * FROM services ORDER BY created_at DESC LIMIT 1;

## Method 7: Check Audit Logs
After submitting a service, verify it was logged:
  mysql -u root -p letter -e "SELECT * FROM audit_logs WHERE action = 'CREATE' AND entity_type = 'Service' ORDER BY created_at DESC LIMIT 1;"

========================================
QUICK VERIFICATION COMMANDS
========================================

# Check if menu exists
node -e "const mysql=require('mysql2/promise'); (async ()=>{ const c=await mysql.createConnection({host:'localhost',user:'root',password:'',database:'letter'}); const [r]=await c.query(\"SELECT id,title,path FROM cms_menus WHERE path='/service-submission'\"); console.log(r); await c.end(); })();"

# Check permissions
node -e "const mysql=require('mysql2/promise'); (async ()=>{ const c=await mysql.createConnection({host:'localhost',user:'root',password:'',database:'letter'}); const [r]=await c.query(\"SELECT rm.menu_id, r.role_name FROM role_menu_permissions rm JOIN roles r ON rm.role_id=r.role_id WHERE rm.menu_id=103\"); console.log(r); await c.end(); })();"

# Check recent services
node -e "const mysql=require('mysql2/promise'); (async ()=>{ const c=await mysql.createConnection({host:'localhost',user:'root',password:'',database:'letter'}); const [r]=await c.query(\"SELECT id,service_name,price,is_available,status,created_at FROM services ORDER BY created_at DESC LIMIT 5\"); console.log(r); await c.end(); })();"

========================================
TROUBLESHOOTING
========================================

If "Add Service" menu doesn't appear:
1. Refresh browser (Ctrl+F5)
2. Clear browser cache
3. Logout and login again
4. Check if menu is active: SELECT is_active FROM cms_menus WHERE path='/service-submission';

If permission denied:
1. Verify user role: SELECT role_id FROM users WHERE user_name='your-username';
2. Verify permissions: SELECT * FROM role_menu_permissions WHERE menu_id=103;
3. Re-run: node scripts/add-add-service-menu.js

If API returns 401:
1. Check if logged in
2. Verify cookies are being sent
3. Check token expiration

========================================
EXPECTED RESULTS
========================================

✓ Menu item "Add Service" exists with id=103
✓ Parent is Services section (id=100)
✓ Path is /service-submission
✓ Admin role has permission
✓ Barber role has permission
✓ Menu is active (is_active=1)
✓ ServicesPage has "Add Service" button
✓ ServiceSubmissionPage loads at /service-submission
✓ POST /api/services accepts authenticated requests
✓ GET /api/services/public returns active services

