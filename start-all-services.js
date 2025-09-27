#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌳 Starting FRA Atlas - All Services');
console.log('=====================================');

// Check if required directories exist
const requiredDirs = ['uploads', 'processed', 'logs', 'backups'];
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Function to run command and return promise
function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} in ${cwd}`);
    const child = exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error in ${command}:`, error.message);
        reject(error);
      } else {
        console.log(`✅ Completed: ${command}`);
        resolve(stdout);
      }
    });
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

// Function to install dependencies
async function installDependencies() {
  console.log('\n📦 Installing Dependencies...');
  
  try {
    // Install root dependencies
    if (fs.existsSync('package.json')) {
      await runCommand('npm install');
    }
    
    // Install backend dependencies
    if (fs.existsSync('backend/package.json')) {
      await runCommand('npm install', 'backend');
    }
    
    // Install frontend dependencies
    if (fs.existsSync('frontend/package.json')) {
      await runCommand('npm install', 'frontend');
    }
    
    console.log('✅ All dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    throw error;
  }
}

// Function to setup database
async function setupDatabase() {
  console.log('\n🗄️ Setting up Database...');
  
  try {
    if (fs.existsSync('setup-database.js')) {
      await runCommand('node setup-database.js');
    } else {
      console.log('⚠️ Database setup script not found, skipping...');
    }
  } catch (error) {
    console.log('⚠️ Database setup failed (continuing with mock mode):', error.message);
  }
}

// Function to start services
function startServices() {
  console.log('\n🚀 Starting Services...');
  
  const services = [];
  
  // Start backend
  if (fs.existsSync('backend/src/server.js')) {
    console.log('🔧 Starting Backend Server...');
    const backend = spawn('node', ['src/server.js'], {
      cwd: 'backend',
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    services.push({ name: 'Backend', process: backend });
  }
  
  // Start frontend (with delay)
  if (fs.existsSync('frontend/package.json')) {
    setTimeout(() => {
      console.log('🎨 Starting Frontend Server...');
      const frontend = spawn('npm', ['start'], {
        cwd: 'frontend',
        stdio: 'inherit',
        shell: true
      });
      services.push({ name: 'Frontend', process: frontend });
    }, 3000);
  }
  
  // Start data processor if available
  if (fs.existsSync('data-processor/main.py')) {
    setTimeout(() => {
      console.log('🐍 Starting Data Processor...');
      const dataProcessor = spawn('python', ['main.py'], {
        cwd: 'data-processor',
        stdio: 'inherit'
      });
      services.push({ name: 'Data Processor', process: dataProcessor });
    }, 5000);
  }
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down services...');
    services.forEach(service => {
      console.log(`Stopping ${service.name}...`);
      service.process.kill('SIGINT');
    });
    process.exit(0);
  });
  
  return services;
}

// Main execution
async function main() {
  try {
    await installDependencies();
    await setupDatabase();
    
    const services = startServices();
    
    console.log('\n🎉 FRA Atlas Started Successfully!');
    console.log('==================================');
    console.log('📊 Frontend: http://localhost:3000');
    console.log('🔧 Backend API: http://localhost:8000');
    console.log('🐍 Data Processor: http://localhost:8001');
    console.log('\n📋 Default Login Credentials:');
    console.log('   Email: admin@fraatlas.gov.in');
    console.log('   Password: admin123');
    console.log('\n⚡ Press Ctrl+C to stop all services');
    
  } catch (error) {
    console.error('❌ Failed to start FRA Atlas:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { main, installDependencies, setupDatabase, startServices };