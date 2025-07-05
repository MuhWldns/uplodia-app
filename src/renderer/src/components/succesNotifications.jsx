import React, { useEffect, useState } from 'react'

import { FaCheckCircle } from 'react-icons/fa'

function SuccessNotification({ message, duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onClose) {
        onClose()
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg bg-green-600 text-white flex items-center space-x-3 z-50 animate-fade-in-up">
      <FaCheckCircle className="text-2xl" />
      <span className="text-lg font-medium">{message}</span>
    </div>
  )
}

export default SuccessNotification
