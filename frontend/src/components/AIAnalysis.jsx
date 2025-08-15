import React, { useState, useEffect } from 'react';
import { Brain, Download, ArrowLeft, BarChart3, TrendingUp, AlertTriangle, Lightbulb, Edit, Trash2, Save, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ChartContainer from './ChartContainer';
// Import the functions from your API service
import { 
  getAllAIAnalyses, 
  getAIAnalysis, 
  generateAIAnalysis, 
  updateAIInsight, 
  deleteAIInsight 
} from '../services/api.js';

const AIAnalysis = ({ datasetId, dataset }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);

  const [datasetType, setDatasetType] = useState('');
  const [otherDatasetType, setOtherDatasetType] = useState('');
  const [department, setDepartment] = useState('');
  const [otherDepartment, setOtherDepartment] = useState('');
  const [analysisNeeds, setAnalysisNeeds] = useState([]);
  
  const [editingInsight, setEditingInsight] = useState(null);
  const [newInsightText, setNewInsightText] = useState('');

  const datasetTypes = ['Retail', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Technology', 'Marketing & Advertising', 'E-commerce'];
  const departments = ['Sales', 'Marketing', 'Finance', 'Product Development', 'Human Resources', 'Customer Support', 'Data/Analytics', 'Research'];
  const needsOptions = ['Exploratory data analysis (EDA)', 'Data visualization', 'Bivariate statistical analysis', 'Statistical data operations', 'Columns format', 'Rows deduplicate', 'Table merge'];

  useEffect(() => {
    loadExistingAnalyses();
  }, [datasetId]);

  const loadExistingAnalyses = async () => {
    setLoading(true);
    try {
      const analyses = await getAllAIAnalyses(datasetId);
      if (analyses.length > 0) {
        const latestAnalysis = await getAIAnalysis(analyses[0].id);
        setAnalysis(latestAnalysis);
      } else {
        setStep(1);
      }
    } catch (err) {
      console.error('Error loading existing analyses:', err);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleNeedToggle = (need) => {
    setAnalysisNeeds(prev =>
      prev.includes(need) ? prev.filter(item => item !== need) : [...prev, need]
    );
  };

  const handleGenerateAnalysis = async () => {
    setLoading(true);
    setError(null);
    setStep(0);

    const context = {
      datasetType: datasetType === 'Other' ? otherDatasetType : datasetType,
      department: department === 'Other' ? otherDepartment : department,
      analysisNeeds,
    };

    try {
      // Use the imported generateAIAnalysis function
      const result = await generateAIAnalysis(datasetId, context);
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const resetFlow = () => {
      setAnalysis(null);
      setStep(1);
      setDatasetType('');
      setOtherDatasetType('');
      setDepartment('');
      setOtherDepartment('');
      setAnalysisNeeds([]);
  }

  const editInsight = (insightId, currentTitle) => {
    setEditingInsight(insightId);
    setNewInsightText(currentTitle);
  };

  const saveInsightEdit = async (insightId) => {
    if (!newInsightText.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      // Use the imported updateAIInsight function
      const result = await updateAIInsight(analysis.id, insightId, newInsightText);
      setAnalysis(prev => ({ ...prev, content: result.content }));
      setEditingInsight(null);
      setNewInsightText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteInsight = async (insightId) => {
    if (!window.confirm('Are you sure you want to delete this insight?')) return;
    
    setLoading(true);
    setError(null);
    try {
      // Use the imported deleteAIInsight function
      const result = await deleteAIInsight(analysis.id, insightId);
      setAnalysis(prev => ({ ...prev, content: result.content }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai-analysis/${analysis.id}/export-pdf`);
        if (!response.ok) {
            throw new Error('PDF generation failed');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${analysis.content.title.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        setError('Could not download PDF report. ' + err.message);
    }
  };

  // --- Helper functions for rendering (getInsightIcon, getImpactColor) remain the same ---

  const getInsightIcon = (type) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'trend': return <BarChart3 className="h-5 w-5 text-blue-600" />;
      default: return <Lightbulb className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const renderStepContent = () => {
     switch (step) {
      case 1:
        return (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">What type of dataset is this?</h3>
            <p className="text-gray-600 mb-6">This helps the AI understand the context of your data.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {datasetTypes.map(type => (
                <button key={type} onClick={() => setDatasetType(type)} className={`p-4 border rounded-lg text-center transition-colors ${datasetType === type ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-100'}`}>{type}</button>
              ))}
              <button onClick={() => setDatasetType('Other')} className={`p-4 border rounded-lg text-center transition-colors ${datasetType === 'Other' ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-100'}`}>Other</button>
            </div>
            {datasetType === 'Other' && (
              <input type="text" value={otherDatasetType} onChange={e => setOtherDatasetType(e.target.value)} placeholder="Please specify your dataset type" className="input-field mt-4" />
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => setStep(2)} disabled={!datasetType || (datasetType === 'Other' && !otherDatasetType)} className="btn-primary disabled:opacity-50">Next</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Which department do you work in?</h3>
            <p className="text-gray-600 mb-6">This tailors the analysis to your department's goals.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {departments.map(dept => (
                <button key={dept} onClick={() => setDepartment(dept)} className={`p-4 border rounded-lg text-center transition-colors ${department === dept ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-100'}`}>{dept}</button>
              ))}
              <button onClick={() => setDepartment('Other')} className={`p-4 border rounded-lg text-center transition-colors ${department === 'Other' ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-100'}`}>Other</button>
            </div>
             {department === 'Other' && (
              <input type="text" value={otherDepartment} onChange={e => setOtherDepartment(e.target.value)} placeholder="Please specify your department" className="input-field mt-4" />
            )}
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
              <button onClick={() => setStep(3)} disabled={!department || (department === 'Other' && !otherDepartment)} className="btn-primary disabled:opacity-50">Next</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">What are your analysis needs?</h3>
            <p className="text-gray-600 mb-6">Select one or more to focus the analysis.</p>
            <div className="space-y-3">
              {needsOptions.map(need => (
                <label key={need} className={`flex items-center p-3 border rounded-lg cursor-pointer ${analysisNeeds.includes(need) ? 'bg-primary-50 border-primary-300' : ''}`}>
                  <input type="checkbox" checked={analysisNeeds.includes(need)} onChange={() => handleNeedToggle(need)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                  <span className="ml-3 text-gray-700">{need}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
              <button onClick={handleGenerateAnalysis} disabled={analysisNeeds.length === 0} className="btn-primary disabled:opacity-50 flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Analyze</span>
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <Brain className="h-16 w-16 mx-auto text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Business Analysis</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">Answer a few questions to get deep insights, trends, and actionable recommendations tailored to your specific needs.</p>
            <button onClick={() => setStep(1)} className="btn-primary">Get Started</button>
          </div>
        );
    }
  };

  // --- All the rendering logic for loading, error, and the report view remains the same ---
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <LoadingSpinner message="AI is working on your request..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => { setError(null); resetFlow(); }} className="btn-primary">Try Again</button>
        </div>
    );
  }

  if (!analysis) {
      return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">{renderStepContent()}</div>
  }

  const { content } = analysis;
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-primary-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{content.title || 'Analysis Report'}</h2>
                <p className="text-sm text-gray-600">Generated on {new Date(analysis.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={resetFlow} className="btn-secondary flex items-center space-x-2"><ArrowLeft className="h-4 w-4" /><span>New Analysis</span></button>
                <button onClick={exportToPDF} className="btn-primary flex items-center space-x-2"><Download className="h-4 w-4" /><span>Export PDF</span></button>
            </div>
          </div>
        </div>

        {/* Executive Summary, Metrics, Charts, etc. (Full report rendering) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Executive Summary</h3>
          <p className="text-gray-700 leading-relaxed">{content.summary || 'No summary available'}</p>
        </div>
        
        {content.businessMetrics && Object.keys(content.businessMetrics).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Business Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(content.businessMetrics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="text-xl font-bold text-gray-900">{value}</div>
                </div>
                ))}
            </div>
            </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Key Business Insights</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
            {content.insights && content.insights.length > 0 ? (
                content.insights.map((insight) => (
                <div key={insight.id} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                        {editingInsight === insight.id ? (
                            <div className="space-y-3">
                            <input
                                type="text"
                                value={newInsightText}
                                onChange={(e) => setNewInsightText(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-semibold"
                                placeholder="Enter your business question..."
                            />
                            <div className="flex space-x-2">
                                <button
                                onClick={() => saveInsightEdit(insight.id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                <Save className="h-3 w-3" />
                                <span>Save</span>
                                </button>
                                <button
                                onClick={() => {
                                    setEditingInsight(null);
                                    setNewInsightText('');
                                }}
                                className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                >
                                <X className="h-3 w-3" />
                                <span>Cancel</span>
                                </button>
                            </div>
                            </div>
                        ) : (
                            <>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                {insight.title || 'Untitled Insight'}
                            </h4>
                            <div className="flex items-center space-x-2 mb-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                                {insight.impact?.toUpperCase() || 'UNKNOWN'} IMPACT
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {insight.type?.toUpperCase() || 'GENERAL'}
                                </span>
                            </div>
                            <p className="text-gray-700 mb-3 leading-relaxed">
                                {insight.description || 'No description available'}
                            </p>
                            {insight.recommendation && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                    <div className="text-sm font-medium text-blue-900 mb-1">
                                        Recommendation
                                    </div>
                                    <div className="text-sm text-blue-800">
                                        {insight.recommendation}
                                    </div>
                                    </div>
                                </div>
                                </div>
                            )}
                            </>
                        )}
                        </div>
                    </div>
                    
                    {editingInsight !== insight.id && (
                        <div className="flex items-center space-x-2">
                        <button
                            onClick={() => editInsight(insight.id, insight.title)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Insight"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => deleteInsight(insight.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Insight"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                        </div>
                    )}
                    </div>
                </div>
                ))
            ) : (
                <div className="p-6 text-center text-gray-500">
                No insights available
                </div>
            )}
            </div>
        </div>

        {content.charts && content.charts.length > 0 && (
            <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Recommended Visualizations</h3>
                <p className="text-gray-600 mb-6">
                Based on your data analysis, here are the most insightful charts to explore:
                </p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {content.charts.map((chart, index) => (
                <div key={chart.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{chart.title || 'Untitled Chart'}</h4>
                    <p className="text-sm text-gray-600 mb-2">{chart.description || 'No description available'}</p>
                    {chart.insights && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs text-blue-800">{chart.insights}</p>
                        </div>
                    )}
                    </div>
                    <div className="p-4">
                    <ChartContainer
                        data={dataset?.sampleData || []}
                        columns={dataset?.columns || []}
                        chartType={chart.type}
                        title=""
                    />
                    </div>
                </div>
                ))}
            </div>
            </div>
        )}

        {content.prosAndCons && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-green-900 flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Strengths & Opportunities</span>
                </h3>
                </div>
                <div className="p-6">
                <ul className="space-y-3">
                    {content.prosAndCons.pros && content.prosAndCons.pros.length > 0 ? (
                    content.prosAndCons.pros.map((pro, index) => (
                        <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{pro}</span>
                        </li>
                    ))
                    ) : (
                    <li className="text-gray-500">No strengths identified</li>
                    )}
                </ul>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-red-900 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span>Challenges & Risks</span>
                </h3>
                </div>
                <div className="p-6">
                <ul className="space-y-3">
                    {content.prosAndCons.cons && content.prosAndCons.cons.length > 0 ? (
                    content.prosAndCons.cons.map((con, index) => (
                        <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{con}</span>
                        </li>
                    ))
                    ) : (
                    <li className="text-gray-500">No challenges identified</li>
                    )}
                </ul>
                </div>
            </div>
            </div>
        )}

        {content.recommendations && content.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <span>Strategic Recommendations</span>
                </h3>
            </div>
            <div className="p-6">
                <div className="space-y-4">
                {content.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {index + 1}
                    </div>
                    <p className="text-gray-800 leading-relaxed">{recommendation}</p>
                    </div>
                ))}
                </div>
            </div>
            </div>
        )}
    </div>
  );
};

export default AIAnalysis;