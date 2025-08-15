import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import uploadRoutes from './routes/upload.js';
import dataRoutes from './routes/data.js';
import chartRoutes from './routes/charts.js';
import aiAnalysisRoutes from './routes/aiAnalysis.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});
app.use('/api/upload', uploadRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
