import { FaTiktok } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import SuccessNotification from '../components/succesNotifications'
import { useEffect, useState } from 'react'
export default function TiktokLoginDashboard() {
  const [loginStatusMessage, setLoginStatusMessage] = useState('')
  const [loginStatusType, setLoginStatusType] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const navigate = useNavigate()
  const [inputAlias, setInputAlias] = useState('')
  console.log('TiktokLoginDashboard dirender. showNotification saat ini:', showNotification) // LOG A

  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      const handleLoginStatusUpdate = (response) => {
        setLoginStatusMessage(response.message)
        setLoginStatusType(response.success ? 'success' : 'error')
        console.log(`status login adalah ${response}`)
        if (response.success) {
          setShowNotification(true)
          console.log(response)
        }
      }

      const unsubscribe = window.electron.ipcRenderer.on(
        'login-status-update',
        handleLoginStatusUpdate
      )

      return () => {
        if (unsubscribe) {
          unsubscribe()
        }
      }
    }
  }, [navigate])

  const handleStartLogin = () => {
    if (!inputAlias.trim()) {
      setLoginStatusMessage('Alias tidak boleh kosong.')
      setLoginStatusType('error')
      setShowNotification(false)
      return
    }

    setLoginStatusMessage('Memulai proses login...')
    setLoginStatusType('info')
    setShowNotification(false)
    console.log('LOG D: handleStartLogin dipanggil. showNotification diset ke FALSE.') // LOG D

    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer
        .invoke('start-log', { alias: inputAlias }) // Kirim alias ke proses utama
        .then((res) => {
          console.log('LOG E: Invoke start-log selesai, hasil:', res)
          setLoginStatusMessage(res.message)
          setShowNotification(true)
          if (res.success) {
            setTimeout(() => {
              navigate('/tiktok-uploader')
            }, 1500)
          }
        })
        .catch((err) => {
          console.error('LOG F: Error saat invoke start-log:', err)
          setLoginStatusMessage(`Gagal memuat browser: ${err.message}`)
          setLoginStatusType('error')
          setShowNotification(false)
        })
    }
  }
  return (
    <>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Navbar */}
        <nav className="bg-white shadow-md p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FaTiktok className="text-2xl text-gray-800" />
              <h1 className="text-2xl font-bold text-gray-800">TikTok</h1>
            </div>

            <div></div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Kelola Akun TikTok Anda</h2>
            <p className="text-black text-sm mb-8">
              Masukkan alias untuk akun TikTok Anda, lalu klik tombol di bawah ini untuk memulai
              proses login.
            </p>
            <input
              type="text"
              placeholder="Masukkan alias akun"
              value={inputAlias}
              onChange={(e) => setInputAlias(e.target.value)}
              className="w-full mb-4 px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md
                       transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              onClick={handleStartLogin}
            >
              Klik di sini untuk login akun TikTok Anda
            </button>

            <Link to={'/'} className="text-blue-600 font-bold py-4 text-sm inline-block">
              Kembali
            </Link>
            <p className="text-xs text-gray-500 mt-2">
              Pastikan Anda sudah login untuk melanjutkan.
            </p>
            <p className="text-xs text-blue-700 mt-2 font-bold">or</p>
            <Link
              to={'/tiktok-uploader'}
              className="text-gray-500 font-extrabold py-4 text-sm inline-block"
            >
              I Have Session
            </Link>
          </div>
        </main>
        {loginStatusMessage && (
          <p
            className={`mt-4 text-sm font-medium ${
              loginStatusType === 'success'
                ? 'text-green-600'
                : loginStatusType === 'error'
                  ? 'text-red-600'
                  : 'text-blue-600'
            }`}
          >
            {loginStatusMessage}
          </p>
        )}
        {showNotification && (
          <SuccessNotification
            message="Login berhasil!"
            onClose={() => setShowNotification(false)}
          />
        )}

        {/* Optional: Footer */}
        {/* <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2025 TikTok Manager</p>
      </footer> */}
      </div>
    </>
  )
}
