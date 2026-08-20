const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hidden',
    frame: process.platform !== 'win32',
    backgroundColor: '#ffffff',
    show: false,
  })

  const url = isDev
    ? 'http://localhost:3000'
    : "file://" + path.join(__dirname, '../out/index.html')

  mainWindow.loadURL(url)
  mainWindow.once('ready-to-show', () => mainWindow.show())
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
ipcMain.handle('get-platform', () => process.platform)