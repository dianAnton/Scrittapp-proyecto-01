const { app, BrowserWindow, screen, shell } = require('electron');
const path = require('path');

// Deep linking
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('scrittapp', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('scrittapp')
}

let mainWindow;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const initialZoom = screenWidth < 1600 ? -1.0 : -0.5;

  mainWindow = new BrowserWindow({
    width: Math.min(1400, Math.floor(screenWidth * 0.9)),
    height: Math.min(1000, Math.floor(screenHeight * 0.9)),
    title: "Scrittapp",
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    show: false,
    icon: path.join(__dirname, 'public/logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.webContents.setZoomLevel(initialZoom);

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:3000');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, 'dist/index.html');
    mainWindow.loadFile(indexPath).catch(err => {
      console.error("Fallo al cargar:", err);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      
      const url = commandLine.pop()
      if (url && url.startsWith('scrittapp://')) {
        mainWindow.webContents.send('auth-callback', url)
      }
    }
  })

  app.whenReady().then(createWindow);
}

app.on('open-url', (event, url) => {
  event.preventDefault()
  if (mainWindow) {
    mainWindow.webContents.send('auth-callback', url)
  }
})

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
