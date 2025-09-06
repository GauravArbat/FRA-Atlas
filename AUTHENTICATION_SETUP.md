# 🔐 FRA Atlas Authentication Setup Guide

## ✅ What's Been Implemented

### **Backend Authentication (Node.js/Express)**
- ✅ **User Registration** (`/api/auth/register`)
- ✅ **User Login** (`/api/auth/login`)
- ✅ **JWT Token Authentication**
- ✅ **Password Hashing** (bcrypt)
- ✅ **Role-based Access Control** (admin, state_admin, district_admin, block_admin, user)
- ✅ **Protected Routes** with middleware
- ✅ **User Profile** (`/api/auth/me`)
- ✅ **Password Change** (`/api/auth/change-password`)

### **Frontend Authentication (React/TypeScript)**
- ✅ **Login Page** with form validation
- ✅ **Signup Page** with role selection
- ✅ **Redux State Management** for auth
- ✅ **Protected Routes** based on authentication
- ✅ **Auto-login** after successful signup
- ✅ **Token Storage** in localStorage

### **Database Integration**
- ✅ **PostgreSQL Schema** with users table
- ✅ **PostGIS Extension** for spatial data
- ✅ **Sample Data** with admin user
- ✅ **Database Setup Script** (`setup-database.js`)

## 🚀 Quick Setup Instructions

### **1. Database Setup**
```bash
# Run the database setup script
node setup-database.js
```

### **2. Start the Application**
```bash
# Start backend
cd backend
npm install
npm run dev

# Start frontend (in another terminal)
cd frontend
npm install
npm start
```

### **3. Test Authentication**
```bash
# Run authentication tests
node test-auth.js
```

## 🔑 Default Login Credentials

### **Admin Account**
- **Email:** `admin@fraatlas.gov.in`
- **Password:** `admin123`
- **Role:** `admin`

### **Test User Account**
- **Email:** `test@example.com`
- **Password:** `testpass123`
- **Role:** `user`

## 📋 User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | System Administrator | Full access to all features |
| `state_admin` | State Level Admin | Access to state-level data |
| `district_admin` | District Level Admin | Access to district-level data |
| `block_admin` | Block Level Admin | Access to block-level data |
| `user` | Regular User | Basic access to assigned data |

## 🛠️ API Endpoints

### **Authentication Endpoints**
```http
POST /api/auth/register    # Register new user
POST /api/auth/login       # User login
GET  /api/auth/me          # Get current user
POST /api/auth/change-password  # Change password
```

### **Protected Endpoints** (Require Authentication)
```http
GET  /api/data/*           # Data management
GET  /api/decisions/*      # Decision support
GET  /api/reports/*        # Reports and analytics
POST /api/digitization/*   # Document processing
```

### **Public Endpoints** (No Authentication Required)
```http
GET  /api/fra/atlas/*      # FRA Atlas data
GET  /api/proxy/*          # Tile proxy
GET  /health               # Health check
```

## 🔧 Configuration

### **Environment Variables**
```env
# Database
DATABASE_URL=postgresql://fra_user:fra_password@localhost:5432/fra_atlas

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Application
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000
```

## 🧪 Testing Authentication

### **Manual Testing**
1. **Register a new user:**
   - Go to `http://localhost:3000/signup`
   - Fill in the form and submit
   - Should auto-login after successful registration

2. **Login with existing user:**
   - Go to `http://localhost:3000/login`
   - Use admin credentials or your registered account

3. **Test protected routes:**
   - Try accessing `/dashboard` without login (should redirect to login)
   - Login and access protected pages

### **API Testing**
```bash
# Test registration
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "role": "user",
    "state": "Maharashtra"
  }'

# Test login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fraatlas.gov.in",
    "password": "admin123"
  }'

# Test protected route
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Features

### **Password Security**
- ✅ **bcrypt hashing** with salt rounds (12)
- ✅ **Minimum password length** (6 characters)
- ✅ **Password confirmation** on signup

### **Token Security**
- ✅ **JWT tokens** with expiration (24h)
- ✅ **Secure token storage** in localStorage
- ✅ **Token validation** on protected routes

### **Input Validation**
- ✅ **Email validation** and normalization
- ✅ **Username validation** (min 3 characters)
- ✅ **Role validation** against allowed roles
- ✅ **SQL injection protection** with parameterized queries

### **Access Control**
- ✅ **Role-based permissions**
- ✅ **Route protection** middleware
- ✅ **User status checking** (active/inactive)

## 🐛 Troubleshooting

### **Common Issues**

1. **Database Connection Error**
   ```bash
   # Check if PostgreSQL is running
   # Run database setup script
   node setup-database.js
   ```

2. **JWT Token Error**
   ```bash
   # Check JWT_SECRET in .env file
   # Clear localStorage and login again
   ```

3. **CORS Error**
   ```bash
   # Check FRONTEND_URL in .env file
   # Ensure frontend is running on correct port
   ```

4. **User Already Exists**
   ```bash
   # Use different email/username
   # Or login with existing credentials
   ```

## 📱 Frontend Routes

### **Public Routes**
- `/login` - Login page
- `/signup` - Registration page

### **Protected Routes** (Require Authentication)
- `/` - Dashboard
- `/atlas` - FRA Atlas
- `/data` - Data Management
- `/decisions` - Decision Support
- `/reports` - Reports
- `/settings` - Settings

## 🎯 Next Steps

1. **Test the authentication system**
2. **Create additional user accounts**
3. **Test role-based permissions**
4. **Integrate with FRA data management**
5. **Add user profile management**
6. **Implement password reset functionality**

## 📞 Support

If you encounter any issues:
1. Check the console logs for errors
2. Verify database connection
3. Ensure all environment variables are set
4. Run the test script: `node test-auth.js`
