const { app, BrowserWindow } = require('electron');
const path = require('path');

// Determinamos si estamos en desarrollo
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 900,
    title: "Scrittapp",
    autoHideMenuBar: true,
    backgroundColor: '#000000', // Color inicial para evitar destellos blancos
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Simplificamos para desarrollo inicial
    },
    // Estética Premium: Quitamos el marco si quieres un look más app (opcional)
    // frame: false, 
  });

  if (isDev) {
    // Apuntamos al servidor de Vite
    win.loadURL('http://localhost:3000');
    // Abrimos herramientas de desarrollo opcionalmente
    // win.webContents.openDevTools();
  } else {
    // Cuando esté compilado, cargamos el archivo local
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
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
