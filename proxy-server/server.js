const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

// Use dynamic import for node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  const app = express();
  const port = process.env.PORT || 5001;

  // Middleware
  app.use(express.json());
  // Define __dirname for CommonJS
  const __dirname = path.dirname(__filename);
  const buildPath = path.join(__dirname, '../splitscreen-main/build');

  // Verify build path exists to prevent ENOENT errors
  if (!fs.existsSync(buildPath)) {
    console.warn(`Build path ${buildPath} does not exist. Ensure the directory is correct.`);
  }
  app.use(express.static(buildPath));

  // Configure CORS with specific origins
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:3000', // Frontend local development
          'http://localhost:3001', // Additional local port if needed
          'http://localhost:5173', // Common Vite port
          'https://your-app.vercel.app', // Replace with your Vercel production URL
          'https://*.vercel.app', // Allow Vercel preview URLs (use cautiously)
        ];
        if (!origin || allowedOrigins.some(allowed => 
          allowed.includes('*') ? new RegExp(allowed.replace('*', '.*')).test(origin) : allowed === origin
        )) {
          callback(null, true);
        } else {
          console.error(`CORS rejected origin: ${origin}`);
          callback(new Error('CORS policy violation'));
        }
      },
      credentials: true,
    })
  );

  // Configure multer for in-memory storage
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
      }
    },
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB limit
      files: 1, // Limit to single file upload
    },
  });

  // Proxy endpoint
  app.get('/proxy', async (req, res) => {
    const { url } = req.query;

    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
      const parsedUrl = new URL(url);
      // Restrict to http/https protocols to prevent SSRF
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`Proxy GET request for URL: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 30000, // 30s timeout to prevent hanging
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');

      console.log(`Content-Type: ${contentType}`);

      if (contentType.includes('text/html')) {
        let browser;
        try {
          browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
            timeout: 60000, // 60s timeout for browser launch
          });
          const page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
          await page.waitForFunction(
            'window.performance && window.performance.timing.loadEventEnd > 0',
            { timeout: 30000 }
          );
          const content = await page.content();
          res.send(content);
        } catch (error) {
          throw new Error(`Puppeteer error: ${error.message}`);
        } finally {
          if (browser) await browser.close();
        }
      } else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        const arrayBuffer = await response.arrayBuffer();
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        response.body.pipe(res);
      }
    } catch (error) {
      console.error(`Error fetching URL ${url}:`, error.message);
      res.status(500).json({ error: `Error fetching URL: ${error.message}` });
    }
  });

  // File upload endpoint
  app.post('/upload', upload.single('file'), async (req, res) => {
    console.log(
      `Proxy POST upload with content type: ${req.headers['content-type']}, length: ${req.headers['content-length']}`
    );
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(req.file.originalname)}"`);

      if (req.file.mimetype.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        const { value: html } = await mammoth.convertToHtml({ buffer: req.file.buffer });
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        res.setHeader('Content-Type', req.file.mimetype);
        res.send(req.file.buffer);
      }
    } catch (error) {
      console.error('Error processing file:', error.message);
      res.status(500).json({ error: `Error processing file: ${error.message}` });
    }
  });

  // Global error handling middleware
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Start server
  app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
  });
})();