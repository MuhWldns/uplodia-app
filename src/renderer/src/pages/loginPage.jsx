import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function LoginPageUi() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success', 'error', 'info'

  const handleSubmit = (e) => {
    e.preventDefault() // Mencegah refresh halaman saat submit

    if (!email || !password) {
      setMessage('Email and password cannot be empty.')
      setMessageType('error')
      return
    }

    setMessage('Simulating login attempt...')
    setMessageType('info')

    // Ini hanya simulasi. Di aplikasi nyata, Anda akan mengirim ini ke backend Anda.
    setTimeout(() => {
      if (email === 'user@example.com' && password === 'password123') {
        setMessage('Login successful! Redirecting...')
        setMessageType('success')
        // Di sini Anda akan mengarahkan user ke dashboard atau halaman lain
        // console.log('Login successful for:', email);
      } else {
        setMessage('Invalid email or password.')
        setMessageType('error')
      }
    }, 1500) // Simulasi delay jaringan
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Selamat Datang Di Sosmed Automation Tool
        </h2>

        <h3 className="text-black text-center opacity-70">Silahkan login</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              Email address
            </label>
            <input
              type="email"
              id="email"
              className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Link
            to="/dashboard"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out text-center inline-block"
          >
            Login
          </Link>
        </form>

        {message && (
          <p
            className={`mt-6 text-center text-sm font-medium ${
              messageType === 'error'
                ? 'text-red-600'
                : messageType === 'success'
                  ? 'text-green-600'
                  : 'text-blue-600'
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-6 text-center">
          <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  )
}
