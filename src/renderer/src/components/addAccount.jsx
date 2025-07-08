import React, { useState } from 'react'

export default function AddAccount({ onAccountAdded, onClose }) {
  const [inputAlias, setInputAlias] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState('')

  const handleAddAccount = () => {
    if (!inputAlias.trim()) {
      setStatusMessage('Alias tidak boleh kosong.')
      setStatusType('error')
      return
    }

    setStatusMessage('Memulai proses login...')
    setStatusType('info')

    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer
        .invoke('start-log', { alias: inputAlias }) // Kirim alias ke proses utama
        .then((res) => {
          setStatusMessage(res.message)
          setStatusType(res.success ? 'success' : 'error')
          if (res.success && onAccountAdded) {
            onAccountAdded(inputAlias) // Callback untuk menambahkan akun ke daftar
          }
        })
        .catch((err) => {
          setStatusMessage(`Gagal memuat browser: ${err.message}`)
          setStatusType('error')
        })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Tambah Akun TikTok</h2>

      <input
        type="text"
        placeholder="Masukkan alias akun"
        value={inputAlias}
        onChange={(e) => setInputAlias(e.target.value)}
        className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
      />

      <button
        className="mb-4 mr-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md
               transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        onClick={handleAddAccount}
      >
        Tambah Akun
      </button>

      {statusMessage && (
        <p
          className={`mb-4 text-sm font-medium ${
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

      <button
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md
               transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        onClick={onClose}
      >
        Tutup
      </button>
    </div>
  )
}
