@echo off
echo 🚀 Pushing Atlas Access Changes...

git add .
git commit -m "feat: Equal Atlas access for admin, state_admin, and district_admin users

- Modified getMapConfigForUser() to give full India access to all admin roles
- Updated filterDataForUser() to show all FRA data to admin roles  
- Removed map bounds restrictions for admin/state_admin/district_admin
- All three users now have identical Atlas page functionality
- Added test script and documentation

Users affected:
- admin@fraatlas.gov.in (admin)
- state@mp.gov.in (state_admin) 
- tribal.bhopal@mp.gov.in (district_admin)"

git push origin main

echo ✅ Changes pushed successfully!
pause