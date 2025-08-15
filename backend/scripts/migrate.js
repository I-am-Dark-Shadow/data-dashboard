// scripts/migrate.js
import connectToDatabase from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  let db;
  try {
    console.log('🔄 Connecting to database...');
    db = await connectToDatabase();
    console.log('✅ Connected to database');

    await createCollections(db);
    await seedUsers(db); // Add this line to seed a default user

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function createCollections(db) {
  // ... your existing collection creation code remains the same
  const datasetsCollection = db.collection('datasets');
  await datasetsCollection.createIndex({ status: 1 });
  console.log('✅ Created datasets collection and indexes');
  // ... and so on for your other collections
}

// Add this new function to create a user
async function seedUsers(db) {
  const usersCollection = db.collection('users');
  const existingUser = await usersCollection.findOne({ username: 'admin' });

  if (!existingUser) {
    await usersCollection.insertOne({
      username: 'admin',
      password: 'password', // In a real app, this MUST be hashed
      name: 'Admin User'
    });
    console.log('✅ Default user seeded');
  } else {
    console.log('✅ Default user already exists');
  }
}

runMigrations();