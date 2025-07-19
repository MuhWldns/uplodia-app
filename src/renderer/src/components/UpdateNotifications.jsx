import React, { useState, useEffect } from 'react'

export const AutoUpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      const updateAvailableListener = () => {
        setUpdateAvailable(true)
      }

      const downloadProgressListener = (event, progress) => {
        setProgress(progress.percent.toFixed(2))
      }

      window.electron.ipcRenderer.on('update-available', updateAvailableListener)
      window.electron.ipcRenderer.on('download-progress', downloadProgressListener)

      return () => {
        window.electron.ipcRenderer.removeListener('update-available', updateAvailableListener)
        window.electron.ipcRenderer.removeListener('download-progress', downloadProgressListener)
      }
    }
  }, [])
  if (!updateAvailable) {
    return null
  }

  return (
    <div>
      <h2>Pembaruan Tersedia!</h2>
      {progress && <p>Progress unduhan {progress}%</p>}
      <p>Aplikasi Akan diperbarui Setelah unduhan selesai</p>
    </div>
  )
}
