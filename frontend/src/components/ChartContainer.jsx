import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Settings, RefreshCw } from 'lucide-react';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

const ChartContainer = ({ data, columns, chartType, title }) => {
  const [chartData, setChartData] = useState([]);
  const [selectedXAxis, setSelectedXAxis] = useState('');
  const [selectedYAxis, setSelectedYAxis] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (data.length > 0 && columns.length > 0) {
      autoSelectColumns();
    }
  }, [data, columns]);

  useEffect(() => {
    if (selectedXAxis && (selectedYAxis || chartType === 'pie')) {
      generateChartData();
    }
  }, [data, selectedXAxis, selectedYAxis, chartType]);

  const autoSelectColumns = () => {
    const stringColumns = columns.filter(col => col.column_type === 'string');
    const numberColumns = columns.filter(col => col.column_type === 'number');
    
    if (!selectedXAxis && stringColumns.length > 0) {
      setSelectedXAxis(stringColumns[0].column_name);
    }
    if (!selectedYAxis && numberColumns.length > 0) {
      setSelectedYAxis(numberColumns[0].column_name);
    }
  };

  const generateChartData = () => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }

    if (chartType === 'pie') {
      generatePieChartData();
    } else {
      generateXYChartData();
    }
  };

  const generatePieChartData = () => {
    const counts = {};
    data.forEach(row => {
      const key = String(row[selectedXAxis] || 'Unknown');
      counts[key] = (counts[key] || 0) + 1;
    });

    const pieData = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 categories

    setChartData(pieData);
  };

  const generateXYChartData = () => {
    const grouped = {};
    data.forEach(row => {
      const xKey = String(row[selectedXAxis] || 'Unknown');
      const yValue = parseFloat(row[selectedYAxis]) || 0;
      
      if (!grouped[xKey]) {
        grouped[xKey] = 0;
      }
      grouped[xKey] += yValue;
    });

    const xyData = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Top 15 items

    setChartData(xyData);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div>No data available for visualization</div>
            <div className="text-sm mt-1">Try adjusting your column selections</div>
          </div>
        </div>
      );
    }

    const chartProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={COLORS[0]} 
                strokeWidth={3}
                dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS[0], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={COLORS[0]} 
                fill={COLORS[0]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const stringColumns = columns.filter(col => col.column_type === 'string');
  const numberColumns = columns.filter(col => col.column_type === 'number');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => generateChartData()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh Chart"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Chart Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {chartType === 'pie' ? 'Category' : 'X-Axis'}
              </label>
              <select
                value={selectedXAxis}
                onChange={(e) => setSelectedXAxis(e.target.value)}
                className="input-field"
              >
                <option value="">Select Column</option>
                {stringColumns.map(col => (
                  <option key={col.column_name} value={col.column_name}>
                    {col.column_name}
                  </option>
                ))}
              </select>
            </div>
            
            {chartType !== 'pie' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Y-Axis (Values)
                </label>
                <select
                  value={selectedYAxis}
                  onChange={(e) => setSelectedYAxis(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Column</option>
                  {numberColumns.map(col => (
                    <option key={col.column_name} value={col.column_name}>
                      {col.column_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Chart Area */}
      <div className="p-4">
        {renderChart()}
      </div>

      {/* Chart Info */}
      {chartData.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            Showing {chartData.length} items
            {chartType === 'pie' ? ` from ${selectedXAxis}` : ` • X: ${selectedXAxis} • Y: ${selectedYAxis}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartContainer;