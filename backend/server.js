import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';

// 1. Ensure dotenv loads the correct backend/.env regardless of CWD
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    service: 'Student Attendance API',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Validate MongoDB connection configuration
 * Ensures MONGO_URI exists and does not contain unresolved placeholders
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

  // Check for any unescaped angle bracket placeholders like <something>
  if (/<[^>]+>/.test(uri)) {
    return {
      valid: false,
      reason: 'MONGO_URI contains unresolved angle-bracket placeholders (e.g. <...>).',
    };
  }

  return { valid: true, uri: uri.trim() };
}

/**
 * Get masked host/database target for safe logging without exposing passwords
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
 * Connect to MongoDB and start Express server asynchronously
 */
async function startServer() {
  const validation = validateMongoConfig();

  if (!validation.valid) {
    console.error('\n======================================================');
    console.error('❌ MONGODB CONFIGURATION ERROR');
    console.error('======================================================');
    console.error(`Issue: ${validation.reason}`);
    console.error('\n👉 Action Required:');
    console.error('1. Open file: backend/.env');
    console.error('2. Replace the placeholder in MONGO_URI with your actual MongoDB Atlas password.');
    console.error('   Expected format:');
    console.error('   MONGO_URI=mongodb+srv://Student06:<ACTUAL_PASSWORD>@cluster0.fcltfbm.mongodb.net/smart_attendance?retryWrites=true&w=majority');
    console.error('3. In MongoDB Atlas:');
    console.error('   - Go to Security → Database Access.');
    console.error('   - Verify user "Student06" exists (or create it with "Read and write to any database").');
    console.error('   - If you forgot the password, click "Edit" on user "Student06" and set a new password.');
    console.error('4. If your password contains special characters (@, :, #, %, etc.), URL-encode them.');
    console.error('======================================================\n');
    process.exit(1);
  }

  const sanitizedTarget = getSanitizedTarget(validation.uri);

  try {
    console.log(`Connecting to MongoDB Atlas target: ${sanitizedTarget}...`);
    await mongoose.connect(validation.uri);
    console.log(' Successfully connected to MongoDB Atlas');

    const server = app.listen(PORT, () => {
      console.log(` Server is running on http://localhost:${PORT}`);
    });

    return server;
  } catch (err) {
    console.error('\n======================================================');
    console.error('❌ MONGODB CONNECTION FAILED');
    console.error('======================================================');

    if (err.message && err.message.toLowerCase().includes('authentication failed')) {
      console.error('Root Cause: Invalid Credentials (Authentication Failed).');
      console.error('- The username "Student06" or the provided password does not match MongoDB Atlas.');
      console.error('- Go to MongoDB Atlas → Security → Database Access.');
      console.error('- Verify the user name is exactly "Student06" (case-sensitive).');
      console.error('- Reset the user password if necessary, and update backend/.env.');
      console.error('- Ensure characters such as "@", ":", "/", "#" in password are URL-encoded.');
    } else {
      console.error(`Error: ${err.message}`);
      console.error('- Verify Atlas Network Access (Security → Network Access) includes your current IP address.');
      console.error('- Verify cluster hostname "cluster0.fcltfbm.mongodb.net" is reachable.');
    }

    console.error('======================================================\n');
    process.exit(1);
  }
}

// Start the application
startServer();

export default app;
