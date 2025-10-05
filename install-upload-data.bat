@echo off
echo Installing Upload Data dependencies...

cd frontend
npm install react-dropzone@14.2.3

echo.
echo Upload Data page has been created successfully!
echo.
echo Features included:
echo - Drag and drop file upload
echo - Auto OCR processing
echo - Data extraction and preview
echo - Save to database
echo - Plot on map
echo.
echo Navigate to /upload-data in the application to access the new page.
echo.
pause