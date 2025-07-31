import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { utilityProcess, MessageChannelMain } from 'electron'
import pkg from 'electron-store'
import path, { join, resolve } from 'path'
import forkPath from '../main/services/child/addwatermark.child.js?modulePath'
import fs from 'fs'
import { fork } from 'child_process'
import updaterModule from 'electron-updater'
const updater = updaterModule.autoUpdater

import { promises as fsPromises } from 'fs'
import { supabase } from './services/supabase/SupabaseClient.js'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import pLimit from 'p-limit'
import { userAuth } from './services/tiktok-auth.js'
import { tiktokAutoUpload } from './services/tiktok-auto-upload.js'
import { getActiveSession } from './services/get-tiktok-session.js'
import api from './utils/api.js'
import { login, register, logout, getCurrentUser } from './services/supabase/authservice.js'
import { getDeviceFingerprint } from './services/get-device-fingerprint.js'
import {
  savePremiumToStorage,
  validatePremiumKey,
  getPremiumFromStorage
} from './services/premium-services.js'
import { fileURLToPath } from 'url'

// import { calledWorker } from './services/watermark.js'
import os from 'os'
import Ffmpeg from 'fluent-ffmpeg'

import { rejects } from 'assert'
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
let mainWindow
const Store = pkg.default || pkg
const store = new Store()
const ffmpegPath =
  process.env.NODE_ENV === 'development'
    ? path.resolve('./resources/ffmpeg.exe')
    : path.join(process.resourcesPath, 'ffmpeg.exe')

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
      sandbox: false,
      devTools: true
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
function setAutoUpdater() {
  updater.auto = true
  updater.autoInstallOnAppQuit = true

  updater.on('update-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available')
    }
  })
  updater.on('update-not-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available')
    }
  })

  // Event: Proses download pembaruan
  updater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progress)
    }
  })

  updater.on('update-downloaded', () => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Pembaruan Tersedia',
        message: 'Pembaruan telah diunduh. Aplikasi akan diperbarui setelah Anda keluar.',
        buttons: ['Keluar dan Perbarui']
      })
      .then((result) => {
        if (result.response === 0) {
          updater.quitAndInstall()
        }
      })
  })

  updater.on('error', (error) => {
    console.error('Error saat pembaruan:', error)
    if (mainWindow) {
      mainWindow.webContents.send('update-error', error.message)
    }
  })

  updater.checkForUpdatesAndNotify()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.uplodia.app')
  setAutoUpdater()
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.handle('register', async (event, { email, password }) => {
    try {
      const { data, error } = await register(email, password)
      if (error) {
        throw new Error()
      }

      return { success: true, user: data }
    } catch (error) {
      console.error(error.message)
    }
  })

  // ipcMain.handle('test-worker', async () => {
  //   try {
  //     console.log('🔧 Starting worker test...')
  //     const result = await calledWorker()
  //     console.log('🔧 Worker test result:', result)
  //     return result // ✅ Return result to renderer
  //   } catch (error) {
  //     console.error('🔧 Worker test error:', error)
  //     return {
  //       success: false,
  //       error: error.message
  //     }
  //   }
  // })

  // src/main/index.js - Replace your entire handler

  // index.js
  // index.js (Handler tes sementara)

  // index.js (Gunakan kode final ini)

  // index.js

  // index.js (Versi Final Sesuai Dokumentasi)

  // index.js

  ipcMain.handle(
    'process-watermark-batch',
    async (event, { inputFolder, outputFolder, watermarkText, videoFiles }) => {
      const maxConcurrent = Math.max(2, os.cpus().length - 1)
      const limitCount = Math.min(videoFiles.length, maxConcurrent)
      const limit = pLimit(limitCount)

      try {
        const results = await Promise.allSettled(
          videoFiles.map((filename, idx) =>
            limit(
              () =>
                new Promise((resolve, reject) => {
                  const { port1, port2 } = new MessageChannelMain()
                  const child = utilityProcess.fork(forkPath)
                  port2.start()

                  // Kirim port ke child
                  child.postMessage({}, [port1])
                  const finalOutputDir = path.join(inputFolder, 'output')
                  // Kirim data watermark ke child lewat port2

                  if (!fs.existsSync(ffmpegPath)) {
                    console.error('FFMPEG binary tidak ditemukan:', ffmpegPath)
                  }
                  port2.postMessage({
                    inputPath: path.join(inputFolder, filename),
                    outputDir: finalOutputDir,
                    watermarkText,
                    ffmpegPath
                  })

                  // Handle pesan dari child
                  port2.on('message', (e) => {
                    const data = e.data
                    // Kirim log ke renderer
                    event.sender.send('watermark-log', {
                      fileName: filename,
                      index: idx + 1,
                      total: videoFiles.length,
                      level: data.level || data.status || 'info',
                      message: data.message
                    })
                    // Sukses/gagal
                    if (data.status === 'success') {
                      resolve({ fileName: filename, ...data })
                      child.kill()
                    }
                    if (data.status === 'error') {
                      reject(new Error(`[${filename}] ${data.message}`))
                      child.kill()
                    }
                  })

                  // Handle child exit error
                  child.on('exit', (code) => {
                    if (code !== 0) {
                      reject(new Error(`Child process keluar tak terduga dengan kode ${code}`))
                    }
                  })
                })
            )
          )
        )
        return { success: true, results }
      } catch (error) {
        return { success: false, message: error.message }
      }
    }
  )
  // ipcMain.handle(
  //   'process-watermark-batch',
  //   async (event, { inputFolder, outputFolder, watermarkText, videoFiles }) => {
  //     const maxConcurrent = Math.max(2, os.cpus().length - 1)
  //     const limitCount = Math.min(videoFiles.length, maxConcurrent)
  //     const limit = pLimit(limitCount)

  //     try {
  //       const results = await Promise.allSettled(
  //         videoFiles.map((filename) =>
  //           limit(
  //             () =>
  //               new Promise((resolve, reject) => {
  //                 const { port1, port2 } = new MessageChannelMain()
  //                 const child = utilityProcess.fork(forkPath)

  //                 child.on('exit', (code) => {
  //                   // Jika child mati sebelum promise selesai, reject promise
  //                   if (code !== 0) {
  //                     reject(
  //                       new Error(`Child process keluar secara tak terduga dengan kode ${code}`)
  //                     )
  //                   }
  //                 })

  //                 port2.on('message', (e) => {
  //                   const data = e.data

  //                   // ✅ TANGANI SINYAL READY DARI CHILD
  //                   if (data.type === 'ready') {
  //                     // Setelah child siap, baru kirim data tugasnya
  //                     port2.postMessage({
  //                       data: {
  //                         inputPath: path.join(inputFolder, filename),
  //                         outputDir: outputFolder,
  //                         watermarkText,
  //                         ffmpegPath
  //                       }
  //                     })
  //                   } else if (data.type === 'done') {
  //                     // Tangani pesan selesai
  //                     if (data.status === 'success') {
  //                       resolve({ status: 'fulfilled', value: { filename, ...data } })
  //                     } else {
  //                       reject(new Error(`[${filename}] ${data.message}`))
  //                     }
  //                     child.kill()
  //                   } else if (data.type === 'progress') {
  //                     // Tangani pesan progres
  //                     event.sender.send('watermark-log', {
  //                       level: data.level || 'info',
  //                       message: `[${filename}] ${data.message}`
  //                     })
  //                   }
  //                 })

  //                 port2.start()
  //                 // Hanya kirim port-nya saja terlebih dahulu
  //                 child.postMessage({}, [port1])
  //               })
  //           )
  //         )
  //       )
  //       return { success: true, results }
  //     } catch (error) {
  //       return { success: false, message: error.message }
  //     }
  //   }
  // )
  ipcMain.handle('save-device-fingerprint', async (event, fingerprint) => {
    try {
      const fingerprintData = await getDeviceFingerprint()
      if (!fingerprintData) {
        throw new Error('Failed to retrieve device fingerprint.')
      }

      const response = await api.post(`/register`, {
        machine_id: fingerprintData.machine_id,
        hostname: fingerprintData.hostname,
        ip_address: fingerprintData.ip_address,
        platform: fingerprintData.platform
      })

      return {
        success: true,
        message: 'device registered'
      }
      // if (error) {
      //   throw new Error(error.message)
      // }
    } catch (error) {
      console.error(`error saving ${error}`)
      return { success: false, message: error.message }
    }
  })
  ipcMain.handle('login', async (event, { email, password }) => {
    try {
      console.log('Received login request:', email, password)
      const { data, error } = await login(email, password)
      console.log('Login response:', { data, error })

      if (error) {
        throw new Error(error.message)
      }
      return { success: true, user: data }
    } catch (error) {
      console.error('Login error:', error.message)
      return { success: false, message: error.message || 'Login failed.' }
    }
  })
  ipcMain.handle('check-tiktok-session', async () => {
    try {
      const session = getActiveSession()
      return session
    } catch (error) {
      console.error('Error saat mendapatkan session aktif:', error)
      return []
    }
  })
  ipcMain.handle('start-log', async (event, { alias }) => {
    try {
      if (!alias || typeof alias !== 'string' || alias.trim() === '') {
        throw new Error('Alias tidak valid atau kosong.')
      }
      console.log(`memulai proses login dengan ${alias}`)
      const authen = await userAuth(alias)
      if (mainWindow && mainWindow) {
        event.sender.send('tiktok-login-update', {
          success: true,
          message: 'berhasil login',
          sessionData: authen
        })

        return {
          success: true,
          message: 'berhasil login untuk',
          alias,
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

  ipcMain.handle('register-premium-key', async (event, { api_key }) => {
    try {
      if (!api_key || !api_key.trim()) {
        return {
          success: false,
          message: 'API key tidak boleh kosong'
        }
      }
      const validationResult = await validatePremiumKey(api_key.trim())

      if (!validationResult.success) {
        return {
          success: false,
          message: validationResult.message
        }
      }

      if (validationResult.valid) {
        const { machine_id } = await getDeviceFingerprint()
        const premiumData = {
          apiKey: api_key.trim(),
          isPremium: true,
          activatedAt: new Date().toISOString(),
          machineId: machine_id
        }

        const saveResult = savePremiumToStorage(store, premiumData)
        if (saveResult.success) {
          return {
            success: true,
            message: validationResult.message
          }
        } else {
          return {
            success: false,
            message: 'Validasi berhasil dilakukan tetapi gagal di simpan'
          }
        }
      } else {
        return {
          success: false,
          message: validationResult.message,
          isPremium: false
        }
      }
    } catch (error) {
      console.error('Error in register-premium-key:', error)
      return {
        success: false,
        message: 'Terjadi kesalahan saat aktivasi premium'
      }
    }
  })
  ipcMain.handle('get-premium-status', async (event) => {
    try {
      const result = getPremiumFromStorage(store)
      return result.data
    } catch (error) {
      console.error('Error getting premium status:', error)
      return { isPremium: false }
    }
  })

  ipcMain.handle('clear-premium-data', async (event) => {
    try {
      store.delete('premium')
      return { success: true, message: 'Premium data berhasil dihapus' }
    } catch (error) {
      console.error('Error clearing premium data:', error)
      return { success: false, message: 'Gagal menghapus data premium' }
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
    const { folderPath, selectedSession } = payload || {}
    if (!selectedSession || typeof selectedSession !== 'string') {
      const message = 'Session tidak valid atau kosong.'
      console.error(message)
      event.sender.send('upload-status-update', {
        popup: false,
        success: false,
        message
      })
      return { success: false, message }
    }
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
      const premiumStatus = getPremiumFromStorage(store)
      const apiKey = premiumStatus.data?.isPremium ? premiumStatus.data.apiKey : null
      const result = await tiktokAutoUpload(folderPath, event.sender, selectedSession, apiKey)

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
        message: `Eror upload ${error.message}`
      })
      return { success: false, message: error.message }
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
