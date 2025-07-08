import fs from 'fs'
import { app } from 'electron'
import path from 'path'

export const getActiveSession = () => {
  const sessionPath = path.join(app.getPath('userData'), 'sessions')
  try {
    if (!fs.existsSync(sessionPath)) {
      console.log('file session tidak ditemukan')
      return []
    }

    return fs
      .readdirSync(sessionPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
  } catch (error) {
    console.error('eror nich', error)
    return []
  }
}
