const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const router = express.Router();

// Database connection with fallback
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} catch (error) {
  console.error('Database connection failed, using fallback auth');
  pool = null;
}

// Fallback users when database is not available
const fallbackUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@fraatlas.gov.in',
    password_hash: '$2a$12$mX0T3Mm.J1.ez2Q31.c0ZOkcEJdxjRpAg5ytJxIZhm5PsZ7vKbaGy',
    role: 'admin',
    state: null,
    district: null
  },
  {
    id: '2',
    username: 'state_mp',
    email: 'state@mp.gov.in',
    password_hash: '$2a$12$rQ/ww4ccjaJe5DEvD66lrepu5JRwn7DNd/reZFgq11BjbhF5Et556',
    role: 'state_admin',
    state: 'Madhya Pradesh',
    district: null
  },
  {
    id: '3',
    username: 'district_bhopal',
    email: 'tribal.bhopal@mp.gov.in',
    password_hash: '$2a$12$rQ/ww4ccjaJe5DEvD66lrepu5JRwn7DNd/reZFgq11BjbhF5Et556',
    role: 'district_admin',
    state: 'Madhya Pradesh',
    district: 'Bhopal'
  }
];

// Initialize database if needed
async function initializeDatabase() {
  if (!pool) return false;
  
  try {
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
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    let user = null;

    // Try database first
    if (pool) {
      try {
        await initializeDatabase();
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
          user = result.rows[0];
        }
      } catch (dbError) {
        console.log('Database error, using fallback:', dbError.message);
      }
    }

    // Fallback to hardcoded users
    if (!user) {
      user = fallbackUsers.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
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

    // Update last login (only if database is available)
    if (pool) {
      try {
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
      } catch (e) {
        console.log('Could not update last login:', e.message);
      }
    }

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