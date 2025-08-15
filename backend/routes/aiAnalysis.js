// routes/aiAnalysis.js
import express from 'express';
import aiAnalysisService from '../services/aiAnalysisService.js';
import pdfExportService from '../services/pdfExportService.js';

const router = express.Router();

// Generate new AI analysis
router.post('/:datasetId/generate', async (req, res) => {
  try {
    const { datasetId } = req.params;
    const { context } = req.body; // Expect a context object
    
    console.log(`🤖 Generating AI analysis for dataset ${datasetId}`);
    
    const analysis = await aiAnalysisService.generateAnalysis(datasetId, context);
    
    res.json({
      message: 'Analysis generated successfully',
      analysis
    });
  } catch (error) {
    console.error('Analysis generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate analysis', 
      details: error.message 
    });
  }
});

// Get specific analysis
router.get('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysis = await aiAnalysisService.getAnalysis(analysisId);
    res.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(404).json({ 
      error: 'Analysis not found', 
      details: error.message 
    });
  }
});

// Get all analyses for a dataset
router.get('/dataset/:datasetId', async (req, res) => {
  try {
    const { datasetId } = req.params;
    
    const analyses = await aiAnalysisService.getAllAnalyses(datasetId);
    res.json(analyses);
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analyses', 
      details: error.message 
    });
  }
});

// Update insight
router.put('/:analysisId/insight/:insightId', async (req, res) => {
  try {
    const { analysisId, insightId } = req.params;
    const { content } = req.body;
    
    const updatedContent = await aiAnalysisService.updateInsight(analysisId, insightId, content);
    
    res.json({
      message: 'Insight updated successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Update insight error:', error);
    res.status(500).json({ 
      error: 'Failed to update insight', 
      details: error.message 
    });
  }
});

// Delete insight
router.delete('/:analysisId/insight/:insightId', async (req, res) => {
  try {
    const { analysisId, insightId } = req.params;
    
    const updatedContent = await aiAnalysisService.deleteInsight(analysisId, insightId);
    
    res.json({
      message: 'Insight deleted successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Delete insight error:', error);
    res.status(500).json({ 
      error: 'Failed to delete insight', 
      details: error.message 
    });
  }
});

router.get('/:analysisId/export-pdf', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    console.log(`📄 Generating PDF report for analysis ${analysisId}`);
    
    const pdfBuffer = await pdfExportService.generateAnalysisReport(analysisId);
    
    // Get analysis info for filename
    const analysis = await aiAnalysisService.getAnalysis(analysisId);
    const filename = `${analysis.content.title.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-cache'
    });
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF report', 
      details: error.message 
    });
  }
});

export default router;