import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRouter from './routes/ai.js';
import jobsRouter from './routes/jobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Custumu-Key'],
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Custumu Enterprise Document API',
    domain: 'custumu.com',
    timestamp: new Date().toISOString(),
    engine: {
      libreoffice: 'available',
      ghostscript: 'available',
      tesseractOcr: 'available',
      bullmq: 'ready',
    },
  });
});

// Mount Routes
app.use('/api/ai', aiRouter);
app.use('/api/jobs', jobsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`[Custumu API] Server listening on http://localhost:${PORT}`);
});
