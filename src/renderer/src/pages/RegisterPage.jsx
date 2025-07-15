import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success', 'error', 'info'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setMessage('All fields are required.')
      setMessageType('error')
      return
    }

    setMessage('Registering...')
    setMessageType('info')

    try {
      const response = await window.electron.ipcRenderer.invoke('register', {
        email,
        password
      })

      if (response.success) {
        setMessage('Registration successful! Redirecting...')
        setMessageType('success')
        setTimeout(() => {
          navigate('/dashboard') // Redirect to login page
        }, 1500)
      } else {
        setMessage(response.message || 'Registration failed. Please try again.')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('An error occurred during registration.')
      setMessageType('error')
      console.error('Registration error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Create an Account</h2>

        <form onSubmit={handleSubmit}>
          {/* <div className="mb-6">
            <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div> */}

          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              Email Address
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

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out text-center inline-block"
          >
            Register
          </button>
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
          <Link to="./" className="text-blue-600 hover:text-blue-800 text-sm">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  )
}
