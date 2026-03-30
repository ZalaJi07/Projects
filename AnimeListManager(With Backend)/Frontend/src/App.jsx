import './App.css'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Manager from './components/Manager'
import Navbar from './components/Navbar'
import Auth from './components/auth/auth.jsx'
import PublicList from './components/PublicList'

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
      <div onContextMenu={(e) => e.preventDefault()} className="flex flex-col h-screen overflow-hidden">
        <Navbar />
        <Routes>
          <Route path="/" element={<Manager />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/list/:username" element={<PublicList />} />
        </Routes>
        <Footer />
      </div>
    </>
  )
}

export default App
