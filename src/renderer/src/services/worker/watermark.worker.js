import { addWatermark } from '../watermark'
import { parentPort, workerData } from 'worker_threads'
;(async () => {
  try {
    const { inputPath, outputDir, watermarkText } = workerData
    const outputPath = await addWatermark(inputPath, outputDir, watermarkText)
    parentPort.postMessage({ success: true, outputPath })
  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message })
  }
})()
