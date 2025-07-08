import React, { useState, useEffect } from 'react'

export default function SessionSelector({ onSessionSelected, refreshed }) {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState('')

  useEffect(() => {
    const fetchSessions = async () => {
      if (window.electron && window.electron.ipcRenderer) {
        const activeSessions = await window.electron.ipcRenderer.invoke('check-tiktok-session')
        setSessions(activeSessions)
      }
    }

    fetchSessions()
  }, [refreshed])

  const handleSessionChange = (event) => {
    const session = event.target.value
    setSelectedSession(session)
    if (onSessionSelected) {
      onSessionSelected(session) // Callback untuk mengirim session yang dipilih
    }
  }

  return (
    <div className="mb-4">
      <label htmlFor="sessionDropdown" className="block text-gray-700 font-medium mb-2">
        Pilih Akun:
      </label>
      <select
        id="sessionDropdown"
        value={selectedSession}
        onChange={handleSessionChange}
        className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled>
          -- Pilih Session --
        </option>
        {sessions.map((session, index) => (
          <option key={index} value={session}>
            {session}
          </option>
        ))}
      </select>
    </div>
  )
}
