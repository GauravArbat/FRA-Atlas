const bcrypt = require('bcryptjs');

async function generateHash() {
  const password1 = await bcrypt.hash('admin123', 12);
  const password2 = await bcrypt.hash('testpass123', 12);
  
  console.log('admin123 hash:', password1);
  console.log('testpass123 hash:', password2);
}

generateHash();