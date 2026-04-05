// This script runs once when MongoDB container is first created.
// It creates the application database and a dedicated app user.

db = db.getSiblingDB('aitasks');

db.createCollection('users');
db.createCollection('tasks');

// Indexes are created by Mongoose on first connect,
// but we can pre-create them here for production readiness.
db.users.createIndex({ email: 1 }, { unique: true });
db.tasks.createIndex({ userId: 1, createdAt: -1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ userId: 1, status: 1 });

print('✅ MongoDB initialized: aitasks database and indexes created');
