const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database if needed
async function initializeDatabase() {
  try {
    // Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        state VARCHAR(255),
        district VARCHAR(255),
        block VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      )
    `);

    // Check if admin user exists
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@fraatlas.gov.in']);
    
    if (adminCheck.rows.length === 0) {
      // Create default users
      const users = [
        { id: '1', username: 'admin', email: 'admin@fraatlas.gov.in', password: 'admin123', role: 'admin' },
        { id: '2', username: 'testuser', email: 'test@example.com', password: 'testpass123', role: 'user' }
      ];

      for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        await pool.query(`
          INSERT INTO users (id, username, email, password_hash, role)
          VALUES ($1, $2, $3, $4, $5)
        `, [user.id, user.username, user.email, hashedPassword, user.role]);
      }
      console.log('✅ Default users created');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Login user
router.post('/login', async (req, res) => {
  try {
    // Initialize database on first login attempt
    await initializeDatabase();
    
    console.log('Login request received:', { email: req.body.email, hasPassword: !!req.body.password });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user in database
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('User found:', result.rows.length > 0);
    
    if (result.rows.length === 0) {
      console.log('User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    console.log('Login successful for:', user.email);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        state: user.state,
        district: user.district,
        block: user.block
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register user
router.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'state_admin', 'district_admin', 'block_admin', 'user'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role = 'user', state, district, block } = req.body;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await pool.query(`
      INSERT INTO users (id, username, email, password_hash, role, state, district, block)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, role, state, district, block
    `, [uuidv4(), username, email, hashedPassword, role, state, district, block]);

    const user = newUser.rows[0];

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        state: user.state,
        district: user.district,
        block: user.block
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    
    const result = await pool.query(
      'SELECT id, username, email, role, state, district, block, created_at, last_login FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;