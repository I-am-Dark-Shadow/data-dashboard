// Updated src/components/Dashboard.jsx - Add AI Analysis Tab

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Filter as FilterIcon, Eye, EyeOff, Brain, BarChart3 } from 'lucide-react';
import { getDatasetInfo, getDatasetData } from '../services/api';
import ChartContainer from './ChartContainer';
import FilterPanel from './FilterPanel';
import DataTable from './DataTable';
import AIAnalysis from './AIAnalysis';
import LoadingSpinner from './LoadingSpinner';

const Dashboard = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showDataTable, setShowDataTable] = useState(false);
  const [activeTab, setActiveTab] = useState('charts'); // 'charts' or 'analysis'

  useEffect(() => {
    loadDashboardData();
  }, [datasetId]);

  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [datasetInfo, datasetData] = await Promise.all([
        getDatasetInfo(datasetId),
        getDatasetData(datasetId)
      ]);

      setDataset({
        ...datasetInfo,
        sampleData: datasetData.slice(0, 100) // Sample for AI analysis
      });
      setData(datasetData);
    } catch (err) {
      setError(err.message);
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...data];

    Object.entries(filters).forEach(([column, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(row => {
          const rowValue = String(row[column] || '').toLowerCase();
          const filterValue = String(value).toLowerCase();
          return rowValue.includes(filterValue);
        });
      }
    });

    setFilteredData(filtered);
  };

  const handleFilterChange = (column, value) => {
    if (column === '' && value === '') {
      setFilters({});
    } else {
      setFilters(prev => ({
        ...prev,
        [column]: value
      }));
    }
  };

  const exportData = () => {
    const csvContent = convertToCSV(filteredData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${dataset?.name || 'data'}_filtered.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 text-lg font-medium mb-2">Error Loading Dashboard</div>
          <div className="text-red-700 mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Rows', value: data.length.toLocaleString() },
    { label: 'Filtered Rows', value: filteredData.length.toLocaleString() },
    { label: 'Columns', value: dataset?.columns?.length || 0 },
    { label: 'File Size', value: `${((dataset?.file_size || 0) / 1024 / 1024).toFixed(2)} MB` }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Upload"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {dataset?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  Uploaded: {new Date(dataset?.upload_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Tab Navigation */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('charts')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'charts'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Charts</span>
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'analysis'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Brain className="h-4 w-4" />
                  <span>AI Analysis</span>
                </button>
              </div>
              
              {activeTab === 'charts' && (
                <>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                      showFilters 
                        ? 'bg-primary-50 border-primary-200 text-primary-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FilterIcon className="h-4 w-4" />
                    <span className="text-sm">Filters</span>
                  </button>
                  
                  <button
                    onClick={() => setShowDataTable(!showDataTable)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                      showDataTable 
                        ? 'bg-primary-50 border-primary-200 text-primary-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {showDataTable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="text-sm">Data Table</span>
                  </button>
                  
                  <button
                    onClick={exportData}
                    className="flex items-center space-x-2 btn-secondary"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm">Export CSV</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'charts' ? (
        <>
          {/* Filters */}
          {showFilters && dataset && (
            <FilterPanel
              columns={dataset.columns}
              data={data}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartContainer
              data={filteredData}
              columns={dataset?.columns || []}
              chartType="bar"
              title="Bar Chart"
            />
            <ChartContainer
              data={filteredData}
              columns={dataset?.columns || []}
              chartType="pie"
              title="Pie Chart"
            />
            <ChartContainer
              data={filteredData}
              columns={dataset?.columns || []}
              chartType="line"
              title="Line Chart"
            />
            <ChartContainer
              data={filteredData}
              columns={dataset?.columns || []}
              chartType="area"
              title="Area Chart"
            />
          </div>

          {/* Data Table */}
          {showDataTable && (
            <DataTable
              data={filteredData}
              columns={dataset?.columns || []}
            />
          )}

          {/* Empty State */}
          {filteredData.length === 0 && data.length > 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-500 text-lg mb-2">No data matches your filters</div>
              <button
                onClick={() => setFilters({})}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </>
      ) : (
        <AIAnalysis datasetId={datasetId} dataset={dataset} />
      )}
    </div>
  );
};

export default Dashboard;