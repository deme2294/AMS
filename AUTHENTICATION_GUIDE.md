# Ethiopian IT Park Management System - Authentication Guide

## System Status: WORKING CORRECTLY

### Server Configuration
- **Backend Server**: Running on `http://localhost:5006` 
- **Frontend Server**: Running on `http://localhost:3034`
- **Database**: Connected and operational
- **API Connection**: Fully functional

### Working User Credentials
The following user has been verified to work correctly:

#### Primary Test User
- **Username**: `nathan27`
- **Password**: `Astertamrat@9`
- **Status**: Active and tested successfully

### Available Users in Database
The system contains 118+ active users including:
- `nathan27` (ID: 83) - **VERIFIED WORKING**
- `test_admin` (ID: 84)
- `test_hr` (ID: 85)
- `test_leasing` (ID: 86)
- `test_content` (ID: 87)
- `test_event` (ID: 88)
- `hayal27` (ID: 82)
- And many more...

### Authentication Flow
1. **Frontend** sends login request to `http://localhost:3034/api/login`
2. **Vite Proxy** forwards to `http://localhost:5006/api/login`
3. **Backend** validates credentials against database
4. **Session Management** enforces single-session policy
5. **Response** returns success/failure with appropriate status codes

### Common Issues & Solutions

#### 1. "Network Error"
**Cause**: Port mismatch between frontend proxy and backend server
**Solution**: Both are now configured to use port 5006

#### 2. "Login Failed" 
**Cause**: Incorrect credentials or session conflict
**Solution**: Use correct credentials or clear existing session

#### 3. "Session Conflict"
**Cause**: User already has active session
**Solution**: 
- Use "Force Logout" option in frontend
- Or wait for session to expire (30 minutes)

### Security Features
- **Single Session Policy**: Only one active session per user
- **Account Lock**: After 5 failed attempts (15 minute lock)
- **Session Expiry**: 30 minutes of inactivity
- **Rate Limiting**: 30 login attempts per 15 minutes per IP

### Testing Authentication
```bash
# Test API directly
curl -X POST http://localhost:5006/api/login \
  -H "Content-Type: application/json" \
  -d '{"user_name":"nathan27","pass":"Astertamrat@9"}'
```

### Frontend Access
1. Open browser to: `http://localhost:3034`
2. Use credentials: `nathan27` / `Astertamrat@9`
3. System should authenticate successfully

### For Other Users
Each user has their own unique password. To test other users:
1. Check their password in the database (hashed)
2. Or use the "Forgot Password" feature to reset
3. Or create new test users with known passwords

### Admin Functions
- Session management
- User account creation
- Password reset capabilities
- Audit logging

## Status: READY FOR USE
The authentication system is fully functional and ready for user access.
