import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AutoUpdateNotification } from '../components/UpdateNotifications'

export default function WelcomePage() {
  const navigate = useNavigate()

  const handleStart = async () => {
    const response = await window.electron.ipcRenderer.invoke('save-device-fingerprint')
    if (response.success) {
      console.log('fingerprint saved')
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-tl from-gray-900 via-blue-800 to-gray-900 text-white">
      <AutoUpdateNotification />
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4 tracking-wide">
          Welcome to Social Media Automation Tool
        </h1>
        <p className="text-base font-light mb-8 text-gray-300">
          Simplify and automate your social media tasks with ease.
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-all duration-300"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}
