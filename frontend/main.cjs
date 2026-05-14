const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

// Determinamos si estamos en desarrollo
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Zoom dinámico: Laptop (<1600px) vs Monitor (>1600px)
  const initialZoom = screenWidth < 1600 ? -1.0 : -0.5;

  const win = new BrowserWindow({
    width: Math.min(1400, Math.floor(screenWidth * 0.9)),
    height: Math.min(1000, Math.floor(screenHeight * 0.9)),
    title: "Scrittapp",
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    show: false, // Empezamos ocultos para evitar el flash negro
    icon: path.join(__dirname, 'public/logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.webContents.setZoomLevel(initialZoom);

  if (isDev) {
    win.loadURL('http://127.0.0.1:3000');
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, 'dist/index.html');
    win.loadFile(indexPath).catch(err => {
      console.error("Fallo al cargar:", err);
    });
  }

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
