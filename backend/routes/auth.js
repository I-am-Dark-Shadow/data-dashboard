// routes/auth.js
import express from 'express';
import connectToDatabase from '../config/database.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ username });

    // In a real app, you would compare a hashed password
    if (user && user.password === password) {
      res.json({
        message: 'Login successful',
        user: {
          username: user.username,
          name: user.name
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;