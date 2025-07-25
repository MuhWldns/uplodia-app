import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'

export const log = (level, message, sender = null) => {
  console.log(`[${level.toUpperCase()}] ${message}`)
  if (sender) {
    sender.send('watermark-log', { level, message })
  }
}

export const addWatermark = (inputPath, outputDir, watermarkText = '', sender = null) => {
  return new Promise((resolve, reject) => {
    const filename = path.basename(inputPath)
    const outputPath = path.join(outputDir, filename)

    // Buat folder output jika belum ada
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    ffmpeg(inputPath)
      .videoFilters({
        filter: 'drawtext',
        options: {
          text: watermarkText,
          fontsize: 18, // ✅ 18px
          fontcolor: 'white@0.8', // ✅ Putih 80% opacity
          x: '(w-text_w)-20', // ✅ Kanan bawah
          y: '(h-text_h)-20' // ✅ Kanan bawah
          // ❌ Hapus box karena cuma mau text
        }
      })
      .outputOptions('-c:a copy')
      .on('start', (commandLine) => {
        // ✅ Log start dengan log function
        log('info', `🎬 Starting: ${filename}`, sender)
      })
      .on('progress', (progress) => {
        // ✅ Log progress dengan log function
        const percent = Math.round(progress.percent || 0)
        log('progress', `⏳ ${filename}: ${percent}%`, sender)
      })
      .on('end', () => {
        // ✅ Log success dengan log function
        log('success', `✅ Completed: ${filename}`, sender)
        resolve(outputPath)
      })
      .on('error', (err) => {
        // ✅ Log error dengan log function
        log('error', `❌ Failed: ${filename} - ${err.message}`, sender)
        reject(err)
      })
      .save(outputPath)
  })
}
