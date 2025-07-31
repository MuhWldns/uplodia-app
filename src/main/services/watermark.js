// import { Worker } from 'worker_threads'
// import fs from 'fs'
// import path from 'path'

// import Piscina from 'piscina'
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

// // src/main/services/watermark.js
// export async function calledWorker() {
//   try {
//     console.log('🔧 Creating Piscina pool...')

//     // Create Piscina instance
//     const piscina = new Piscina({
//       filename: path.join(__dirname, 'akuworker.js'),
//       esm: true,
//       maxThreads: 4,
//       minThreads: 1
//     })

//     console.log('🔧 Piscina pool created successfully')

//     // Test dengan simple data
//     const testData = {
//       message: 'Hello from main process!',
//       timestamp: new Date().toISOString()
//     }

//     console.log('🔧 Sending task to worker:', testData)

//     // Run task di worker
//     const result = await piscina.run(testData)

//     console.log('🔧 Received result from worker:', result)

//     // Cleanup
//     await piscina.destroy()

//     return result
//   } catch (error) {
//     console.error('🔧 Piscina error:', error)
//     throw error
//   }
// }
// // export async function processBatchWatermark({
// //   inputFolder,
// //   outputFolder,
// //   watermarkText,
// //   videoFiles,
// //   onProgress,
// //   onLog
// // }) {
// //   const workers = []
// //   const maxWorkers = 4
// //   const results = []
// //   const errors = []
// //   let completed = 0

// //   return new Promise((resolve, reject) => {
// //     let taskIndex = 0

// //     function createWorker() {
// //       if (taskIndex >= videoFiles.length) return

// //       const fileName = videoFiles[taskIndex++]
// //       const inputPath = path.join(inputFolder, fileName)

// //       const worker = new Worker(path.join(__dirname, '/worker/watermark.worker.js'))
// //       const workerPath = path.resolve(__dirname, '/worker/watermawrk.worker.js')
// //       console.log(workerPath)
// //       workers.push(worker)

// //       worker.postMessage({
// //         inputPath,
// //         outputDir: outputFolder,
// //         watermarkText
// //       })

// //       worker.on('message', (data) => {
// //         if (data.type === 'log') {
// //           onLog?.(data.level, data.message)
// //         } else if (data.type === 'progress') {
// //           // Progress per video
// //         } else if (data.type === 'result') {
// //           completed++
// //           const progress = Math.round((completed / videoFiles.length) * 100)
// //           onProgress?.(progress)

// //           if (data.success) {
// //             results.push({
// //               original: data.fileName,
// //               watermarked: data.fileName,
// //               outputPath: data.outputPath
// //             })
// //           } else {
// //             errors.push({ fileName: data.fileName, error: data.error })
// //           }

// //           worker.terminate()

// //           if (completed === videoFiles.length) {
// //             resolve({
// //               success: true,
// //               totalFiles: videoFiles.length,
// //               successCount: results.length,
// //               errorCount: errors.length,
// //               processedFiles: results,
// //               errors
// //             })
// //           } else {
// //             createWorker()
// //           }
// //         }
// //       })

// //       worker.on('error', (error) => {
// //         completed++
// //         errors.push({ fileName, error: error.message })
// //         worker.terminate()

// //         if (completed === videoFiles.length) {
// //           resolve({
// //             success: true,
// //             totalFiles: videoFiles.length,
// //             successCount: results.length,
// //             errorCount: errors.length,
// //             processedFiles: results,
// //             errors
// //           })
// //         } else {
// //           createWorker()
// //         }
// //       })
// //     }

// //     for (let i = 0; i < Math.min(maxWorkers, videoFiles.length); i++) {
// //       createWorker()
// //     }
// //   })
// // }
