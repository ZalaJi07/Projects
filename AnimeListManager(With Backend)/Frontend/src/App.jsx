import './App.css'
import { Routes, Route } from 'react-router-dom'
import Footer from './components/Footer'
import Manager from './components/Manager'
import Navbar from './components/Navbar'
import Auth from './components/auth/auth.jsx'
/* Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
Set-ExecutionPolicy -ExecutionPolicy Default -Scope Process */

function App() {

  return (
    <>
      <div onContextMenu={(e) => e.preventDefault()} className="flex flex-col h-screen overflow-hidden">
        <Navbar />
        {/* <div class="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]"></div>    */}
        <Routes>
          <Route path="/" element={<Manager />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
        <Footer />
      </div>
    </>
  )
}

export default App
