import path from 'path'
import { chromium } from 'playwright'
import { __dirname } from '../utils/esm-path.js'
import fs from 'fs'
import { app } from 'electron'
import { error } from 'console'

export const userAuth = async (accountId) => {
  if (!accountId) {
    throw new Error('Account id is required')
  }
  const sessionPath = path.join(app.getPath('userData'), `sessions/${accountId}`)
  const storageStatePath = path.join(sessionPath, `storageState.json`)
  const sessionExists = fs.existsSync(sessionPath)

  try {
    const browser = await chromium.launch({
      headless: false,
      channel: 'chrome',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      viewport: null
    })
    const context = await browser.newContext({
      storageState: fs.existsSync(storageStatePath) ? storageStatePath : undefined
    })
    const page = await context.newPage()

    await page.goto('https://www.tiktok.com/login')
    console.log(`Silahkan login dengan pengguna ${accountId} `)

    const isLogin = await page.waitForSelector('main[id="main-content-homepage_hot"]', {
      timeout: 120000
    })
    if (isLogin) {
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true })
      }
      context.storageState({ path: storageStatePath })
      console.log(`data login disimpan ${storageStatePath}`)
      console.log('menutup browser dalam 3 detik')
      await page.waitForTimeout(3000)
      await browser.close()
    } else {
      console.error('login gagal')
      throw new error('login gagal, profile hilang')
    }
  } catch (error) {
    console.error(error.message)
  }
}
