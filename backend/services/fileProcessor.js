// services/fileProcessor.js
import XLSX from 'xlsx';
import csv from 'csv-parser';
import path from 'path';
import { Readable } from 'stream';
import { saveDataset, saveDatasetColumns, saveDatasetRows } from './dataService.js';

export async function processFile(fileInfo) {
  // We no longer get a local path, but a buffer
  const { originalname, buffer, size } = fileInfo;
  
  try {
    const fileExt = path.extname(originalname).toLowerCase();
    let rawData = [];

    // Parse file based on type, using the buffer
    if (fileExt === '.csv') {
      rawData = await parseCSV(buffer);
    } else if (fileExt === '.xlsx' || fileExt === '.xls') {
      rawData = await parseExcel(buffer);
    } else {
      throw new Error('Unsupported file format');
    }

    if (rawData.length === 0) {
      throw new Error('No data found in file');
    }

    const cleanedData = cleanData(rawData);
    const columns = analyzeColumns(cleanedData);

    const datasetId = await saveDataset({
      name: originalname.replace(/\.[^/.]+$/, ""),
      originalFilename: originalname,
      fileType: fileExt.substring(1),
      rowCount: cleanedData.length,
      columnCount: columns.length,
      fileSize: size
    });

    await saveDatasetColumns(datasetId, columns);
    await saveDatasetRows(datasetId, cleanedData);

    // No temporary file to clean up!

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
    // No file to clean up on error either
    console.error("Error processing file:", error);
    throw error;
  }
}

async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    // Create a readable stream from the buffer
    const stream = Readable.from(buffer);
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function parseExcel(buffer) {
  // XLSX can read directly from a buffer
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

function cleanData(rawData) {
  return rawData.map(row => {
    const cleanedRow = {};
    
    Object.keys(row).forEach(key => {
      let value = row[key];
      
      if (value === null || value === undefined) {
        return;
      }
      
      if (typeof value === 'string') {
        value = value.trim();
        if (value === '' || value.toLowerCase() === 'null') {
          return;
        }
      }
      
      const cleanKey = key.trim().replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
      cleanedRow[cleanKey] = value;
    });
    
    return cleanedRow;
  }).filter(row => Object.keys(row).length > 0);
}

function analyzeColumns(data) {
    if (data.length === 0) return [];
  
    // Use a larger sample for better type analysis, but not the whole dataset if it's huge
    const sample = data.length > 500 ? data.slice(0, 500) : data;
    const columnNames = Object.keys(data[0] || {});
    const columns = [];
    
    columnNames.forEach(columnName => {
        const columnValues = sample.map(row => row[columnName]).filter(val => val != null);
        const uniqueValues = [...new Set(columnValues)];
        
        let columnType = 'string';
        
        // More robust type checking
        const isNumeric = columnValues.every(val => val === '' || !isNaN(val) && !isNaN(parseFloat(val)));
        const isDate = !isNumeric && columnValues.every(val => val === '' || !isNaN(Date.parse(val)));
        const isBoolean = !isNumeric && !isDate && columnValues.every(val => typeof val === 'boolean' || ['true', 'false', 'yes', 'no', '0', '1'].includes(String(val).toLowerCase()));

        if (isNumeric) {
            columnType = 'number';
        } else if (isDate) {
            columnType = 'date';
        } else if (isBoolean) {
            columnType = 'boolean';
        }
        
        columns.push({
          columnName,
          columnType,
          isFilterable: uniqueValues.length < data.length * 0.8,
          uniqueValuesCount: uniqueValues.length
        });
    });
    
    return columns;
}