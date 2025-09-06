// Clear authentication data and force fresh login
console.log('🧹 Clearing authentication data...');

// Clear localStorage
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('✅ localStorage cleared');
} else {
  console.log('⚠️ localStorage not available (running in Node.js)');
}

// Clear sessionStorage
if (typeof sessionStorage !== 'undefined') {
  sessionStorage.clear();
  console.log('✅ sessionStorage cleared');
}

console.log('🎉 Authentication data cleared! Please refresh the page.');
