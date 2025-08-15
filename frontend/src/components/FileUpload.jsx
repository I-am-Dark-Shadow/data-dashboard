import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X, PlayCircle } from 'lucide-react';
import { uploadFile } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../App';

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, openLoginModal } = useAuth();

  const onDrop = async (acceptedFiles) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    
    // This line was missing, which caused the error.
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      // Now we correctly pass the defined 'file' variable
      const result = await uploadFile(file, setUploadProgress);
      console.log('Upload successful:', result);
      setSuccess(`File "${file.name}" uploaded successfully! Navigating to dashboard...`);
      
      setTimeout(() => {
        navigate(`/dashboard/${result.datasetId}`);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    multiple: false
  });

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Intelligent Data Analysis
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Turn your raw data into interactive dashboards and professional, AI-driven business reports in seconds.
        </p>
      </div>

      {/* Upload Area */}
      <div className="card mb-6">
         <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50 scale-105'
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
          } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing your file...
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{uploadProgress}% uploaded</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragActive ? 'Drop your file here' : 'Drop files here or click to browse'}
                </h3>
                <p className="text-gray-600">
                  Supports CSV, XLSX, and XLS files up to 50MB
                </p>
              </div>
            </div>
          )}
        </div>
        {fileRejections.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="font-medium text-red-800">File Upload Issues:</span>
            </div>
            {fileRejections.map(({ file, errors }) => (
              <div key={file.path} className="text-sm text-red-700">
                <strong>{file.path}</strong>
                <ul className="list-disc list-inside ml-4">
                  {errors.map(e => (
                    <li key={e.code}>{e.message}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demo Video Section */}
      <div className="my-12">
        <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 flex items-center justify-center space-x-3">
                <PlayCircle className="h-8 w-8 text-primary-600" />
                <span>See How It Works</span>
            </h3>
            <p className="text-lg text-gray-600 mt-2">A quick walkthrough of the dashboard's powerful features.</p>
        </div>
        <div className="bg-white p-2 border border-gray-200 rounded-xl shadow-lg">
             <video 
                className="w-full h-auto rounded-lg"
                controls 
                autoPlay 
                loop 
                muted 
                playsInline
                src="/video.mp4" 
            >
                Your browser does not support the video tag.
            </video>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
          <button onClick={clearMessages} className="text-green-600 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={clearMessages} className="text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Automatic Processing</h4>
          <p className="text-sm text-gray-600">
            Data is automatically cleaned, validated, and processed for optimal visualization
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <div className="text-2xl">📊</div>
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Interactive Charts</h4>
          <p className="text-sm text-gray-600">
            Beautiful visualizations with real-time filtering and multiple chart types
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-12 h-12 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <div className="text-2xl">⚡</div>
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Real-time Analysis</h4>
          <p className="text-sm text-gray-600">
            Instant insights and analytics from your data with powerful filtering options
          </p>
        </div>
      </div>

      {/* Supported Formats Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">Supported File Formats:</h5>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">.csv</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">.xlsx</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">.xls</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Maximum file size: 50MB. Files are processed securely and stored temporarily for analysis.
        </p>
      </div>
    </div>
  );
};

export default FileUpload;