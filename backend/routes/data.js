// routes/data.js
import express from 'express';
import { getDatasetById, getDatasetData, getAllDatasets,deleteDataset } from '../services/dataService.js';

const router = express.Router();

// Get all datasets
router.get('/', async (req, res) => {
  try {
    const datasets = await getAllDatasets();
    res.json(datasets);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// Get dataset info
router.get('/:id', async (req, res) => {
  try {
    const dataset = await getDatasetById(req.params.id);
    res.json(dataset);
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(404).json({ error: 'Dataset not found' });
  }
});

// Get dataset data
router.get('/:id/data', async (req, res) => {
  try {
    const { page = 1, limit = 1000 } = req.query;
    const offset = (page - 1) * limit;
    
    const data = await getDatasetData(req.params.id);
    
    // Implement pagination
    const paginatedData = data.slice(offset, offset + parseInt(limit));
    
    res.json({
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.length,
        totalPages: Math.ceil(data.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching dataset data:', error);
    res.status(404).json({ error: 'Dataset data not found' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteDataset(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting dataset:', error);
    res.status(500).json({ error: 'Failed to delete dataset', details: error.message });
  }
});

export default router;