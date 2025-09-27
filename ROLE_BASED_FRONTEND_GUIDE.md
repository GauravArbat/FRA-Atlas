# 🎭 Role-Based Frontend Implementation Guide

## 🎯 Overview

The FRA Atlas frontend now implements comprehensive role-based access control with different navigation menus and pages based on user roles.

## 👥 Role-Based Navigation

### 1. **Admin** (`admin@fraatlas.gov.in` / `admin123`)
**Navigation Menu:**
- Dashboard
- FRA Atlas
- Digital GIS Plot
- Data Management
- Decision Support
- Reports & Analytics
- User Settings

**Access:** Full system access to all features and pages

### 2. **MoTA Technical Team** (`tech@mota.gov.in` / `mota123`)
**Navigation Menu:**
- Dashboard
- Satellite Mapping
- AI Analysis
- Model Results
- Reports

**Access:** AI-based satellite mapping and analysis tools

### 3. **State Authorities** 
- **Madhya Pradesh:** `state@mp.gov.in` / `mp123`
- **Tripura:** `state@tripura.gov.in` / `tripura123`
- **Odisha:** `state@odisha.gov.in` / `odisha123`
- **Telangana:** `state@telangana.gov.in` / `telangana123`

**Navigation Menu:**
- Dashboard
- FRA Atlas
- Claims Review
- GIS Validation
- Reports

**Access:** State-level oversight and GIS validation

### 4. **District Tribal Welfare Department**
- **Bhopal (MP):** `tribal@bhopal.gov.in` / `bhopal123`
- **West Tripura:** `tribal@westtripura.gov.in` / `westtripura123`
- **Khordha (Odisha):** `tribal@khordha.gov.in` / `khordha123`
- **Hyderabad (Telangana):** `tribal@hyderabad.gov.in` / `hyderabad123`

**Navigation Menu:**
- Dashboard
- Legacy Upload
- Claims Processing
- OCR Review
- Reports

**Access:** District-level claim processing and legacy data management

### 5. **Beneficiaries/Claimants**
- **MP Beneficiary:** `beneficiary1@example.com` / `beneficiary123`
- **Tripura Beneficiary:** `beneficiary2@example.com` / `beneficiary123`

**Navigation Menu:**
- Dashboard
- Submit Claim
- Track Claims
- My Profile

**Access:** Submit and track own claims only

## 🔐 Access Control Implementation

### Frontend Components

#### 1. **RoleBasedRoute Component**
```typescript
<RoleBasedRoute allowedRoles={['admin', 'beneficiary']}>
  <SubmitClaim />
</RoleBasedRoute>
```

#### 2. **RoleBasedComponent Component**
```typescript
<RoleBasedComponent allowedRoles={['admin']} hideIfNoAccess>
  <AdminPanel />
</RoleBasedComponent>
```

#### 3. **AuthContext Integration**
```typescript
const { user, hasPermission } = useAuth();
if (user?.role === 'admin') {
  // Show admin features
}
```

## 🎨 Dynamic Sidebar

The sidebar automatically adapts based on user role:

### Sidebar Features:
- **Role-specific welcome message** showing user role and location
- **Dynamic menu items** based on permissions
- **Geographic context** (state/district) displayed
- **Role-appropriate icons** and styling

### Example Sidebar Content:
```
Welcome BENEFICIARY
Madhya Pradesh - Bhopal

My Claims
├── Dashboard
├── Submit Claim
├── Track Claims
└── My Profile
```

## 📱 Page-Level Access Control

### Route Protection Matrix:
| Page | Admin | MoTA Tech | State Auth | District | Beneficiary |
|------|-------|-----------|------------|----------|-------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| FRA Atlas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Submit Claim | ✅ | ❌ | ❌ | ❌ | ✅ |
| Track Claims | ✅ | ❌ | ❌ | ❌ | ✅ |
| AI Analysis | ✅ | ✅ | ❌ | ❌ | ❌ |
| Claims Review | ✅ | ❌ | ✅ | ❌ | ❌ |
| Legacy Upload | ✅ | ❌ | ❌ | ✅ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🔄 User Experience Flow

### Beneficiary Flow:
1. **Login** → Dashboard with claim statistics
2. **Submit Claim** → Form to submit new FRA claim
3. **Track Claims** → Search and view claim status
4. **Profile** → Update personal information

### District Officer Flow:
1. **Login** → Dashboard with district statistics
2. **Legacy Upload** → Upload old FRA records
3. **Claims Processing** → Review and approve claims
4. **OCR Review** → Review digitized documents
5. **Reports** → Generate district reports

### State Authority Flow:
1. **Login** → Dashboard with state overview
2. **Claims Review** → Review district approvals
3. **GIS Validation** → Validate boundaries
4. **Reports** → State-level analytics

### MoTA Technical Flow:
1. **Login** → Dashboard with AI analysis overview
2. **Satellite Mapping** → View satellite data
3. **AI Analysis** → Run ML models
4. **Model Results** → Review AI outputs

## 🎯 Key Features

### ✅ **Dynamic Navigation**
- Menu items change based on user role
- Geographic context displayed
- Role-appropriate welcome messages

### ✅ **Access Control**
- Route-level protection
- Component-level hiding
- Permission-based rendering

### ✅ **User Context**
- Role information always available
- Geographic scope enforcement
- Personalized experience

### ✅ **Security**
- JWT token validation
- Role verification on every request
- Automatic logout on token expiry

## 🚀 Testing Role-Based Access

### Test Steps:
1. **Start the application:**
   ```bash
   cd frontend && npm start
   cd backend && npm run dev
   ```

2. **Login with different roles:**
   - Admin: `admin@fraatlas.gov.in` / `admin123`
   - Beneficiary: `beneficiary1@example.com` / `beneficiary123`
   - District: `tribal@bhopal.gov.in` / `bhopal123`
   - State: `state@mp.gov.in` / `mp123`
   - MoTA: `tech@mota.gov.in` / `mota123`

3. **Observe different experiences:**
   - Different sidebar menus
   - Different available pages
   - Role-specific welcome messages
   - Geographic context display

### Expected Results:
- **Admin:** Sees all menu items and pages
- **Beneficiary:** Only sees claim-related options
- **District:** Sees upload and processing options
- **State:** Sees review and validation options
- **MoTA:** Sees AI and analysis options

## 🔧 Customization

### Adding New Roles:
1. Update `AuthContext.tsx` interface
2. Add role to `getMenuItemsByRole()` in `Sidebar.tsx`
3. Create role-specific routes in `App.tsx`
4. Update backend role constraints

### Adding New Pages:
1. Create new page component
2. Add route with `RoleBasedRoute` wrapper
3. Add menu item to appropriate role in sidebar
4. Implement backend API endpoints

## 🎉 System Status: ROLE-BASED FRONTEND COMPLETE

The FRA Atlas frontend now provides:
- ✅ **Complete role-based navigation** with 5 distinct user experiences
- ✅ **Dynamic sidebar** that adapts to user role and location
- ✅ **Route-level protection** preventing unauthorized access
- ✅ **Component-level access control** for granular permissions
- ✅ **Geographic context** display for location-based roles
- ✅ **Seamless user experience** with role-appropriate interfaces

**Ready for production with full role-based access control!**