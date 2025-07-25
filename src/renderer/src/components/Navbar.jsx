import React from 'react'
import { FaTiktok } from 'react-icons/fa'
import { MdOutlineWaterDrop } from 'react-icons/md'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="bg-white shadow-md w-full max-w-6xl p-4 mb-8 rounded-lg">
      <div className="flex justify-start items-center space-x-4">
        {/* Navigation Buttons Only */}
        <Link
          to="/tiktok-uploader"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
            location.pathname === '/tiktok-uploader'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FaTiktok className="text-lg" />
          <span>TikTok Upload</span>
        </Link>

        <Link
          to="/add-watermark"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
            location.pathname === '/add-watermark'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MdOutlineWaterDrop className="text-lg" />
          <span>Add Watermark</span>
        </Link>
      </div>
    </nav>
  )
}
