const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const APP_URL = `http://${HOST}:${PORT}`;

let backendProcess;

function waitForServer(maxRetries = 50, delayMs = 200) {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const check = async () => {
      try {
        const response = await fetch(`${APP_URL}/api/health`);
        if (response.ok) return resolve();
      } catch {
        // servidor ainda subindo
      }

      retries += 1;
      if (retries >= maxRetries) {
        reject(new Error('Servidor local não iniciou a tempo.'));
        return;
      }

      setTimeout(check, delayMs);
    };

    check();
  });
}

function startBackend() {
  const backendEntry = path.join(__dirname, '..', 'backend', 'server.js');

  backendProcess = spawn(process.execPath, [backendEntry], {
    env: {
      ...process.env,
      OPEN_BROWSER: 'false',
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: 'pipe',
    windowsHide: true,
  });

  const fs = require('fs');
  const logStream = fs.createWriteStream(path.join(app.getPath('userData'), 'backend_error.log'), { flags: 'a' });
  
  backendProcess.stdout.pipe(logStream);
  backendProcess.stderr.pipe(logStream);
  
  backendProcess.on('exit', (code) => {
    logStream.write(`Backend exited with code ${code}\n`);
  });
}

async function createWindow() {
  startBackend();
  await waitForServer();

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#09090b',
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  await mainWindow.loadURL(APP_URL);
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(createWindow).catch((error) => {
  console.error(error.message);
  app.quit();
});

app.on('window-all-closed', () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
