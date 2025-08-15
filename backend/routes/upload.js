// routes/upload.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { processFile } from '../services/fileProcessor.js';
import { storage } from '../config/cloudinary.js';

const router = express.Router();

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
  storage: storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`☁️  Processing file from Cloudinary: ${req.file.originalname}`);

    // Pass the entire req.file object. It contains the path (URL) and other info.
    const result = await processFile(req.file);

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