import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { log } from 'console'

// ✅ FIX: Menambahkan 'return' agar fungsi mengembalikan nilai yang sudah bersih
function sanitizeFilename(name) {
  return name
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[<>:"/\\|?*#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function addWatermark(port, inputPath, outputDir, watermarkText, ffmpegPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    const safeFilename = sanitizeFilename(path.basename(inputPath))
    const outputPath = path.join(outputDir, safeFilename)

    // ✅ IMPROVEMENT: Kirim status 'memulai' hanya sekali di awal
    port.postMessage({
      type: 'status',
      file: safeFilename,
      message: `Memproses Video: ${safeFilename}...`
    })

    const escapedText = watermarkText
      .replace(/[:\\]/g, '\\$&')
      .replace(/'/g, "\\'")
      .replace(/\n/g, ' ')

    const filter = `drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${escapedText}':fontsize=24:fontcolor=white@0.8:x=(w-text_w)/2:y=(h*0.6)`
    const args = ['-y', '-i', inputPath, '-vf', filter, '-c:a', 'copy', outputPath]
    const ffmpegProcess = spawn(ffmpegPath, args)

    ffmpegProcess.stderr.on('data', (data) => {
      const logMessage = data.toString()
      if (logMessage.trim().lenght > 0) {
        port.postMessage({ type: 'progress', file: safeFilename, log: logMessage.trim() })
      }
    })

    ffmpegProcess.on('error', (err) => {
      // Menangani error jika proses spawn itu sendiri gagal
      reject(err)
    })

    ffmpegProcess.stdout.on('data', (data) => {
      console.log(data, 'ini dari stdout')
    })

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath)
      } else {
        reject(new Error(`Proses FFMPEG keluar dengan kode error ${code}`))
      }
    })
  })
}

async function run(port) {
  port.on('message', async (msg) => {
    const { inputPath, outputDir, watermarkText, ffmpegPath } = msg.data || {}

    if (!inputPath || !outputDir || !ffmpegPath) {
      const errorMessage = 'FATAL: Data path tidak lengkap.'
      port.postMessage({ type: 'error', message: errorMessage })
      port.close() // Tutup port jika ada error fatal di awal
      return
    }

    try {
      const resultPath = await addWatermark(port, inputPath, outputDir, watermarkText, ffmpegPath)
      // ✅ IMPROVEMENT: Kirim pesan sukses yang jelas
      port.postMessage({
        type: 'success',
        outputPath: resultPath,
        message: `Selesai: ${path.basename(resultPath)}`
      })
      console.log(`${resultPath} ini result`)
    } catch (error) {
      // ✅ IMPROVEMENT: Kirim pesan error yang jelas
      port.postMessage({ type: 'error', message: error.message })
    }
  })
  port.start()
}

if (process.type === 'utility') {
  process.parentPort.once('message', (event) => {
    const [port] = event.ports
    run(port)
  })
}
