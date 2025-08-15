// routes/charts.js
import express from 'express';
import { getDatasetData } from '../services/dataService.js';
import { generateChartData } from '../services/chartService.js';

const router = express.Router();

// Get chart data
router.get('/:datasetId/:chartType', async (req, res) => {
  try {
    const { datasetId, chartType } = req.params;
    const { xAxis, yAxis, filters = {} } = req.query;
    
    const rawData = await getDatasetData(datasetId);
    
    // Apply filters
    let filteredData = rawData;
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filteredData = filteredData.filter(row => 
          String(row[key]).toLowerCase().includes(String(value).toLowerCase())
        );
      }
    });
    
    const chartData = generateChartData(filteredData, chartType, xAxis, yAxis);
    
    res.json(chartData);
  } catch (error) {
    console.error('Error generating chart data:', error);
    res.status(500).json({ error: 'Failed to generate chart data' });
  }
});

export default router;