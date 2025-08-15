// services/dataService.js
import connectToDatabase from '../config/database.js';
import { ObjectId } from 'mongodb';

async function getDb() {
  return await connectToDatabase();
}

export async function saveDataset(datasetInfo) {
  const db = await getDb();
  const { name, originalFilename, fileType, rowCount, columnCount, fileSize } = datasetInfo;

  const result = await db.collection('datasets').insertOne({
    name,
    original_filename: originalFilename,
    file_type: fileType,
    row_count: rowCount,
    column_count: columnCount,
    file_size: fileSize,
    status: 'completed',
    upload_date: new Date(),
  });

  return result.insertedId;
}

export async function saveDatasetColumns(datasetId, columns) {
  const db = await getDb();
  const columnsToInsert = columns.map(column => ({
    dataset_id: datasetId,
    column_name: column.columnName,
    column_type: column.columnType,
    is_filterable: column.isFilterable,
    unique_values_count: column.uniqueValuesCount,
  }));
  await db.collection('dataset_columns').insertMany(columnsToInsert);
}

export async function saveDatasetRows(datasetId, rows) {
  const db = await getDb();
  const rowsToInsert = rows.map((row, index) => ({
    dataset_id: datasetId,
    row_data: row,
    row_index: index,
  }));
  await db.collection('dataset_rows').insertMany(rowsToInsert);
}

export async function getDatasetById(datasetId) {
  const db = await getDb();
  const dataset = await db.collection('datasets').findOne({ _id: new ObjectId(datasetId) });

  if (!dataset) {
    throw new Error('Dataset not found');
  }

  const columns = await db.collection('dataset_columns').find({ dataset_id: new ObjectId(datasetId) }).sort({ _id: 1 }).toArray();
  
  // convert _id to id for frontend compatibility
  dataset.id = dataset._id;
  delete dataset._id;

  return {
    ...dataset,
    columns,
  };
}

export async function getDatasetData(datasetId) {
  const db = await getDb();
  const rows = await db.collection('dataset_rows').find({ dataset_id: new ObjectId(datasetId) }).sort({ row_index: 1 }).toArray();

  return rows.map(row => row.row_data);
}

export async function getAllDatasets() {
  const db = await getDb();
  const datasets = await db.collection('datasets').find({ status: 'completed' }).sort({ upload_date: -1 }).toArray();
  
  // convert _id to id for frontend compatibility
  return datasets.map(d => {
      d.id = d._id;
      delete d._id;
      return d;
  })
}

// Add this new function
export async function deleteDataset(datasetId) {
  const db = await getDb();
  const id = new ObjectId(datasetId);

  // Delete all related data
  await db.collection('dataset_rows').deleteMany({ dataset_id: id });
  await db.collection('dataset_columns').deleteMany({ dataset_id: id });
  await db.collection('ai_analyses').deleteMany({ dataset_id: id });
  
  // Delete the main dataset document
  const result = await db.collection('datasets').deleteOne({ _id: id });

  if (result.deletedCount === 0) {
    throw new Error('Dataset not found for deletion');
  }

  return { message: 'Dataset deleted successfully' };
}