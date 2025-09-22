const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Mock authentication for testing without database
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Mock user validation
    if (email === 'admin@fraatlas.gov.in' && password === 'admin123') {
      const mockUser = {
        id: 'mock-admin-id',
        username: 'admin',
        email: 'admin@fraatlas.gov.in',
        role: 'admin',
        state: 'All India',
        district: '',
        block: ''
      };

      const token = jwt.sign(
        { userId: mockUser.id, role: mockUser.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        user: mockUser,
        token,
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Mock login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, state, district, block } = req.body;

    // Mock user creation
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      username,
      email,
      role: role || 'user',
      state: state || '',
      district: district || '',
      block: block || ''
    };

    const token = jwt.sign(
      { userId: mockUser.id, role: mockUser.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: mockUser,
      token,
    });
  } catch (error) {
    console.error('Mock registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req, res) => {
  try {
    // Mock user data
    const mockUser = {
      id: 'mock-admin-id',
      username: 'admin',
      email: 'admin@fraatlas.gov.in',
      role: 'admin',
      state: 'All India',
      district: '',
      block: '',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };

    res.json({ user: mockUser });
  } catch (error) {
    console.error('Mock get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (currentPassword === 'admin123' && newPassword.length >= 6) {
      res.json({ message: 'Password changed successfully' });
    } else {
      res.status(400).json({ error: 'Current password is incorrect' });
    }
  } catch (error) {
    console.error('Mock change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
