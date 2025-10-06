const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Hardcoded users for demo (replace with database in production)
const users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@fraatlas.gov.in',
    password_hash: '$2a$12$LQv3c1yqBwEHFl5fvlHOUe.4nOtx.l0PoWEgbcLdrcLzC6U6Nm.Gy', // admin123
    role: 'admin'
  },
  {
    id: '2', 
    username: 'testuser',
    email: 'test@example.com',
    password_hash: '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // testpass123
    role: 'user'
  }
];

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register user (simplified)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password required' });
    }

    // Check if user exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = {
      id: String(users.length + 1),
      username,
      email,
      password_hash: hashedPassword,
      role
    };

    users.push(newUser);

    // Generate token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;