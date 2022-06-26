
// Modules to control application life and create native browser window
const { app, shell, BrowserWindow, dialog } = require('electron')
const path = require('path')


// Handle sylloge links
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('sylloge', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('sylloge')
}


// MAIN WINDOW
let mainWindow = null
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron_preload.js')
    }
  })
  console.log(__dirname)

  // and load the index.html of the app.
  mainWindow.loadFile('dist/index.html')

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  mainWindow.webContents.on("new-window", function(event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('open-url', (event, url) => {
    mainWindow.webContents.send('sylloge-link', url)
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
  })

})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.