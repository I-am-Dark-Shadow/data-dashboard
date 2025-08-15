// services/pdfExportService.js
import puppeteer from 'puppeteer';
import aiAnalysisService from './aiAnalysisService.js';
import { getDatasetById } from './dataService.js';

export class PDFExportService {
  async generateAnalysisReport(analysisId) {
    let browser;
    
    try {
      // Get analysis data
      const analysis = await aiAnalysisService.getAnalysis(analysisId);
      const dataset = await getDatasetById(analysis.dataset_id);
      
      // Launch puppeteer
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      
      // Generate HTML content
      const htmlContent = this.generateHTMLReport(analysis, dataset);
      
      // Set HTML content
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; margin-left: 20mm; margin-right: 20mm; width: 100%;">
            <span style="float: left;">${analysis.content.title}</span>
            <span style="float: right;">${new Date().toLocaleDateString()}</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; margin-left: 20mm; margin-right: 20mm; width: 100%; text-align: center;">
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `
      });
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new Error('Failed to generate PDF report');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  generateHTMLReport(analysis, dataset) {
    const { content } = analysis;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #ffffff;
          }
          
          .header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 3px solid #3B82F6;
            margin-bottom: 40px;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 10px;
          }
          
          .header-info {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            font-size: 14px;
            color: #6b7280;
          }
          
          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .executive-summary {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3B82F6;
          }
          
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .metric-card {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          
          .metric-label {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 5px;
            text-transform: uppercase;
            font-weight: 500;
          }
          
          .metric-value {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
          }
          
          .insight {
            margin-bottom: 25px;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            border-left: 4px solid #3B82F6;
            page-break-inside: avoid;
          }
          
          .insight-header {
            display: flex;
            align-items: center;
            justify-content: between;
            margin-bottom: 15px;
          }
          
          .insight-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          
          .insight-badges {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
          }
          
          .badge-high { background: #fef2f2; color: #dc2626; }
          .badge-medium { background: #fffbeb; color: #d97706; }
          .badge-low { background: #f0fdf4; color: #16a34a; }
          .badge-type { background: #dbeafe; color: #2563eb; }
          
          .insight-description {
            color: #4b5563;
            margin-bottom: 15px;
            line-height: 1.6;
          }
          
          .recommendation-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 15px;
            margin-top: 10px;
          }
          
          .recommendation-title {
            font-size: 14px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .recommendation-text {
            font-size: 14px;
            color: #1e40af;
            line-height: 1.5;
          }
          
          .pros-cons-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 20px;
          }
          
          .pros-cons-section h3 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .pros h3 { color: #059669; }
          .cons h3 { color: #dc2626; }
          
          .pros-cons-list {
            list-style: none;
          }
          
          .pros-cons-list li {
            margin-bottom: 10px;
            padding-left: 20px;
            position: relative;
            line-height: 1.5;
          }
          
          .pros-cons-list li::before {
            content: '';
            position: absolute;
            left: 0;
            top: 8px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
          }
          
          .pros li::before { background: #059669; }
          .cons li::before { background: #dc2626; }
          
          .recommendations-list {
            counter-reset: recommendation;
            list-style: none;
          }
          
          .recommendations-list li {
            counter-increment: recommendation;
            margin-bottom: 15px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #3B82F6;
            position: relative;
            padding-left: 50px;
            line-height: 1.6;
          }
          
          .recommendations-list li::before {
            content: counter(recommendation);
            position: absolute;
            left: 15px;
            top: 15px;
            width: 24px;
            height: 24px;
            background: #3B82F6;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
          }
          
          .chart-recommendations {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
          }
          
          .chart-recommendations h4 {
            color: #374151;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
          }
          
          .chart-item {
            margin-bottom: 15px;
            padding: 12px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          
          .chart-item h5 {
            color: #1f2937;
            margin-bottom: 5px;
            font-size: 14px;
            font-weight: 600;
          }
          
          .chart-item p {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.4;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          @media print {
            .section {
              page-break-inside: avoid;
            }
            
            .insight {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <h1>${content.title}</h1>
          <div class="header-info">
            <span><strong>Dataset:</strong> ${dataset.name}</span>
            <span><strong>Generated:</strong> ${new Date(analysis.created_at).toLocaleDateString()}</span>
            <span><strong>Rows:</strong> ${dataset.row_count?.toLocaleString()} | <strong>Columns:</strong> ${dataset.column_count}</span>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="section">
          <h2 class="section-title">Executive Summary</h2>
          <div class="executive-summary">
            <p>${content.summary}</p>
          </div>
        </div>

        <!-- Business Metrics -->
        ${content.businessMetrics && Object.keys(content.businessMetrics).length > 0 ? `
        <div class="section">
          <h2 class="section-title">Key Business Metrics</h2>
          <div class="metrics-grid">
            ${Object.entries(content.businessMetrics).map(([key, value]) => `
              <div class="metric-card">
                <div class="metric-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                <div class="metric-value">${value}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Key Insights -->
        <div class="section page-break">
          <h2 class="section-title">Key Business Insights</h2>
          ${content.insights?.map(insight => `
            <div class="insight">
              <div class="insight-header">
                <h3 class="insight-title">${insight.title}</h3>
              </div>
              <div class="insight-badges">
                <span class="badge badge-${insight.impact || 'medium'}">${(insight.impact || 'medium').toUpperCase()} Impact</span>
                <span class="badge badge-type">${(insight.type || 'insight').toUpperCase()}</span>
              </div>
              <div class="insight-description">
                ${insight.description}
              </div>
              ${insight.recommendation ? `
                <div class="recommendation-box">
                  <div class="recommendation-title">
                    💡 Recommendation
                  </div>
                  <div class="recommendation-text">${insight.recommendation}</div>
                </div>
              ` : ''}
            </div>
          `).join('') || '<p>No specific insights generated.</p>'}
        </div>

        <!-- Pros and Cons -->
        ${content.prosAndCons ? `
        <div class="section page-break">
          <h2 class="section-title">Strengths & Challenges Analysis</h2>
          <div class="pros-cons-grid">
            <div class="pros-cons-section pros">
              <h3>🚀 Strengths & Opportunities</h3>
              <ul class="pros-cons-list">
                ${content.prosAndCons.pros?.map(pro => `<li>${pro}</li>`).join('') || '<li>No specific strengths identified.</li>'}
              </ul>
            </div>
            <div class="pros-cons-section cons">
              <h3>⚠️ Challenges & Risks</h3>
              <ul class="pros-cons-list">
                ${content.prosAndCons.cons?.map(con => `<li>${con}</li>`).join('') || '<li>No specific challenges identified.</li>'}
              </ul>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Chart Recommendations -->
        ${content.charts && content.charts.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Recommended Visualizations</h2>
          <div class="chart-recommendations">
            <h4>AI-Suggested Charts for Data Exploration</h4>
            ${content.charts.map(chart => `
              <div class="chart-item">
                <h5>${chart.title} (${chart.type?.toUpperCase() || 'CHART'})</h5>
                <p><strong>Purpose:</strong> ${chart.description}</p>
                ${chart.insights ? `<p><strong>Key Insight:</strong> ${chart.insights}</p>` : ''}
                ${chart.xAxis && chart.yAxis ? `<p><strong>Axes:</strong> X: ${chart.xAxis}, Y: ${chart.yAxis}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Strategic Recommendations -->
        ${content.recommendations && content.recommendations.length > 0 ? `
        <div class="section page-break">
          <h2 class="section-title">Strategic Action Plan</h2>
          <ol class="recommendations-list">
            ${content.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ol>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="section" style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This report was generated automatically using AI analysis. All insights and recommendations should be validated with domain expertise.</p>
          <p style="margin-top: 10px;">Data Dashboard - AI-Powered Business Intelligence • ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;
  }
}

export default new PDFExportService();