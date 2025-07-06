import path from 'path'
import { chromium } from 'playwright'
import { __dirname } from '../utils/esm-path.js'
import fs from 'fs'
import { app } from 'electron'
import { sleep } from '../helper/sleep.js'

export const userAuth = async () => {
  const sessionPath = path.join(app.getPath('userData'), 'sessions/user1')
  const sessionExists = fs.existsSync(sessionPath)
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true })
  }
  try {
    const browser = await chromium.launchPersistentContext(sessionPath, {
      headless: false,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled'],
      viewport: null
    })

    const page = await browser.newPage()
    await page.goto('https://www.tiktok.com/login')
    console.log('Silahkan login dalam 30 detik')
    await page.waitForTimeout(3000)
    browser.close()

    return sessionExists
  } catch (error) {
    console.error(error.message)
  }
}
