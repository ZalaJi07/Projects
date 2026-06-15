import './App.css'
import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Footer from './components/Footer'
import Manager from './components/Manager'
import Navbar from './components/Navbar'
import Auth from './components/auth/auth.jsx'
import PublicList from './components/PublicList'
import ServerWakeUp from './components/ServerWakeUp'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/AdminDashboard'
import AiringCalendar from './pages/AiringCalendar'
import Profile from './pages/Profile'
import Stats from './pages/Stats'
import PublicStats from './pages/PublicStats'
import { fetchMe } from './api/index.js'
import { useTheme } from './context/ThemeContext.jsx'


function App() {
  const { setTheme } = useTheme();

  // ── Silent profile sync ──────────────────────────────────────────────────
  // On every app load, fetch fresh profile from server and update localStorage.
  // This ensures username/isAdmin/theme changes made on another device propagate here.
  useEffect(() => {
    const stored = localStorage.getItem('profile');
    if (!stored) return; // not logged in — nothing to sync

    fetchMe()
      .then(({ data }) => {
        const current = JSON.parse(localStorage.getItem('profile') || 'null');
        if (!current) return;

        // Sync theme silently — no reload needed, just update CSS variable
        if (data.result?.theme) {
          setTheme(data.result.theme, false); // false = don't re-save to DB
        }

        // Only reload page if username or admin status changed
        const changed =
          current.result?.username !== data.result?.username ||
          current.result?.isAdmin  !== data.result?.isAdmin;
        if (changed) {
          localStorage.setItem('profile', JSON.stringify({ result: data.result, token: data.token }));
          // Force a full page reload so Navbar + all components pick up the new values.
          window.location.reload();
        }
      })
      .catch((err) => {
        // 403 = account was disabled — force logout
        if (err?.response?.status === 403) {
          localStorage.removeItem('profile');
          toast.error('Your account has been disabled. Contact support.');
          setTimeout(() => { window.location.href = '/auth'; }, 1500);
        }
      });
  }, []); // run once on mount

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--surface)',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: 'var(--primary)', secondary: '#fff' },
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
            <Route path="/list/:username/stats" element={<PublicStats />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/calendar" element={JSON.parse(localStorage.getItem('profile')) ? <AiringCalendar /> : <Navigate to="/auth" replace />} />
            <Route path="/profile" element={JSON.parse(localStorage.getItem('profile')) ? <Profile /> : <Navigate to="/auth" replace />} />
            <Route path="/stats" element={JSON.parse(localStorage.getItem('profile')) ? <Stats /> : <Navigate to="/auth" replace />} />
          </Routes>
          <Footer />
        </div>
      </ServerWakeUp>
    </>
  )
}

export default App
