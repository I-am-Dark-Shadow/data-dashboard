import axios from 'axios';

const API_BASE_URL = "https://data-dashboard-zs21.vercel.app/api"; //'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle authentication errors if needed
    } else if (error.response?.status === 500) {
      console.error('Server Error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Upload file
export const uploadFile = async (file, onProgress = () => {}) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentage = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentage);
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Upload failed');
  }
};

// Get dataset info
export const getDatasetInfo = async (datasetId) => {
  try {
    const response = await api.get(`/data/${datasetId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch dataset info');
  }
};

// Get dataset data
export const getDatasetData = async (datasetId, page = 1, limit = 1000) => {
  try {
    const response = await api.get(`/data/${datasetId}/data`, {
      params: { page, limit }
    });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch dataset data');
  }
};

// Get all datasets
export const getAllDatasets = async () => {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch datasets');
  }
};

// Get chart data
export const getChartData = async (datasetId, chartType, options = {}) => {
  try {
    const response = await api.get(`/charts/${datasetId}/${chartType}`, {
      params: options
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch chart data');
  }
};

// Delete dataset
export const deleteDataset = async (datasetId) => {
  try {
    const response = await api.delete(`/data/${datasetId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete dataset');
  }
};

// Add these functions to src/services/api.js

// AI Analysis functions
export const generateAIAnalysis = async (datasetId, customPrompt = null) => {
  try {
    const response = await api.post(`/ai-analysis/${datasetId}/generate`, {
      customPrompt
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to generate AI analysis');
  }
};

export const getAIAnalysis = async (analysisId) => {
  try {
    const response = await api.get(`/ai-analysis/${analysisId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch analysis');
  }
};

export const getAllAIAnalyses = async (datasetId) => {
  try {
    const response = await api.get(`/ai-analysis/dataset/${datasetId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch analyses');
  }
};

export const updateAIInsight = async (analysisId, insightId, content) => {
  try {
    const response = await api.put(`/ai-analysis/${analysisId}/insight/${insightId}`, {
      content
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update insight');
  }
};

export const deleteAIInsight = async (analysisId, insightId) => {
  try {
    const response = await api.delete(`/ai-analysis/${analysisId}/insight/${insightId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete insight');
  }
};

export default api;