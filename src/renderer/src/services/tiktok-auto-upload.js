import { chromium } from 'playwright'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
import { __dirname } from '../utils/esm-path'

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

export const tiktokAutoUpload = async (folderPath, sender) => {
  const profilePath = path.join(app.getPath('userData'), 'sessions/user1')
  console.log(profilePath)

  const videoFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.mp4'))
  if (videoFiles.length === 0) {
    throw new Error('Tidak ada video .mp4 ditemukan di folder')
  }

  log('start', 'Membuka browser...')
  const browser = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
    viewport: null
  })

  const page = await browser.newPage()
  await page.goto('https://www.tiktok.com/upload', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  })
  log('success', 'Upload page loaded.', sender)

  let uploaded = 0

  for (let i = 0; i < videoFiles.length; i++) {
    const video = videoFiles[i]
    const fullPath = path.join(folderPath, video)
    log('start', `Upload (${i + 1}/${videoFiles.length}): ${video}`, sender)

    try {
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
