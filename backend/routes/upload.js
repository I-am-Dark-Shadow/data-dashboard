// routes/upload.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { processFile } from '../services/fileProcessor.js';
import { storage } from '../config/cloudinary.js'; // Import Cloudinary storage

const router = express.Router();

// Configure multer for Cloudinary uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.xlsx', '.xls'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage, // Use Cloudinary storage
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload endpoint
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`☁️  Processing file from Cloudinary: ${req.file.originalname}`);

    // Process the uploaded file directly from the buffer
    const result = await processFile({
      originalname: req.file.originalname,
      buffer: req.file.buffer, // We will use the buffer instead of path
      size: req.file.size
    });

    res.json({
      message: 'File uploaded and processed successfully',
      datasetId: result.datasetId,
      summary: result.summary
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'File processing failed', 
      details: error.message 
    });
  }
});

export default router;