import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import Student from './models/Student.js';
import { memoryStore } from './data/memoryStore.js';

// 1. Ensure dotenv loads backend/.env regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health & Status check endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    service: 'Student Attendance API',
    database: isConnected ? 'connected' : 'disconnected',
    storageMode: isConnected ? 'MongoDB Atlas' : 'In-Memory Fallback',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Validate MongoDB configuration in .env
 */
function validateMongoConfig() {
  const uri = process.env.MONGO_URI;

  if (!uri || !uri.trim()) {
    return {
      valid: false,
      reason: 'MONGO_URI is missing or empty in backend/.env',
    };
  }

  const placeholderPatterns = [
    'YOUR_NEW_PASSWORD',
    '<ACTUAL_PASSWORD>',
    '<db_password>',
    '<db_username>',
    '<password>',
    'YOUR_PASSWORD',
  ];

  for (const placeholder of placeholderPatterns) {
    if (uri.includes(placeholder)) {
      return {
        valid: false,
        reason: `MONGO_URI contains placeholder "${placeholder}".`,
      };
    }
  }

  if (/<[^>]+>/.test(uri)) {
    return {
      valid: false,
      reason: 'MONGO_URI contains unresolved angle-bracket placeholders.',
    };
  }

  return { valid: true, uri: uri.trim() };
}

/**
 * Safe target name for logging
 */
function getSanitizedTarget(uri) {
  try {
    const atSplit = uri.split('@');
    if (atSplit.length > 1) {
      return atSplit[1].split('?')[0];
    }
    return 'MongoDB cluster';
  } catch {
    return 'MongoDB cluster';
  }
}

/**
 * Seed initial students into MongoDB if collection is empty
 */
async function seedDatabaseIfEmpty() {
  try {
    const count = await Student.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial students into MongoDB Atlas...');
      const seedList = memoryStore.getAllInitialStudents();
      await Student.insertMany(seedList);
      console.log(`✅ Seeded ${seedList.length} students into MongoDB Atlas successfully!`);
    }
  } catch (err) {
    console.warn('⚠️ Note on database seeding:', err.message);
  }
}

/**
 * Background MongoDB connection manager with retry
 */
let isConnecting = false;
let retryTimer = null;

async function connectToMongoWithRetry(uri, sanitizedTarget) {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;
  try {
    console.log(`🔄 Attempting to connect to MongoDB Atlas (${sanitizedTarget})...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
    });

    console.log('🎉 Successfully connected to MongoDB Atlas!');
    await seedDatabaseIfEmpty();
  } catch (err) {
    const errMsg = err.message || '';
    const isTlsOrWhitelist =
      errMsg.includes('whitelist') ||
      errMsg.includes('alert number 80') ||
      errMsg.includes('ServerSelectionError') ||
      errMsg.includes('tlsv1 alert internal error');

    console.warn('\n======================================================');
    console.warn('⚠️  MONGODB ATLAS IS CURRENTLY UNREACHABLE');
    console.warn('======================================================');
    if (isTlsOrWhitelist) {
      console.warn('Reason: MongoDB Atlas rejected the connection (IP not whitelisted).');
      console.warn('👉 Fix:');
      console.warn('1. Open MongoDB Atlas (https://cloud.mongodb.com)');
      console.warn('2. Go to: Security → Network Access');
      console.warn('3. Click "Add IP Address" and select:');
      console.warn('   - "Allow Access from Anywhere" (0.0.0.0/0) OR add your current public IP.');
      console.warn('4. Click "Confirm". Atlas takes ~1 minute to update rules.');
    } else {
      console.warn(`Reason: ${errMsg}`);
    }
    console.warn('------------------------------------------------------');
    console.warn('💡 Resilient Fallback Active: Server is serving data via in-memory store.');
    console.warn('🔄 Auto-reconnect scheduled in 10 seconds...');
    console.warn('======================================================\n');

    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      connectToMongoWithRetry(uri, sanitizedTarget);
    }, 10000);
  } finally {
    isConnecting = false;
  }
}

// React to disconnection events
mongoose.connection.on('disconnected', () => {
  console.warn('🔌 MongoDB connection dropped. Initiating reconnect loop...');
  const validation = validateMongoConfig();
  if (validation.valid) {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      connectToMongoWithRetry(validation.uri, getSanitizedTarget(validation.uri));
    }, 5000);
  }
});

/**
 * Start the Express API server
 */
function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 EduTrack API Server running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`======================================================`);
  });

  const validation = validateMongoConfig();
  if (validation.valid) {
    const sanitizedTarget = getSanitizedTarget(validation.uri);
    connectToMongoWithRetry(validation.uri, sanitizedTarget);
  } else {
    console.warn(`⚠️ Warning: ${validation.reason}`);
    console.warn('Server started with In-Memory fallback mode.');
  }

  return server;
}

startServer();

export default app;
