// Check if patta holders data exists
console.log('🔍 Checking patta holders data...');

// Check localStorage
const saved = localStorage.getItem('pattaHolders');
if (saved) {
  const data = JSON.parse(saved);
  console.log(`✅ Found ${data.length} patta holders in localStorage`);
} else {
  console.log('❌ No patta holders data in localStorage');
}

// Check backend API
fetch('/api/patta-holders')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Backend API response:', data);
  })
  .catch(e => {
    console.log('❌ Backend API failed:', e);
  });