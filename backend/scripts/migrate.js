// scripts/migrate.js - Database migration script
import connectToDatabase from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  let db;
  try {
    console.log('🔄 Connecting to database...');
    db = await connectToDatabase();
    console.log('✅ Connected to database');

    // Create all required collections and indexes
    await createCollections(db);
    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function createCollections(db) {
  // Create datasets collection with indexes
  const datasetsCollection = db.collection('datasets');
  await datasetsCollection.createIndex({ status: 1 });
  await datasetsCollection.createIndex({ upload_date: -1 });
  console.log('✅ Created datasets collection and indexes');

  // Create dataset_columns collection with indexes
  const datasetColumnsCollection = db.collection('dataset_columns');
  await datasetColumnsCollection.createIndex({ dataset_id: 1 });
  console.log('✅ Created dataset_columns collection and indexes');

  // Create dataset_rows collection with indexes
  const datasetRowsCollection = db.collection('dataset_rows');
  await datasetRowsCollection.createIndex({ dataset_id: 1 });
  await datasetRowsCollection.createIndex({ row_index: 1 });
  console.log('✅ Created dataset_rows collection and indexes');

  // Create ai_analyses collection with indexes
  const aiAnalysesCollection = db.collection('ai_analyses');
  await aiAnalysesCollection.createIndex({ dataset_id: 1 });
  await aiAnalysesCollection.createIndex({ created_at: -1 });
  await aiAnalysesCollection.createIndex({ status: 1 });
  await aiAnalysesCollection.createIndex({ dataset_id: 1, status: 1 });
  console.log('✅ Created ai_analyses collection and indexes');
}

runMigrations();