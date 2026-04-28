const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { spawn } = require('child_process');
const open = require('open');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const OPEN_BROWSER = process.env.OPEN_BROWSER === 'true';
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';
const AUTO_START_PYTHON = process.env.AUTO_START_PYTHON !== 'false';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const frontendDistDir = path.resolve(__dirname, '../frontend/dist');
let pythonProcess;

function log(level, message, meta = '') {
  const timestamp = new Date().toISOString();
  const suffix = meta ? ` ${meta}` : '';
  console.log(`[${timestamp}] [${level}] ${message}${suffix}`);
}

function isValidGeneratePayload(body) {
  if (!body || typeof body !== 'object') return false;

  const urlOk = !body.url || (typeof body.url === 'string' && body.url.length <= 2048);
  const textOk = !body.text || (typeof body.text === 'string' && body.text.length <= 100000);
  const voiceOk = !body.voice || (typeof body.voice === 'string' && body.voice.length <= 100);

  return urlOk && textOk && voiceOk;
}

function forwardRequest(req, res) {
  const target = new URL(PYTHON_API_URL);
  const client = target.protocol === 'https:' ? https : http;

  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port,
    method: req.method,
    path: req.originalUrl,
    headers: {
      ...req.headers,
      host: `${target.hostname}${target.port ? `:${target.port}` : ''}`,
    },
  };

  const proxyReq = client.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode || 500);
    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    });

    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (error) => {
    log('ERROR', 'Falha ao contactar backend Python.', error.message);
    res.status(502).json({
      detail: 'Serviço interno indisponível no momento. Verifique se o backend Python iniciou corretamente.',
    });
  });

  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
    proxyReq.end();
    return;
  }

  req.pipe(proxyReq, { end: true });
}

function startPythonBackend() {
  if (!AUTO_START_PYTHON) {
    log('INFO', 'AUTO_START_PYTHON=false. Backend Python não será iniciado automaticamente.');
    return;
  }

  const pythonCmd = process.env.PYTHON_CMD || 'python';
  const pythonMainPath = path.resolve(__dirname, 'main.py');

  if (!fs.existsSync(pythonMainPath)) {
    log('WARN', 'Arquivo main.py não encontrado. Ignore se API externa for usada.');
    return;
  }

  pythonProcess = spawn(pythonCmd, [pythonMainPath], {
    cwd: __dirname,
    stdio: 'ignore',
    windowsHide: true,
    detached: false,
  });

  pythonProcess.on('exit', (code) => {
    log('WARN', `Backend Python finalizado com código ${code}.`);
  });

  pythonProcess.on('error', (error) => {
    log('ERROR', 'Erro ao iniciar backend Python.', error.message);
  });

  log('INFO', 'Backend Python iniciado em background.');
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, host: HOST, port: PORT });
});

app.post('/api/generate', (req, res, next) => {
  if (!isValidGeneratePayload(req.body)) {
    return res.status(400).json({ detail: 'Payload inválido. Revise url/text/voice.' });
  }

  return next();
}, forwardRequest);

app.use('/api', forwardRequest);
app.use('/audio', forwardRequest);

if (fs.existsSync(frontendDistDir)) {
  app.use(express.static(frontendDistDir));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDistDir, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(503).send('Frontend não encontrado em frontend/dist. Rode npm run build:frontend.');
  });
}

const server = app.listen(PORT, HOST, async () => {
  const localUrl = `http://${HOST}:${PORT}`;
  log('INFO', `Servidor local ativo em ${localUrl}`);

  if (OPEN_BROWSER) {
    await open(localUrl);
    log('INFO', 'Navegador padrão aberto automaticamente.');
  }
});

startPythonBackend();

function shutdown() {
  log('INFO', 'Encerrando PrismAudio...');

  if (pythonProcess && !pythonProcess.killed) {
    pythonProcess.kill();
  }

  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
