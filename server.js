const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;
const CACHE_DIR = path.join(BASE_DIR, 'audio_cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);

  // Handle Vietnamese TTS API endpoint
  if (reqPath === '/api/tts') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const text = urlObj.searchParams.get('text');
    if (!text || !text.trim()) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Missing text parameter');
      return;
    }

    const cleanText = text.trim();
    const hash = crypto.createHash('md5').update(cleanText).digest('hex');
    const cacheFile = path.join(CACHE_DIR, `${hash}.mp3`);

    // 1. Serve from disk cache if exists
    if (fs.existsSync(cacheFile)) {
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(cacheFile).pipe(res);
      return;
    }

    // 2. Fetch native Vietnamese speech from Google TTS (tl=vi)
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    const ttsReq = https.get(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (ttsRes) => {
      if (ttsRes.statusCode !== 200) {
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('TTS provider returned error');
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      });

      const writeStream = fs.createWriteStream(cacheFile);
      ttsRes.pipe(writeStream);
      ttsRes.pipe(res);
    });

    ttsReq.on('error', (err) => {
      console.error('TTS fetch error:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error fetching TTS audio: ' + err.message);
    });
    return;
  }

  // Handle Static Files
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(BASE_DIR, reqPath);

  // Security: prevent directory traversal outside BASE_DIR
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const lanIp = getLocalIp();
  console.log('==============================================================');
  console.log('  BÉ MÂY — VƯƠNG QUỐC BĂNG LAM (Máy Chủ Local $0 Chi Phí)     ');
  console.log('==============================================================');
  console.log(`  Máy tính (Desktop):         http://localhost:${PORT}`);
  console.log(`  iPad / Điện thoại (Wi-Fi):  http://${lanIp}:${PORT}`);
  console.log('==============================================================');
  console.log('  Giọng đọc tiếng Việt:       /api/tts (Đã tích hợp chuẩn)');
  console.log('==============================================================');

  // Auto open browser on Windows
  if (process.platform === 'win32') {
    exec(`start http://localhost:${PORT}`);
  }
});
