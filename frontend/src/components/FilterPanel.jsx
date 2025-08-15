import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';

const FilterPanel = ({ columns, data, filters, onFilterChange }) => {
  const getUniqueValues = (columnName) => {
    const values = data
      .map(row => row[columnName])
      .filter(val => val != null && val !== '')
      .map(val => String(val));
    
    const unique = [...new Set(values)].sort();
    return unique.slice(0, 100); // Limit to 100 unique values for performance
  };

  const filterableColumns = columns.filter(col => col.is_filterable);
  const activeFilters = Object.entries(filters).filter(([value]) => value && value !== 'all');

  const clearAllFilters = () => {
    onFilterChange('', '');
  };

  const clearFilter = (columnName) => {
    onFilterChange(columnName, 'all');
  };

  if (filterableColumns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No filterable columns available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {activeFilters.length > 0 && (
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {activeFilters.length} active
            </span>
          )}
        </div>
        
        {activeFilters.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(([column, value]) => (
              <div
                key={column}
                className="flex items-center space-x-2 bg-primary-100 text-primary-800 px-3 py-1.5 rounded-lg text-sm"
              >
                <span className="font-medium">{column}:</span>
                <span>{value}</span>
                <button
                  onClick={() => clearFilter(column)}
                  className="hover:bg-primary-200 rounded p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Filter Controls */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filterableColumns.map(column => {
            const uniqueValues = getUniqueValues(column.column_name);
            const currentValue = filters[column.column_name] || 'all';
            
            return (
              <div key={column.column_name} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {column.column_name}
                  <span className="text-xs text-gray-500 ml-1">
                    ({uniqueValues.length} options)
                  </span>
                </label>
                
                <div className="relative">
                  <select
                    value={currentValue}
                    onChange={(e) => onFilterChange(column.column_name, e.target.value)}
                    className="input-field pr-10"
                  >
                    <option value="all">All Values</option>
                    {uniqueValues.map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  
                  {currentValue !== 'all' && (
                    <button
                      onClick={() => clearFilter(column.column_name)}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Column Type Badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    column.column_type === 'string' ? 'bg-blue-100 text-blue-800' :
                    column.column_type === 'number' ? 'bg-green-100 text-green-800' :
                    column.column_type === 'date' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {column.column_type}
                  </span>
                  
                  {currentValue !== 'all' && (
                    <span className="text-xs text-gray-500">
                      {data.filter(row => String(row[column.column_name]).toLowerCase().includes(String(currentValue).toLowerCase())).length} matches
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Filter Summary */}
        {filterableColumns.length > 4 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>{filterableColumns.length}</strong> filterable columns available
              {activeFilters.length > 0 && (
                <span> • <strong>{activeFilters.length}</strong> filters active</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;