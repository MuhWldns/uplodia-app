// @ts-ignore
import React, { useState, useEffect, useRef } from 'react'
import {
  FaTiktok,
  FaFolderOpen,
  FaCloudUploadAlt,
  FaPlus,
  FaExclamationTriangle
} from 'react-icons/fa'
import SuccessNotification from '../components/succesNotifications'
import Navbar from '../components/Navbar'
// @ts-ignore
import { Link } from 'react-router-dom'
import AddAccount from '../components/addAccount'
import SessionSelector from '../components/SessionSelector'

export default function TiktokDashboard() {
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [activationMessage, setActivationMessage] = useState('')
  const [premiumKey, setPremiumKey] = useState('')
  const [refreshSession, setRefreshSession] = useState(false)
  const [folderPath, setFolderPath] = useState('')
  const [videoFiles, setVideoFiles] = useState([])
  const [addWatermark, setAddWatermark] = useState(false)
  const [watermarkText, setWatermarkText] = useState('@NamaAnda')
  const [uploadStatusMessage, setUploadStatusMessage] = useState('')
  const [uploadStatusType, setUploadStatusType] = useState('info')
  const [showPopupNotification, setShowPopupNotification] = useState(false)
  const [showAddAccountModal, setShowAddAccountModal] = useState(false)
  // @ts-ignore
  const [account, setAccounts] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [logs, setLogs] = useState([])
  const logContainerRef = useRef(null)

  const handlePremiumKey = async () => {
    if (!premiumKey.trim()) {
      setShowActivationModal(true)
      setActivationMessage('Key Premium Tidak Boleh Kosong')
      setTimeout(() => {
        setShowActivationModal(false)
      }, 1000)

      return
    }
    try {
      setUploadStatusMessage('Memvalidasi premium key...')
      setUploadStatusType('info')
      const result = await window.electron.ipcRenderer.invoke('register-premium-key', {
        api_key: premiumKey.trim()
      })

      if (result.success) {
        setUploadStatusMessage(`✅ ${result.message}`)
        setUploadStatusType('success')

        // Optional: Show success modal
        setActivationMessage(result.message)
        setShowActivationModal(true)

        setTimeout(() => {
          setShowActivationModal(false)
        }, 3000)
      } else {
        setUploadStatusMessage(`Premium Keys Tidak Valid`)
        setUploadStatusType('error')

        setActivationMessage('Keys Tidak Valid Silahkan Hubungi Developer\n wa.me/089662443648')
        setShowActivationModal(true)

        setTimeout(() => {
          setShowActivationModal(false)
        }, 3000)
      }
    } catch (error) {
      console.error('Error activating premium:', error)
      setUploadStatusMessage(`Gagal aktivasi premium: ${error.message}`)
      setUploadStatusType('error')

      setActivationMessage('Terjadi kesalahan saat aktivasi premium')
      setShowActivationModal(true)

      setTimeout(() => {
        setShowActivationModal(false)
      }, 2000)
    }
  }

  const handleAddAccount = (alias) => {
    // @ts-ignore
    setAccounts((prevAccounts) => [...prevAccounts, alias])
    setRefreshSession((prev) => !prev)
    setShowAddAccountModal(false)
  }
  const handleSessionSelected = (session) => {
    setSelectedSession(session)
    console.log(`Session yang dipilih: ${session}`)
  }
  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      const handleUploadStatusUpdate = (response) => {
        setUploadStatusMessage(response.message)
        setUploadStatusType(response.success ? 'success' : 'error')
        setShowPopupNotification(!!response.popup)
      }

      const handleUploadLog = (_event, { level, message }) => {
        console.log('📦 Log diterima:', level, message)
        setLogs((prev) => [...prev, { level, message }])
      }

      const unsubscribeStatus = window.electron.ipcRenderer.on(
        'upload-status-update',
        handleUploadStatusUpdate
      )
      const unsubscribeLog = window.electron.ipcRenderer.on('tiktok-upload-log', handleUploadLog)

      // Cleanup kedua listener saat komponen di-unmount
      return () => {
        if (unsubscribeStatus) {
          window.electron.ipcRenderer.removeListener(
            'upload-status-update',
            handleUploadStatusUpdate
          )
        }

        if (unsubscribeLog) {
          window.electron.ipcRenderer.removeListener('tiktok-upload-log', handleUploadLog)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  const handleSelectFolder = async () => {
    setUploadStatusMessage('Membuka dialog pemilihan folder...')
    setUploadStatusType('info')
    setShowPopupNotification(false)

    try {
      const result = await window.electron.ipcRenderer.invoke('select-video-folder')

      if (result?.folderPath && result?.files) {
        setFolderPath(result.folderPath)

        setVideoFiles(result.files)

        setUploadStatusMessage(`Folder terpilih: ${result.folderPath}`)
        setUploadStatusType('success')
      } else {
        setFolderPath('')
        setVideoFiles([])
        setUploadStatusMessage('Pemilihan folder dibatalkan.')
        setUploadStatusType('info')
      }
    } catch (error) {
      console.error('Error selecting folder:', error)
      setUploadStatusMessage(`Gagal memilih folder: ${error.message}`)
      setUploadStatusType('error')
    }
  }
  const handleRemoveFile = (fileToRemove) => {
    setVideoFiles((prev) => prev.filter((file) => file !== fileToRemove))
  }

  const handleStartUpload = async () => {
    if (addWatermark && !watermarkText.trim()) {
      setUploadStatusMessage('Mohon isi teks watermark terlebih dahulu')
      setUploadStatusType('error')
      return
    }
    if (!selectedSession) {
      setUploadStatusMessage('Mohon pilih session terlebih dahulu.')
      setUploadStatusType('error')
      return
    }
    if (!folderPath) {
      setUploadStatusMessage('Mohon pilih folder video terlebih dahulu.')
      setUploadStatusType('error')
      return
    }

    setUploadStatusMessage('Memulai proses upload otomatis...')
    setUploadStatusType('info')
    setShowPopupNotification(false)
    const premiumStatus = await window.electron.ipcRenderer.invoke('get-premium-status')
    const uploadData = {
      folderPath,
      watermarkText: addWatermark ? watermarkText : '',
      selectedSession,
      apiKey: premiumStatus?.isPremium ? premiumStatus.apiKey : null
    }

    try {
      await window.electron.ipcRenderer.invoke('start-tiktok-upload', uploadData)
    } catch (error) {
      console.error('Error saat memicu upload:', error)
      setUploadStatusMessage(`Gagal memulai upload: ${error.message}`)
      setUploadStatusType('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-12">
      <Navbar className="flex justify-" />
      <nav className="bg-white shadow-md w-full max-w-10xl p-4 mb-8 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaTiktok className="text-2xl text-gray-800" />
            <h1 className="text-2xl font-bold text-gray-800">TikTok Uploader</h1>
          </div>
          <div className="flex items-center space-x-4">
            <SessionSelector onSessionSelected={handleSessionSelected} refreshed={refreshSession} />
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="bg-blue-600 p-2 m-1 rounded-xl text-white font-semibold w-17 h-12"
            >
              Tambah akun
            </button>
          </div>
        </div>
      </nav>
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            {/* <h2 className="text-xl font-semibold text-gray-800 mb-4">Tambah Akun TikTok</h2> */}
            <AddAccount
              onAccountAdded={handleAddAccount}
              onClose={() => setShowAddAccountModal(false)}
            />
          </div>
        </div>
      )}

      <main className="bg-white p-8 rounded-lg shadow-xl w-full max-w-5xl">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
          Mulai Upload Video TikTok
        </h2>
        <div className="mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={premiumKey}
              onChange={(e) => setPremiumKey(e.target.value)}
              placeholder="Masukan Key Untuk Menghapus Limit Harian"
              className="flex-grow shadow-sm border rounded py-2 px-3 text-gray-600 text-sm bg-gray-50"
            />
            <button
              onClick={handlePremiumKey}
              className="bg-gray-400 hover:bg-gray-500 text-white text-sm px-3 py-2 rounded"
            >
              Aktifkan
            </button>
          </div>
        </div>
        {showActivationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 text-center">
              <div className="mb-4">
                <div className="bg-red-100 rounded-full p-3 inline-block">
                  <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-gray-800 font-medium">{activationMessage}</p>
            </div>
          </div>
        )}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">Folder Video:</label>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              readOnly
              value={folderPath}
              placeholder="Pilih folder berisi video Anda..."
              className="flex-grow shadow-sm border rounded py-3 px-4 text-gray-700 bg-gray-50"
            />
            <button
              onClick={handleSelectFolder}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded"
            >
              <FaFolderOpen className="inline mr-2" /> Pilih Folder
            </button>
          </div>

          {folderPath && (
            <p className="mt-2 text-xs text-gray-500">Video akan diupload dari: {folderPath}</p>
          )}
        </div>
        {/* <Link to={'/'} className="text-black text-2xl">
          Balik dulu
        </Link> */}

        {videoFiles.length > 0 && (
          <div className="grid grid-cols-7 gap-6 mb-6">
            {videoFiles.map((file, index) => (
              <div key={index} className="border rounded shadow overflow-hidden">
                <video
                  src={`file://${folderPath}/${file}`}
                  controls
                  className="w-full h-40 object-cover"
                />
                <p className="text-xs text-gray-600 p-2 truncate">{file}</p>

                {/* <button
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                  onClick={handleRemoveFile}
                >
                  hapus
                </button> */}
              </div>
            ))}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="addWatermark"
              checked={addWatermark}
              onChange={(e) => setAddWatermark(e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="addWatermark" className="text-gray-700 font-medium">
              Tambahkan Watermark Teks
            </label>
          </div>

          {addWatermark && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="watermarkText"
                  className="block text-gray-700 text-sm font-medium mb-2"
                >
                  Teks Watermark:
                </label>
                <input
                  type="text"
                  id="watermarkText"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Misal: @NamaAkunAnda"
                  className="w-full shadow-sm border rounded py-3 px-4 text-gray-700 bg-gray-50"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    // Logic untuk add watermark standalone
                    console.log('Processing watermark...')
                  }}
                  className="bg-blue-500 hover:bg-blue-800 text-white font-semibold py-2 px-2 rounded flex items-center space-x-2 text-sm"
                >
                  <FaPlus className="text-sm" />
                  <span>Tambah Watermark</span>
                </button>
              </div>

              {folderPath && (
                <p className="mt-2 text-xs text-gray-500">
                  Video akan diproses dari: {folderPath} → hasil disimpan ke folder "output"
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleStartUpload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center space-x-2"
        >
          <FaCloudUploadAlt className="text-xl" />
          <span>Mulai Upload Otomatis</span>
        </button>

        {uploadStatusMessage && (
          <p
            className={`mt-4 text-sm font-medium text-center ${
              uploadStatusType === 'success'
                ? 'text-green-600'
                : uploadStatusType === 'error'
                  ? 'text-red-600'
                  : 'text-blue-600'
            }`}
          >
            {uploadStatusMessage}
          </p>
        )}

        <div
          ref={logContainerRef}
          className="mt-6 bg-white text-black p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-sm drop-shadow-sm"
        >
          {logs.length === 0 ? (
            <p className="text-green-600">Belum ada log.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`mb-1`}>
                <span
                  className={
                    log.level === 'error'
                      ? 'text-red-400'
                      : log.level === 'success'
                        ? 'text-green-400'
                        : log.level === 'start'
                          ? 'text-yellow-400'
                          : 'text-blue-400'
                  }
                >
                  [{log.level.toUpperCase()}]
                </span>{' '}
                {log.message}
              </div>
            ))
          )}
        </div>

        {showPopupNotification && (
          <SuccessNotification
            message="Proses upload dimulai!"
            onClose={() => setShowPopupNotification(false)}
          />
        )}
      </main>
    </div>
  )
}
