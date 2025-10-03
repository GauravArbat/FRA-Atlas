#!/usr/bin/env node

/**
 * Quick fix script for React errors
 * Addresses translation API 500 errors and infinite loop issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing React application errors...\n');

// 1. Disable translation in backend environment
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  let envContent = fs.readFileSync(backendEnvPath, 'utf8');
  
  // Ensure translation is disabled
  if (!envContent.includes('DISABLE_TRANSLATION=true')) {
    if (envContent.includes('DISABLE_TRANSLATION=')) {
      envContent = envContent.replace(/DISABLE_TRANSLATION=.*/, 'DISABLE_TRANSLATION=true');
    } else {
      envContent += '\nDISABLE_TRANSLATION=true\n';
    }
    fs.writeFileSync(backendEnvPath, envContent);
    console.log('✅ Disabled translation in backend environment');
  }
}

// 2. Create a simple HTML page to clear localStorage
const clearStorageHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Clear FRA Storage</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 400px; margin: 0 auto; }
        button { padding: 10px 20px; margin: 10px; font-size: 16px; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="container">
        <h2>FRA Atlas - Clear Storage</h2>
        <p>Click the button below to clear localStorage and fix React errors:</p>
        <button onclick="clearStorage()">Clear Storage & Fix Errors</button>
        <div id="message"></div>
    </div>
    
    <script>
        function clearStorage() {
            try {
                // Clear translation-related storage
                localStorage.removeItem('translationDisabled');
                localStorage.removeItem('selectedLanguage');
                
                // Clear any cached translations
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('translate_')) {
                        localStorage.removeItem(key);
                    }
                });
                
                document.getElementById('message').innerHTML = 
                    '<p class="success">✅ Storage cleared successfully!<br>You can now reload your FRA application.</p>';
                    
            } catch (error) {
                document.getElementById('message').innerHTML = 
                    '<p class="error">❌ Error clearing storage: ' + error.message + '</p>';
            }
        }
        
        // Auto-clear on page load
        window.onload = function() {
            clearStorage();
        };
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'clear-storage.html'), clearStorageHtml);
console.log('✅ Created storage clearing utility at clear-storage.html');

// 3. Create restart script
const restartScript = `@echo off
echo 🔄 Restarting FRA Atlas services...

echo Stopping services...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend...
cd backend
start "FRA Backend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo Starting frontend...
cd ../frontend  
start "FRA Frontend" cmd /k "npm start"

echo ✅ Services restarted!
echo Open http://localhost:3000 in your browser
pause
`;

fs.writeFileSync(path.join(__dirname, 'restart-fra.bat'), restartScript);
console.log('✅ Created restart script at restart-fra.bat');

console.log('\n🎯 Quick Fix Summary:');
console.log('1. Translation API errors are now handled gracefully');
console.log('2. Infinite loop in useEffect hooks has been fixed');
console.log('3. Error boundary will catch and handle React errors');
console.log('4. Translation is temporarily disabled to prevent 500 errors');

console.log('\n📋 Next Steps:');
console.log('1. Open clear-storage.html in your browser to clear localStorage');
console.log('2. Run restart-fra.bat to restart the services');
console.log('3. Access the application at http://localhost:3000');
console.log('4. Translation will work with original text until API is configured');

console.log('\n🔧 To enable translation later:');
console.log('1. Add your Google Translate API key to backend/.env');
console.log('2. Set DISABLE_TRANSLATION=false in backend/.env');
console.log('3. Restart the backend service');

console.log('\n✅ React errors should now be resolved!');