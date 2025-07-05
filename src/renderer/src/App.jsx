import TiktokDashboard from './pages/TiktokDashboard'
import TiktokLoginDashboard from './pages/TiktokLoginDashboard'
import LoginPageUi from './pages/loginPage'
import { Route, Routes, HashRouter, Link } from 'react-router-dom'
export default function HomePage() {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LoginPageUi />}></Route>
          <Route path="/dashboard" element={<TiktokLoginDashboard />}></Route>
          <Route path="/tiktok-uploader" element={<TiktokDashboard />}></Route>
        </Routes>
      </HashRouter>
    </>
  )
}
