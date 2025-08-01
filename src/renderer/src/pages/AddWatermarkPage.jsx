import React, { useState, useRef, useEffect } from 'react'
import { FaFolderOpen, FaPlay, FaPlus, FaExternalLinkAlt } from 'react-icons/fa'
import Navbar from '../components/Navbar'

export default function AddWatermarkPage() {
  const [inputFolderPath, setInputFolderPath] = useState('')
  const [watermarkText, setWatermarkText] = useState('@YourUsername')
  const [videoFiles, setVideoFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState('info')
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState([])
  const logContainerRef = useRef(null)

  const handleSelectInputFolder = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-video-folder')
      if (result.folderPath) {
        setInputFolderPath(result.folderPath)
        setVideoFiles(result.files)
        setStatusMessage(`Found ${result.files.length} video files`)
        setStatusType('success')
      }
    } catch (error) {
      console.error('Error selecting folder:', error)
      setStatusMessage('Failed to select folder')
      setStatusType('error')
    }
  }

  const handleProcessWatermark = async () => {
    if (!inputFolderPath || !watermarkText.trim() || videoFiles.length === 0) {
      setStatusMessage('Please select input folder and enter watermark text')
      setStatusType('error')
      return
    }

    setIsProcessing(true)
    setProcessedFiles([])
    setProgress(0)
    setLogs([])
    setStatusMessage('Starting watermark processing...')
    setStatusType('info')

    try {
      const outputPath = `${inputFolderPath}/output`
      // const result = await window.electron.ipcRenderer.invoke('process-watermark-batch', outputPath)
      // console.log(result)

      const result = await window.electron.ipcRenderer.invoke('process-watermark-batch', {
        inputFolder: inputFolderPath,
        outputFolder: outputPath,
        watermarkText: watermarkText.trim(),
        videoFiles: videoFiles
      })
      console.log(result)
      if (result.success) {
        setProcessedFiles(result.results || [])
        setStatusMessage(
          `Successfully processed ${result.results ? result.results.filter((r) => r.status === 'success').length : 0} videos`
        )
        setStatusType('success')
        setProgress(100)
        setIsProcessing(false)
      } else {
        setStatusMessage(`Processing failed: ${result.message}`)
        setStatusType('error')
      }
    } catch (error) {
      console.error('Error processing watermark:')
      setStatusMessage(`Processing failed: ${message}`)
      setStatusType('error')
    } finally {
      setIsProcessing(false)
    }
  }

  // const handleOpenOutputFolder = async () => {
  //   if (inputFolderPath) {
  //     const outputPath = `${inputFolderPath}/output`
  //     try {
  //       await window.electron.ipcRenderer.invoke('open-folder', outputPath)
  //     } catch (error) {
  //       console.error('Error opening folder:', error)
  //       setStatusMessage('Failed to open output folder')
  //       setStatusType('error')
  //     }
  //   }
  // }

  useEffect(() => {
    const handleWatermarkLog = (event, { level, message, progress: progressValue }) => {
      console.log('watermark-log event received:', { level, message })
      setLogs((prev) => [
        ...prev,
        {
          level,
          message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])

      if (message.includes('Selesai:')) {
        setIsProcessing(false)
        setStatusMessage('Selesai')
      }
      if (level === 'error') {
        setIsProcessing(false)
        setStatusMessage(message)
      }

      if (progressValue !== undefined) {
        setProgress(progressValue)
      }

      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
      }
    }

    window.electron?.ipcRenderer?.on('watermark-log', handleWatermarkLog)

    return () => {
      window.electron?.ipcRenderer?.removeListener('watermark-log', handleWatermarkLog)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-12">
      <Navbar />

      <main className="bg-white p-8 rounded-lg shadow-xl w-full max-w-6xl">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
          Add Watermark to Videos
        </h2>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Input Folder (Videos):
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              readOnly
              value={inputFolderPath}
              placeholder="Select folder containing your videos..."
              className="flex-grow shadow-sm border rounded py-3 px-4 text-gray-700 bg-gray-50"
            />
            <button
              onClick={handleSelectInputFolder}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded flex items-center space-x-2"
            >
              <FaFolderOpen className="text-lg" />
              <span>Select Input</span>
            </button>
          </div>
          {inputFolderPath && (
            <p className="mt-2 text-sm text-gray-500">Found {videoFiles.length} video files</p>
          )}
        </div>

        {inputFolderPath && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              📁 <strong>Output Location:</strong> Processed videos will be saved to:
              <br />
              <code className="bg-blue-100 px-2 py-1 rounded text-xs mt-1 inline-block">
                {inputFolderPath}/output
              </code>
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">Watermark Text:</label>
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Enter your watermark text (e.g., @YourUsername)"
            className="w-full shadow-sm border rounded py-3 px-4 text-gray-700"
            disabled={isProcessing}
          />
        </div>

        <div className="mb-6">
          <button
            onClick={handleProcessWatermark}
            disabled={
              isProcessing || !inputFolderPath || !watermarkText.trim() || videoFiles.length === 0
            }
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center space-x-2"
          >
            <FaPlay className="text-lg" />
            <span>{isProcessing ? 'Processing...' : 'Start Watermark Processing'}</span>
          </button>
        </div>

        {/* {isProcessing && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">{progress}% complete</p>
          </div>
        )} */}

        {statusMessage && (
          <p
            className={`mb-4 text-sm font-medium text-center ${
              statusType === 'success'
                ? 'text-green-600'
                : statusType === 'error'
                  ? 'text-red-600'
                  : 'text-blue-600'
            }`}
          >
            {statusMessage}
          </p>
        )}

        <div
          ref={logContainerRef}
          className="mb-6 bg-gray-900 text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-sm"
        >
          <h3 className="text-white font-semibold mb-2">Processing Logs:</h3>
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-400 text-xs">[{log.timestamp}]</span>{' '}
                <span className="text-white">{log.message}</span>
              </div>
            ))
          )}
        </div>

        {/* {processedFiles.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-green-800 mb-2">✅ Processing Complete!</h3>
            <p className="text-green-700 mb-3">
              Successfully processed {processedFiles.length} videos with watermark.
            </p>
            <div className="text-sm text-green-600 mb-3">
              <p>
                📁 Output saved to:{' '}
                <code className="bg-green-100 px-1 rounded">{inputFolderPath}/output</code>
              </p>
            </div>
            <button
              onClick={handleOpenOutputFolder}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded flex items-center space-x-2"
            >
              <FaExternalLinkAlt className="text-sm" />
              <span>Open Output Folder</span>
            </button>
          </div>
        )} */}
      </main>
    </div>
  )
}
