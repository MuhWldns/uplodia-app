import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import path from 'path'
import fs from 'fs'
import { promises as fsPromises } from 'fs'

import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { userAuth } from '../renderer/src/services/tiktok-auth'
import { tiktokAutoUpload } from '../renderer/src/services/tiktok-auto-upload.js'

let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('start-log', async (event) => {
    try {
      const authen = await userAuth()
      if (mainWindow && mainWindow) {
        event.sender.send('tiktok-login-update', {
          success: true,
          message: 'berhasil login',
          sessionData: authen
        })

        return {
          success: true,
          message: 'berhasil login',
          sessionData: authen
        }
      }
    } catch (error) {
      console.error(error)
      return {
        success: false,
        message: `login gagal ${error.message}`
        // sessionData: authen
      }
    }
  })

  ipcMain.handle('select-video-folder', async (event) => {
    let selectedPath = null
    let videoFiles = []
    try {
      console.log('[main process], menerima permintaan "select-video-folder"')
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'pilih folder video anda',
        properties: ['openDirectory']
      })
      if (!result.canceled && result.filePaths.length > 0) {
        selectedPath = result.filePaths[0]
        console.log(`folder terpilih ${selectedPath}`)
        const filesInFolder = await fsPromises.readdir(selectedPath)
        const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv']
        videoFiles = filesInFolder.filter((file) => {
          const ext = path.extname(file).toLowerCase()
          return videoExtensions.includes(ext)
        })
        console.log(`[Main Process] Menemukan ${videoFiles.length} file video di folder terpilih.`)
      } else {
        console.log('pemilihan folder dibatalkan')
      }
      return {
        folderPath: selectedPath,
        files: videoFiles
      }
    } catch (error) {
      console.error(`eror saat membuka file ${error.message}`)
      console.error(
        `[Main Process] Error dalam pemilihan folder atau pembacaan file: ${error.message}`,
        error
      )
      // Melemparkan error agar .catch() di sisi renderer bisa menangkapnya
      throw new Error(`Gagal memproses pemilihan folder: ${error.message}`)
    }
  })

  ipcMain.handle('get-video-preview', async (event, { folderPath, fileName }) => {
    const filePath = path.join(folderPath, fileName)
    try {
      const data = await fs.promises.readFile(filePath)
      const base64 = data.toString('base64')
      const ext = path.extname(fileName).slice(1) // contoh: mp4
      return `data:video/${ext};base64,${base64}`
    } catch (err) {
      console.error('Gagal membaca file:', err)
      return null
    }
  })

  ipcMain.handle('start-tiktok-upload', async (event, payload) => {
    const { folderPath } = payload || {}
    if (!folderPath || typeof folderPath !== 'string') {
      const message = 'Folder path tidak valid atau kosong.'
      console.error(message)
      event.sender.send('upload-status-update', {
        popup: false,
        success: false,
        message
      })
      return { success: false, message }
    }
    try {
      const result = await tiktokAutoUpload(folderPath, event.sender)
      event.sender.send('upload-status-update', {
        popup: true,
        success: true,
        message: `Upload selesai: ${result.uploaded}/${result.total} video berhasil`
      })
      return result
    } catch (error) {
      console.error(error)
      event.sender.send('upload-status-update', {
        popup: false,
        success: false,
        message: `eror upload ${error.message}`
      })
    }
  })
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
