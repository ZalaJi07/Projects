import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Manager from './components/Manager'
import Navbar from './components/Navbar'
import Auth from './components/auth/auth.jsx'
import PublicList from './components/PublicList'
import ServerWakeUp from './components/ServerWakeUp'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/AdminDashboard'
import AiringCalendar from './pages/AiringCalendar'


function App() {

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#2C3E50',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#E67E22', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#e74c3c', secondary: '#fff' },
          },
        }}
      />
      <ServerWakeUp>
        <div onContextMenu={(e) => e.preventDefault()} className="flex flex-col min-h-screen md:h-screen md:overflow-hidden">
          <Navbar />
          <Routes>
            <Route path="/" element={<Manager />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/list/:username" element={<PublicList />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/calendar" element={JSON.parse(localStorage.getItem('profile')) ? <AiringCalendar /> : <Navigate to="/auth" replace />} />
          </Routes>
          <Footer />
        </div>
      </ServerWakeUp>
    </>
  )
}

export default App
