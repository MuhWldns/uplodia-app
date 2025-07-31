import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
function sanitizeFilename(name) {
  return name

    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[<>:"/\\|?*#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function addWatermark(inputPath, outputDir, watermarkText, ffmpegPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    const safeFilename = sanitizeFilename(path.basename(inputPath))
    const outputPath = path.join(outputDir, safeFilename)
    const escapedText = watermarkText
      .replace(/[:\\]/g, '\\$&')
      .replace(/'/g, "\\'")
      .replace(/\n/g, ' ')

    // Perhatikan ' di sekeliling path dan \\ sebelum :
    const filter = `drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${escapedText}':fontsize=18:fontcolor=white@0.8:x=(w-text_w)/2:y=(h*0.6):shadowcolor=black@0.7:shadowx=2:shadowy=2`
    const args = ['-y', '-i', inputPath, '-vf', filter, '-c:a', 'copy', outputPath]
    const ffmpegProcess = spawn(ffmpegPath, args)

    ffmpegProcess.stderr.on('data', (data) => {
      // Kirim log progress ke main process jika mau
      // port.postMessage({ level: 'progress', message: data.toString() })
      console.log(`Input filename: ${path.basename(inputPath)}`)
      console.log(`Sanitized filename: ${safeFilename}`)

      console.log(`[FFMPEG_LOG]: ${data.toString()}`)
    })
    ffmpegProcess.on('close', (code) => {
      if (code === 0) resolve(outputPath)
      else reject(new Error(`Proses FFMPEG keluar dengan kode error ${code}`))
    })
    ffmpegProcess.on('error', (err) => reject(err))
  })
}

// Handler utama: menerima pesan lewat port, bukan argv!
async function run(port) {
  port.on('message', async (msg) => {
    const { inputPath, outputDir, watermarkText, ffmpegPath } = msg.data || {}
    console.log('[CHILD] MSG:', msg)
    console.log('[CHILD] Data diterima dari port:')
    console.log(`  -> Input: ${inputPath}`)
    console.log(`  -> Output: ${outputDir}`)
    console.log(`  -> FFMPEG: ${ffmpegPath}`)

    if (!inputPath || !outputDir || !ffmpegPath) {
      const errorMessage = 'FATAL: Data path tidak lengkap atau undefined.'
      console.error(errorMessage, { inputPath, outputDir, ffmpegPath })
      port.postMessage({ status: 'error', message: errorMessage })
      port.close()
      return
    }

    try {
      const resultPath = await addWatermark(inputPath, outputDir, watermarkText, ffmpegPath)
      port.postMessage({ status: 'success', outputPath: resultPath })
    } catch (error) {
      port.postMessage({ status: 'error', message: error.message })
    } finally {
      port.close()
    }
  })
  port.start()
}

// Inisialisasi child process untuk menerima port dari parent
if (process.type === 'utility') {
  process.parentPort.once('message', (event) => {
    const [port] = event.ports
    run(port)
  })
}
