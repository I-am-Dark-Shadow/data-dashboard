import axios from 'axios';

//"https://data-dashboard-zs21.vercel.app/api" //'http://localhost:5000/api';


const api = axios.create({
  baseURL: "https://data-dashboard-zs21.vercel.app/api",
  //baseURL: 'http://localhost:5000/api',
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
    
    if (error.response?.status === 500) {
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
          (progressEvent.loaded * 100) / (progressEvent.total || file.size)
        );
        onProgress(percentage);
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.details || error.response?.data?.error || 'Upload failed');
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
export const getDatasetData = async (datasetId) => {
  try {
    const response = await api.get(`/data/${datasetId}/data`);
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

// Delete dataset
export const deleteDataset = async (datasetId) => {
  try {
    const response = await api.delete(`/data/${datasetId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete dataset');
  }
};


// --- AI Analysis Functions ---

// This is the function I have fixed
export const generateAIAnalysis = async (datasetId, context) => {
  try {
    const response = await api.post(`/ai-analysis/${datasetId}/generate`, {
      context // Pass the context object correctly
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.details || error.response?.data?.error || 'Failed to generate AI analysis');
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

export const getAIAnalysis = async (analysisId) => {
  try {
    const response = await api.get(`/ai-analysis/${analysisId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch analysis');
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

export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Login failed');
  }
};

export default api;