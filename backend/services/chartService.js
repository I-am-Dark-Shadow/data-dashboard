// services/chartService.js
export function generateChartData(data, chartType, xAxis, yAxis) {
  if (!data || data.length === 0) {
    return { data: [], summary: { total: 0 } };
  }

  switch (chartType) {
    case 'bar':
    case 'line':
    case 'area':
      return generateXYChartData(data, xAxis, yAxis);
    
    case 'pie':
      return generatePieChartData(data, xAxis);
    
    default:
      return { data: [], summary: { total: 0 } };
  }
}

function generateXYChartData(data, xAxis, yAxis) {
  if (!xAxis || !yAxis) {
    // Auto-select columns if not provided
    const columns = Object.keys(data[0] || {});
    xAxis = xAxis || columns[0];
    yAxis = yAxis || columns.find(col => !isNaN(data[0][col])) || columns[1];
  }

  // Group data by X axis and sum Y axis values
  const grouped = data.reduce((acc, row) => {
    const xValue = String(row[xAxis] || 'Unknown');
    const yValue = parseFloat(row[yAxis]) || 0;
    
    if (!acc[xValue]) {
      acc[xValue] = 0;
    }
    acc[xValue] += yValue;
    
    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([x, y]) => ({ x, y, name: x, value: y }))
    .sort((a, b) => b.y - a.y) // Sort by value descending
    .slice(0, 20); // Limit to top 20 items

  return {
    data: chartData,
    summary: {
      total: chartData.reduce((sum, item) => sum + item.y, 0),
      categories: chartData.length,
      xAxis,
      yAxis
    }
  };
}

function generatePieChartData(data, categoryColumn) {
  if (!categoryColumn) {
    // Auto-select first string column
    const columns = Object.keys(data[0] || {});
    categoryColumn = columns.find(col => 
      isNaN(data[0][col]) && data[0][col] !== null
    ) || columns[0];
  }

  // Count occurrences of each category
  const counts = data.reduce((acc, row) => {
    const category = String(row[categoryColumn] || 'Unknown');
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Limit to top 10 categories

  return {
    data: chartData,
    summary: {
      total: data.length,
      categories: chartData.length,
      categoryColumn
    }
  };
}