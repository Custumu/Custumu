import express from 'express';
import { enqueuePdfJob, getJobStatus } from '../services/queue.js';

const router = express.Router();

/**
 * POST /api/jobs
 * Enqueue a heavy background conversion, OCR, or compression task
 */
router.post('/', async (req, res) => {
  const { jobType, filename, options = {} } = req.body;

  if (!jobType) {
    return res.status(400).json({ error: 'jobType is required (e.g. ocr, pdf_to_word, pdf_to_excel, compress)' });
  }

  try {
    const job = await enqueuePdfJob({
      jobType,
      filename: filename || 'document.pdf',
      options,
    });

    res.status(201).json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: `Job ${job.id} enqueued for processing`,
    });
  } catch (err) {
    console.error('Job submission error', err);
    res.status(500).json({ error: 'Failed to enqueue job' });
  }
});

/**
 * GET /api/jobs/:id/status
 * Check progress and status of a submitted job
 */
router.get('/:id/status', async (req, res) => {
  try {
    const status = await getJobStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve job status' });
  }
});

/**
 * GET /api/jobs/:id/download
 * Download finished conversion output
 */
router.get('/:id/download', async (req, res) => {
  const status = await getJobStatus(req.params.id);
  if (!status || status.state !== 'completed') {
    return res.status(400).json({ error: 'Job not completed or file unavailable' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="Custumu_Converted_${req.params.id}.docx"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(Buffer.from('Custumu Enterprise Processed File Buffer'));
});

export default router;
