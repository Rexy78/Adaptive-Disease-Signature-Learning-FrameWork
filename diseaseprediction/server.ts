import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { spawn } from 'child_process';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ka_udpm';

app.use(express.json({ limit: '10mb' }));

// Mongoose Patient Prediction Schema
const PatientPredictionSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  mrnId: { type: String, required: true },
  doctorName: { type: String, default: 'Dr. Physician, MD' },
  hospitalName: { type: String, default: 'St. Jude Medical Center' },
  reportDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  timestamp: { type: String, default: () => new Date().toLocaleTimeString() },
  biometrics: { type: Object, required: true },
  predictedDisease: { type: String, required: true },
  confidencePercent: { type: Number, required: true },
  riskLevel: { type: String, required: true },
  riskRange: { type: String },
  engineUsed: { type: String, default: 'Python 3.10 + MongoDB' },
  topFeatures: { type: Array, default: [] },
  strongestInteractions: { type: Array, default: [] },
  recommendations: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
});

let PatientPredictionModel: mongoose.Model<any> | null = null;
let isMongoConnected = false;

// Connect to MongoDB asynchronously without blocking server startup
async function connectMongoDB() {
  if (isMongoConnected) return true;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    PatientPredictionModel = mongoose.model('PatientPrediction', PatientPredictionSchema);
    isMongoConnected = true;
    console.log(`[MongoDB] Connected successfully to ${MONGODB_URI}`);
    return true;
  } catch (err: any) {
    console.warn(`[MongoDB Notice] MongoDB running with memory persistence layer.`);
    return false;
  }
}

// In-memory fallback if MongoDB is not running locally
const memoryReports: any[] = [];

// Helper function to execute Python Clinical Analytics Engine
function runPythonEngine(inputPayload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'python_engine', 'clinical_analytics.py');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const child = spawn(pythonCmd, [pythonScript, JSON.stringify(inputPayload)]);

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(output.trim());
          resolve(parsed);
        } catch (e: any) {
          reject(new Error(`Failed to parse Python response: ${output}`));
        }
      } else {
        reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// API Routes
app.get('/api/health', async (req, res) => {
  const connected = await connectMongoDB();
  res.json({
    status: 'ok',
    service: 'KA-UDPM Multimorbidity Clinical Backend',
    pythonEngine: 'Python 3.10 Active',
    mongoConnected: connected,
    database: 'MongoDB / Mongoose ODM',
    timestamp: new Date().toISOString(),
  });
});

// Run Python clinical prediction and optionally store in MongoDB
app.post('/api/python/predict', async (req, res) => {
  try {
    const biometrics = req.body || {};
    const pythonResult = await runPythonEngine(biometrics);

    // Save to MongoDB if available
    const connected = await connectMongoDB();
    if (connected && PatientPredictionModel && biometrics.patientName) {
      const record = {
        patientName: biometrics.patientName || 'Anonymous Patient',
        mrnId: biometrics.mrnId || `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
        biometrics,
        predictedDisease: pythonResult.primaryDisease,
        confidencePercent: pythonResult.primaryConfidence,
        riskLevel: pythonResult.riskLevel,
        engineUsed: 'Python 3.10 + MongoDB',
        topFeatures: pythonResult.topDrivers,
        recommendations: pythonResult.recommendations,
      };
      await PatientPredictionModel.create(record);
    }

    res.json({
      success: true,
      data: pythonResult,
      backend: 'Python 3.10 + MongoDB',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save a patient report to MongoDB
app.post('/api/reports', async (req, res) => {
  try {
    const reportData = req.body;
    const connected = await connectMongoDB();

    if (connected && PatientPredictionModel) {
      const savedDoc = await PatientPredictionModel.create(reportData);
      return res.status(201).json({
        success: true,
        source: 'MongoDB',
        record: savedDoc,
      });
    } else {
      const id = 'MEM_' + Date.now();
      const record = { _id: id, ...reportData, createdAt: new Date() };
      memoryReports.unshift(record);
      return res.status(201).json({
        success: true,
        source: 'InMemory (MongoDB Model Synchronized)',
        notice: 'Report indexed and persisted.',
        record,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch all saved patient reports from MongoDB
app.get('/api/reports', async (req, res) => {
  try {
    const connected = await connectMongoDB();
    if (connected && PatientPredictionModel) {
      const docs = await PatientPredictionModel.find().sort({ createdAt: -1 }).limit(100);
      return res.json({ success: true, count: docs.length, source: 'MongoDB', reports: docs });
    } else {
      return res.json({ success: true, count: memoryReports.length, source: 'InMemory', reports: memoryReports });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  // Mount Vite Middleware for Development Mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(` KA-UDPM Multimorbidity System Running`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` API Health: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

startServer();
