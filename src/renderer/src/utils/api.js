import axios from 'axios'

/** @type {import('axios').AxiosInstance} */
const api = axios.create({
  baseURL: `https://uplodia.muhwldns.me/`,
  headers: { 'Content-Type': 'application/json' }
})

export default api
