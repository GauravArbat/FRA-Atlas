#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 FRA Atlas Deployment Helper\n');

// Check if we're in the right directory
if (!fs.existsSync('frontend') || !fs.existsSync('backend')) {
  console.error('❌ Please run this script from the FRA project root directory');
  process.exit(1);
}

// Function to update environment files
function updateEnvFile(filePath, updates) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filePath} not found, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (content.match(regex)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated ${filePath}`);
}

// Get deployment URLs from user
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    console.log('Please provide your deployment URLs:\n');
    
    const railwayUrl = await askQuestion('Railway backend URL (e.g., https://your-app.railway.app): ');
    const netlifyUrl = await askQuestion('Netlify frontend URL (e.g., https://your-app.netlify.app): ');
    
    if (!railwayUrl || !netlifyUrl) {
      console.error('❌ Both URLs are required');
      process.exit(1);
    }
    
    console.log('\n🔧 Updating configuration files...\n');
    
    // Update frontend production env
    updateEnvFile('frontend/.env.production', {
      'REACT_APP_API_URL': `${railwayUrl}/api`
    });
    
    // Update netlify.toml
    const netlifyConfig = fs.readFileSync('frontend/netlify.toml', 'utf8');
    const updatedNetlifyConfig = netlifyConfig.replace(
      'REACT_APP_API_URL = "https://your-railway-app.railway.app/api"',
      `REACT_APP_API_URL = "${railwayUrl}/api"`
    );
    fs.writeFileSync('frontend/netlify.toml', updatedNetlifyConfig);
    console.log('✅ Updated frontend/netlify.toml');
    
    // Update backend production env
    updateEnvFile('backend/.env.production', {
      'FRONTEND_URL': netlifyUrl,
      'CORS_ORIGIN': netlifyUrl
    });
    
    console.log('\n🎉 Configuration updated successfully!');
    console.log('\nNext steps:');
    console.log('1. Commit and push your changes to GitHub');
    console.log('2. Deploy backend to Railway');
    console.log('3. Deploy frontend to Netlify');
    console.log('4. Set environment variables in both platforms');
    console.log('\nSee DEPLOYMENT.md for detailed instructions.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main();