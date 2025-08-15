import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import uploadRoutes from './routes/upload.js';
import dataRoutes from './routes/data.js';
import chartRoutes from './routes/charts.js';
import aiAnalysisRoutes from './routes/aiAnalysis.js';

// Import middleware
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- CORS Configuration ---
// This is the key change. We are setting up more detailed CORS options.
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: "GET,POST,PUT,DELETE", // Allow these HTTP methods
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Use CORS middleware with options *before* all your routes
app.use(cors(corsOptions));

// --- End CORS Configuration ---


app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard backend ready!`);
  console.log(`🤖 AI Analysis powered by Gemini`);
});

export default app;