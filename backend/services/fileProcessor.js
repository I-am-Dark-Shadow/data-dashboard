// services/fileProcessor.js
import XLSX from 'xlsx';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { saveDataset, saveDatasetColumns, saveDatasetRows } from './dataService.js';

export async function processFile(fileInfo) {
  const { filename, originalname, path: filePath, size } = fileInfo;
  
  try {
    // Determine file type
    const fileExt = path.extname(originalname).toLowerCase();
    let rawData = [];

    // Parse file based on type
    if (fileExt === '.csv') {
      rawData = await parseCSV(filePath);
    } else if (fileExt === '.xlsx' || fileExt === '.xls') {
      rawData = await parseExcel(filePath);
    } else {
      throw new Error('Unsupported file format');
    }

    if (rawData.length === 0) {
      throw new Error('No data found in file');
    }

    // Clean and process data
    const cleanedData = cleanData(rawData);
    const columns = analyzeColumns(cleanedData);

    // Save to database
    const datasetId = await saveDataset({
      name: originalname.replace(/\.[^/.]+$/, ""), // Remove extension
      originalFilename: originalname,
      fileType: fileExt.substring(1), // Remove dot
      rowCount: cleanedData.length,
      columnCount: columns.length,
      fileSize: size
    });

    // Save column metadata
    await saveDatasetColumns(datasetId, columns);

    // Save data rows
    await saveDatasetRows(datasetId, cleanedData);

    // Clean up temporary file
    fs.unlinkSync(filePath);

    return {
      datasetId,
      summary: {
        totalRows: cleanedData.length,
        totalColumns: columns.length,
        columns: columns.map(col => ({
          name: col.columnName,
          type: col.columnType,
          uniqueValues: col.uniqueValuesCount
        }))
      }
    };

  } catch (error) {
    // Clean up file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Use first sheet
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

function cleanData(rawData) {
  return rawData.map(row => {
    const cleanedRow = {};
    
    Object.keys(row).forEach(key => {
      let value = row[key];
      
      // Skip null/undefined values
      if (value === null || value === undefined) {
        return;
      }
      
      // Clean string values
      if (typeof value === 'string') {
        value = value.trim();
        if (value === '' || value.toLowerCase() === 'null') {
          return;
        }
      }
      
      // Clean column names (remove extra spaces, special chars)
      const cleanKey = key.trim().replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
      cleanedRow[cleanKey] = value;
    });
    
    return cleanedRow;
  }).filter(row => Object.keys(row).length > 0); // Remove empty rows
}

function analyzeColumns(data) {
  if (data.length === 0) return [];
  
  const sampleRow = data[0];
  const columns = [];
  
  Object.keys(sampleRow).forEach(columnName => {
    const columnValues = data.map(row => row[columnName]).filter(val => val != null);
    const uniqueValues = [...new Set(columnValues)];
    
    // Determine column type
    let columnType = 'string';
    if (columnValues.every(val => !isNaN(val) && !isNaN(parseFloat(val)))) {
      columnType = 'number';
    } else if (columnValues.every(val => !isNaN(Date.parse(val)))) {
      columnType = 'date';
    } else if (columnValues.every(val => typeof val === 'boolean' || val === 'true' || val === 'false')) {
      columnType = 'boolean';
    }
    
    columns.push({
      columnName,
      columnType,
      isFilterable: uniqueValues.length < data.length * 0.8, // Filterable if < 80% unique
      uniqueValuesCount: uniqueValues.length
    });
  });
  
  return columns;
}