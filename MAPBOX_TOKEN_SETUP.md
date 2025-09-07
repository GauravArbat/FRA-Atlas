# Mapbox Token Setup - URGENT FIX NEEDED

## 🚨 Current Issue
Your FRA Atlas application is showing a **401 Unauthorized error** from Mapbox because the access token is invalid.

## ✅ Quick Fix

### Option 1: Get Your Own Free Mapbox Token (Recommended)
1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Sign up for a free account (if you don't have one)
3. Go to your [Access Tokens page](https://account.mapbox.com/access-tokens/)
4. Copy your **Default Public Token** (starts with `pk.eyJ...`)

### Option 2: Use a Working Public Token (Temporary)
Replace the token in `frontend/src/components/FRAInteractiveMap.tsx` line 50:

**Current (Invalid):**
```typescript
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
```

**Replace with:**
```typescript
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
```

### Option 3: Create .env File (Best Practice)
1. Create a file named `.env` in the `frontend` directory
2. Add this line:
```
REACT_APP_MAPBOX_TOKEN=YOUR_ACTUAL_TOKEN_HERE
```
3. Replace `YOUR_ACTUAL_TOKEN_HERE` with your real Mapbox token

## 🔄 After Making Changes
1. Save the file
2. Restart the development server:
   ```bash
   cd frontend
   npm start
   ```

## 🎯 Expected Result
- The map should load properly
- No more 401 Unauthorized errors
- Interactive area selection will work
- All map features will be functional

## 📞 Need Help?
If you need assistance getting a Mapbox token, I can help you through the process!
