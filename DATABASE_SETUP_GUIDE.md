# 🗄️ FRA Database Setup Guide

## Quick Options to View Your Database:

### Option 1: Install PostgreSQL Locally
1. **Download:** https://www.postgresql.org/download/windows/
2. **Install with PostGIS extension**
3. **Run:** `.\view-database.bat`

### Option 2: Use Online Database (Easiest)
1. **Sign up:** https://neon.tech/ (Free PostgreSQL with PostGIS)
2. **Create project and get connection string**
3. **Update your .env file with the connection string**

### Option 3: Use pgAdmin (GUI Tool)
1. **Download:** https://www.pgadmin.org/download/pgadmin-4-windows/
2. **Connect to your database with:**
   - Host: localhost (or your cloud host)
   - Port: 5432
   - Database: fra_atlas
   - Username: fra_user
   - Password: fra_password

## After Setup - View Your Data:

### Command Line:
```bash
psql -U fra_user -d fra_atlas
```

### View Tables:
```sql
\dt
```

### View Sample Data:
```sql
SELECT * FROM fra_claims;
SELECT * FROM users;
SELECT * FROM documents;
```

### Count Records:
```sql
SELECT 
    (SELECT COUNT(*) FROM fra_claims) as total_claims,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM documents) as total_documents;
```

## Current Database Configuration:
- **Database:** fra_atlas
- **User:** fra_user
- **Password:** fra_password
- **Port:** 5432
- **Host:** localhost (or your cloud host)

## Sample Data Available:
- 3 sample FRA claims
- 2 sample users (admin accounts)
- Spatial data with coordinates
- Document management tables
- Audit trail system
