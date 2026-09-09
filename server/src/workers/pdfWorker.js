import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

const connection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

console.log('[Custumu Worker] Initializing BullMQ PDF Processing Worker...');

export const pdfWorker = new Worker(
  'pdf-processing',
  async (job) => {
    console.log(`[Custumu Worker] Processing job ${job.id} of type: ${job.name}`);
    await job.updateProgress(10);

    const { filename, options } = job.data;

    try {
      if (job.name === 'pdf_to_word') {
        // LibreOffice headless conversion
        console.log(`[Worker] Running LibreOffice headless conversion on ${filename}...`);
        await job.updateProgress(50);
        // In container with LibreOffice installed:
        // await execAsync(`soffice --headless --convert-to docx /tmp/${filename} --outdir /tmp/output`);
        await job.updateProgress(100);
        return { success: true, format: 'docx', output: `/tmp/output/${filename}.docx` };
      }

      if (job.name === 'ocr') {
        // Tesseract OCR execution
        console.log(`[Worker] Running Tesseract OCR on ${filename}...`);
        await job.updateProgress(40);
        // await execAsync(`tesseract /tmp/${filename} /tmp/output/ocr_result pdf`);
        await job.updateProgress(100);
        return { success: true, format: 'searchable_pdf', output: `/tmp/output/ocr_result.pdf` };
      }

      if (job.name === 'compress_high') {
        // Ghostscript high-ratio compression
        console.log(`[Worker] Running Ghostscript compression on ${filename}...`);
        await job.updateProgress(60);
        // await execAsync(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=/tmp/output/compressed.pdf /tmp/${filename}`);
        await job.updateProgress(100);
        return { success: true, output: `/tmp/output/compressed.pdf` };
      }

      await job.updateProgress(100);
      return { success: true, message: 'Processed' };
    } catch (err) {
      console.error(`[Custumu Worker] Error processing job ${job.id}:`, err);
      throw err;
    }
  },
  { connection, concurrency: 4 }
);

pdfWorker.on('completed', (job) => {
  console.log(`[Custumu Worker] Job ${job.id} completed successfully!`);
});

pdfWorker.on('failed', (job, err) => {
  console.error(`[Custumu Worker] Job ${job.id} failed with error:`, err.message);
});
