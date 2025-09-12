const fs = require('fs');
const path = require('path');

console.log('🔧 Optimizing build for production...');

// Create .env.production if it doesn't exist
const envProdPath = '.env.production';
if (!fs.existsSync(envProdPath)) {
  const envContent = `# Production Environment Variables
REACT_APP_API_URL=https://your-railway-app.railway.app/api
GENERATE_SOURCEMAP=false
CI=false
`;
  fs.writeFileSync(envProdPath, envContent);
  console.log('✅ Created .env.production');
}

// Update package.json build script for optimization
const packageJsonPath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.scripts['build:prod']) {
  packageJson.scripts['build:prod'] = 'GENERATE_SOURCEMAP=false npm run build';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added optimized build script');
}

console.log('🎉 Build optimization complete!');
console.log('Use "npm run build:prod" for optimized production builds');