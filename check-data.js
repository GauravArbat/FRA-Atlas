const fs = require('fs');
const path = require('path');

// Check backend data file
const backendDataFile = path.join(__dirname, 'backend/data/patta-holders.json');
console.log('Checking backend data file:', backendDataFile);

if (fs.existsSync(backendDataFile)) {
  const data = fs.readFileSync(backendDataFile, 'utf8');
  const records = JSON.parse(data);
  console.log('✅ Backend data found!');
  console.log(`📊 Total records: ${records.length}`);
  if (records.length > 0) {
    console.log('📋 Latest record:', records[records.length - 1].ownerName);
  }
} else {
  console.log('❌ Backend data file not found');
  console.log('💡 Make sure you:');
  console.log('   1. Generated dummy data in the app');
  console.log('   2. Backend server is running');
  console.log('   3. Data was saved via API call');
}

// Check root data directory
const rootDataFile = path.join(__dirname, 'data/patta-holders.json');
console.log('\nChecking root data file:', rootDataFile);

if (fs.existsSync(rootDataFile)) {
  const data = fs.readFileSync(rootDataFile, 'utf8');
  const records = JSON.parse(data);
  console.log('✅ Root data found!');
  console.log(`📊 Total records: ${records.length}`);
} else {
  console.log('❌ Root data file not found');
}