// services/aiAnalysisService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectToDatabase from '../config/database.js';
import { ObjectId } from 'mongodb';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getDb() {
    return await connectToDatabase();
}

export class AIAnalysisService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateAnalysis(datasetId, context) {
    try {
      const dataset = await this.getDatasetForAnalysis(datasetId);
      const analysis = await this.callGeminiAPI(dataset, context);
      const analysisId = await this.saveAnalysis(datasetId, analysis, context);
      return await this.getAnalysis(analysisId);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to generate AI analysis');
    }
  }

  async getDatasetForAnalysis(datasetId) {
    const db = await getDb();
    const datasetInfo = await db.collection('datasets').findOne({ _id: new ObjectId(datasetId) });
    if (!datasetInfo) throw new Error('Dataset not found');
    const columns = await db.collection('dataset_columns').find({ dataset_id: new ObjectId(datasetId) }).toArray();
    const dataRows = await db.collection('dataset_rows').find({ dataset_id: new ObjectId(datasetId) }).sort({ row_index: 1 }).limit(100).toArray();
    const sampleData = dataRows.map(row => row.row_data);
    return { info: datasetInfo, columns, sampleData, totalRows: datasetInfo.row_count };
  }

  async callGeminiAPI(dataset, context) {
    const prompt = this.buildProfessionalPrompt(dataset, context);
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    return this.parseAnalysisResponse(analysisText);
  }

  buildProfessionalPrompt(dataset, context) {
    const { info, columns, sampleData } = dataset;
    const { datasetType, department, analysisNeeds } = context;

    const columnInfo = columns.map(col => `${col.column_name} (${col.column_type})`).join(', ');
    const sampleDataText = JSON.stringify(sampleData.slice(0, 5), null, 2);

    return `
      Act as a professional data analyst with expertise in the ${datasetType} industry, preparing a report for the ${department} department.
      Your goal is to provide a comprehensive, actionable, and insightful analysis of the following dataset.
      **Dataset Details:**
      - **Name:** ${info.name}
      - **Columns:** ${columnInfo}
      - **Total Rows:** ${info.row_count}
      - **Sample Data:** ${sampleDataText}
      **Analysis Focus:**
      Your analysis should specifically focus on: ${analysisNeeds.join(', ')}.
      **Task:**
      Generate a detailed business analysis report in the following JSON format. The tone should be professional, and the insights must be directly relevant to a ${department} professional in the ${datasetType} sector.
      **Required JSON Structure:**
      {
        "title": "Professional Analysis for the ${department} Department",
        "summary": "A concise executive summary of the most critical findings, tailored for management.",
        "insights": [
          {
            "id": "insight_1",
            "title": "Key Finding Title",
            "description": "A detailed explanation of the insight, supported by data. Explain 'why' this is significant.",
            "type": "opportunity|risk|trend|performance",
            "impact": "high|medium|low",
            "recommendation": "A specific, actionable recommendation based on this insight for the ${department} team."
          }
        ],
        "charts": [],
        "businessMetrics": {},
        "prosAndCons": { "pros": [], "cons": [] },
        "recommendations": []
      }
      **Instructions:**
      - Provide at least 5 detailed insights.
      - Ensure all text is professional and directly useful to your audience.
      - The entire response MUST be a single, valid JSON object. Do not include any text, conversational filler, or markdown formatting before or after the JSON.
    `;
  }
  
  parseAnalysisResponse(analysisText) {
    try {
      let jsonStr = analysisText;
      const markdownMatch = analysisText.match(/```json\n([\s\S]*)\n```/);
      if (markdownMatch && markdownMatch[1]) {
        jsonStr = markdownMatch[1];
      } else {
         const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
         if (!jsonMatch) {
            throw new Error('No JSON found in response');
         }
         jsonStr = jsonMatch[0];
      }
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return { title: "Analysis Report", summary: "Analysis completed successfully, but there was an issue parsing the detailed insights.", insights: [], charts: [], businessMetrics: {}, prosAndCons: { pros: [], cons: [] }, recommendations: [] };
    }
  }

  async saveAnalysis(datasetId, analysis, customPrompt) {
    const db = await getDb();
    const result = await db.collection('ai_analyses').insertOne({
      dataset_id: new ObjectId(datasetId),
      title: analysis.title,
      content: analysis,
      custom_prompt: JSON.stringify(customPrompt),
      status: 'completed',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return result.insertedId;
  }
  
  async getAnalysis(analysisId) {
    const db = await getDb();
    const analysis = await db.collection('ai_analyses').findOne({ _id: new ObjectId(analysisId) });
    if (!analysis) throw new Error('Analysis not found');
    analysis.id = analysis._id;
    delete analysis._id;
    return analysis;
  }

  async getAllAnalyses(datasetId) {
    const db = await getDb();
    const analyses = await db.collection('ai_analyses').find(
        { dataset_id: new ObjectId(datasetId) },
        { projection: { id: '$_id', title: 1, created_at: 1, updated_at: 1, status: 1 } }
    ).sort({ created_at: -1 }).toArray();
    return analyses.map(a => {
        a.id = a._id;
        delete a._id;
        return a;
    })
  }

  // RE-ADDED AND UPDATED THIS FUNCTION
  async updateInsight(analysisId, insightId, newContent) {
    const db = await getDb();
    const analysis = await this.getAnalysis(analysisId);
    
    const insightIndex = analysis.content.insights.findIndex(insight => insight.id === insightId);
    if (insightIndex !== -1) {
      const newAnalysis = await this.generateCustomInsight(newContent, analysis.dataset_id);
      
      // Replace the old insight with the new, more detailed one
      analysis.content.insights[insightIndex] = {
        ...newAnalysis, // newAnalysis should return the full insight structure
        id: insightId, // Keep the original ID
        title: newContent, // Use the user's question as the new title
      };
    }
    
    await db.collection('ai_analyses').updateOne(
        { _id: new ObjectId(analysisId) },
        { $set: { content: analysis.content, updated_at: new Date() } }
    );
    
    return analysis.content;
  }

  // RE-ADDED AND UPDATED THIS HELPER FUNCTION
  async generateCustomInsight(prompt, datasetId) {
    const dataset = await this.getDatasetForAnalysis(datasetId);
    const customPrompt = `
      Based on the provided dataset, act as a professional data analyst and answer the following question: "${prompt}"

      **Dataset Information:**
      - **Columns:** ${dataset.columns.map(c => c.column_name).join(', ')}
      - **Sample Data:** ${JSON.stringify(dataset.sampleData.slice(0, 3), null, 2)}

      Provide a detailed response in the following JSON format. The response should be a single insight object.

      **Required JSON Structure:**
      {
        "description": "A detailed, data-driven answer to the question.",
        "type": "opportunity|risk|trend|performance",
        "impact": "high|medium|low",
        "recommendation": "A specific, actionable recommendation based on your findings."
      }
      Important: The entire response must be a single, valid JSON object without any extra text or markdown.
    `;
    
    const result = await this.model.generateContent(customPrompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {
        description: "Analysis generated successfully.",
        recommendation: "Continue monitoring this metric.",
        type: "insight",
        impact: "medium"
      };
    } catch {
      return {
        description: text.substring(0, 250),
        recommendation: "Further analysis may be required.",
        type: "insight",
        impact: "medium"
      };
    }
  }
  
  // RE-ADDED THIS FUNCTION
  async deleteInsight(analysisId, insightId) {
    const db = await getDb();
    const analysis = await this.getAnalysis(analysisId);
    
    analysis.content.insights = analysis.content.insights.filter(insight => insight.id !== insightId);
    
    await db.collection('ai_analyses').updateOne(
        { _id: new ObjectId(analysisId) },
        { $set: { content: analysis.content, updated_at: new Date() } }
    );
    
    return analysis.content;
  }
}

export default new AIAnalysisService();