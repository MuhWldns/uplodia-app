import { chromium } from 'playwright'
import { app } from 'electron'
import path, { resolve } from 'path'
import fs from 'fs'
import chalk from 'chalk'
import { __dirname } from '../utils/esm-path'
import { error } from 'console'
import { supabase } from './supabase/SupabaseClient'
import { getDeviceFingerprint } from './get-device-fingerprint'
import { Worker } from 'worker_threads'
import axios from 'axios'
import api from '../utils/api'
import { machine } from 'os'

function delay(min, max) {
  return Math.floor(Math.random() * (max - min) + 1 + min)
}

const log = (level, message, sender = null) => {
  const timestamp = new Date().toLocaleTimeString()
  const coloredTimestamp = chalk.gray(`[${timestamp}]`)
  const levelStr = level.toUpperCase()

  const colors = {
    INFO: chalk.cyan,
    START: chalk.magenta,
    SUCCESS: chalk.green,
    WAIT: chalk.yellow,
    ERROR: chalk.red
  }

  const color = colors[levelStr] || chalk.white
  console.log(`${coloredTimestamp} ${color.bold(`[${levelStr}]`)} ${color(message)}`)

  if (sender) {
    sender.send('tiktok-upload-log', {
      level: levelStr.toLowerCase(),
      message: message
    })
  }
}
const processWatermark = async (inputPath, outputDir, watermarkText, sender) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'worker', 'watermark.worker.js'), {
      workerData: { inputPath, outputDir, watermarkText }
    })
    log('start', `menambahkan watermark ke ${path.basename(inputPath)}`, sender)
    worker.on('message', (msg) => {
      if (msg.succes) {
        log('success', `watermark selesai untuk ${path.basename(inputPath)}`, sender)
        resolve(message.outputPath)
      } else {
        log(
          'error',
          `Gagal menambahkan watermark ke ${path.basename(inputPath)}: ${msg.error}`,
          sender
        )
        reject(new Error(msg.error))
      }
    })
    worker.on('error', (err) => {
      log('error', `Error pada worker: ${error.message}`, sender)
      reject(err)
    })
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stop with exit code ${code}`))
      }
    })
  })
}

export const tiktokAutoUpload = async (folderPath, sender, selectedSession, apiKey) => {
  if (!selectedSession) {
    throw new Error('Session tidak dipilih')
  }
  const profilePath = path.join(
    app.getPath('userData'),
    `sessions/${selectedSession}/storageState.json`
  )
  console.log(`menggunakan session ${selectedSession} di path ${profilePath}`)
  if (!fs.existsSync(profilePath)) {
    throw new Error(`File storageState.json tidak ditemukan untuk session: ${selectedSession}`)
  }
  const storageState = JSON.parse(fs.readFileSync(profilePath, 'utf-8'))
  if (!storageState.cookies || !storageState.origins) {
    throw new Error(`File storageState.json tidak valid untuk session: ${selectedSession}`)
  }

  const videoFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.mp4'))
  if (videoFiles.length === 0) {
    throw new Error('Tidak ada video .mp4 ditemukan di folder')
  }
  // console.log('🧪 storageState keys:', Object.keys(storageState))
  // console.log('🧪 storageState type:', typeof storageState)

  log('start', 'Membuka browser...')

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
    viewport: null
  })
  // console.log('typeof browser:', typeof browser)
  // console.log('typeof browser.newContext:', typeof browser?.newContext)
  // console.log('browser keys:', Object.keys(browser))
  const context = await browser.newContext({ storageState: profilePath })
  // console.log('typeof context:', typeof context)
  // console.log('context.newPage is function?', typeof context.newPage)

  const page = await context.newPage()
  await page.goto('https://www.tiktok.com/upload', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  })
  log('success', 'Upload page loaded.', sender)

  // const watermarkPromises = videoFiles.map((video) => {
  //   const inputPath = path.join(folderPath, video)
  //   return processWatermark(inputPath, outputDir, watermarkText, sender)
  // })

  let uploaded = 0

  for (let i = 0; i < videoFiles.length; i++) {
    const video = videoFiles[i]
    const fullPath = path.join(folderPath, video)
    log('start', `Upload (${i + 1}/${videoFiles.length}): ${video}`, sender)

    try {
      const fingerprintData = await getDeviceFingerprint()
      // const { data, error } = await supabase.rpc('increment_upload_count', {
      //   p_machine_id: fingerprintData.machine_id
      // })

      // if (error) {
      //   if (error.message.includes('Batas upload harian')) {
      //     log(
      //       'error',
      //       'Limit upload harian (5x) tercapai. Proses dihentikan. Hubungi Dev untuk unlock ',
      //       sender
      //     )
      //     break
      //   }
      //   throw new Error(error.message)
      // }
      const response = await api.post('/verify-upload', {
        machine_id: fingerprintData.machine_id,
        api_key: apiKey
      })

      if (response.data.status === 'error') {
        log('error', response.data.message, sender)
        if (response.data.message.includes('Batas Harian')) {
          log(
            'error',
            'Limit upload harian tercapai. Proses dihentikan. Hubungi Developer untuk unlock limit',
            sender
          )
          break
        }
        throw new Error(response.data.message)
      }
      await page.click('[data-e2e="select_video_button"]')
      await page.waitForTimeout(delay(1000, 7000))
      await page.setInputFiles('input[type="file"]', fullPath)
      await page.waitForSelector('div[class*="info-status success"]', { timeout: 300000 })
      await page.waitForTimeout(delay(1000, 5000))
      await page.click('button[data-e2e="post_video_button"]')
      log('success', `Upload selesai: ${video}`, sender)
      uploaded++

      if (i < videoFiles.length - 1) {
        await page.goto('https://www.tiktok.com/upload', { waitUntil: 'domcontentloaded' })
      }
    } catch (err) {
      log('error', `Gagal upload ${video}: ${err.message}`, sender)
      await page.goto('https://www.tiktok.com/upload', { waitUntil: 'domcontentloaded' })
    }
  }

  await page.waitForTimeout(10000)
  await browser.close()

  return {
    uploaded,
    total: videoFiles.length
  }
}
