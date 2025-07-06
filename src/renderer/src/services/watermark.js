import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'

export const addWatermark = (inputPath, outputDir, watermarkText = '@mywatermark') => {
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
          fontsize: 24,
          fontcolor: 'white',
          x: 10,
          y: '(h-text_h)-10',
          box: 1,
          boxcolor: 'black@0.5',
          boxborderw: 5
        }
      })
      .outputOptions('-c:a copy') // copy audio tanpa encode ulang
      .on('end', () => {
        resolve(outputPath)
      })
      .on('error', (err) => {
        reject(err)
      })
      .save(outputPath)
  })
}
