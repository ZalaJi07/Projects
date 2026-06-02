import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux"
import toast from "react-hot-toast";
import { fetchAllAnimes } from "../api/index.js";

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("profile"))?.result?.username);
  const [isAdmin, setIsAdmin] = useState(JSON.parse(localStorage.getItem("profile"))?.result?.isAdmin || false);

  // Hide personal controls when viewing someone else's public list
  const isPublicListView = location.pathname.startsWith("/list/");

  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem("profile"));
    setUser(profile?.result?.username);
    setIsAdmin(profile?.result?.isAdmin || false);
  }, [location]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Esc key closes the logout modal
  useEffect(() => {
    if (!showLogoutModal) return;
    const handleKey = (e) => { if (e.key === 'Escape') setShowLogoutModal(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showLogoutModal]);

  // ── Export state ──
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportMenuRef = useRef(null);

  // ── Mobile overflow menu state ──
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!showMobileMenu) return;
    const handleClick = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }
    };
    const handleKey = (e) => { if (e.key === 'Escape') setShowMobileMenu(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showMobileMenu]);

  // Client-side CSV builder
  const toCSV = (rows) => {
    const headers = ['Type', 'Name', 'Status', 'Episodes Watched', 'Movies Watched', 'MAL ID', 'Date Added'];
    const escape = (val) => {
      const str = val == null ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const lines = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.entryType || 'series',
          r.name,
          r.status || '',
          r.episodes ?? 0,
          r.movies ?? 0,
          r.malId || '',
          r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
        ].map(escape).join(',')
      ),
    ];
    return lines.join('\n');
  };

  const triggerDownload = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format) => {
    setShowExportMenu(false);
    setShowMobileMenu(false);
    setExporting(true);
    try {
      const { data } = await fetchAllAnimes();
      const rows = data.data;
      if (!rows || rows.length === 0) {
        toast('Your list is empty — nothing to export.', { icon: '📋' });
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        triggerDownload(toCSV(rows), `AnimeList_${date}.csv`, 'text/csv;charset=utf-8;');
        toast.success(`Exported ${rows.length} entries as CSV ✅`);
      } else {
        triggerDownload(JSON.stringify(rows, null, 2), `AnimeList_${date}.json`, 'application/json');
        toast.success(`Exported ${rows.length} entries as JSON ✅`);
      }
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    toast.success("Logged out successfully.");
    setShowLogoutModal(false);
    setShowMobileMenu(false);
    navigate("/");
    setUser(null);
  };

  const shareList = () => {
    const url = `${window.location.origin}/list/${user}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Share link copied to clipboard!");
    }).catch(() => {
      toast("Your public list: " + url, { duration: 5000 });
    });
    setShowMobileMenu(false);
  };

  return (
    <>
      <div className="bg-[#2C3E50] px-3 sm:px-6 py-2 shadow-md flex items-center justify-between flex-shrink-0">

        {/* Logo */}
        <img src="/logo.png" alt="logo" className="h-10 sm:h-12 cursor-pointer" onClick={() => navigate("/")} />

        {/* Right Side */}
        {isPublicListView ? (
          <div className="flex items-center gap-2 text-white">
            {user ? (
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1 bg-[#E67E22] px-3 sm:px-4 py-1.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                My List
              </button>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="bg-[#E67E22] px-4 py-1.5 rounded-full text-white font-semibold hover:opacity-90 transition"
              >
                Login
              </button>
            )}
          </div>
        ) : user ? (
          <div className="flex items-center gap-2 sm:gap-3 text-white">

            {/* Avatar + username — click to open profile */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 hover:opacity-80 transition"
              title="Your profile"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E67E22] flex items-center justify-center font-bold uppercase text-sm sm:text-base">
                {user[0]}
              </div>
              {/* Username — hidden on mobile */}
              <span className="font-medium hidden sm:inline">{user}</span>
            </button>

            {/* ── Desktop buttons — hidden below sm ── */}
            <div className="hidden sm:flex items-center gap-2">

              <button
                onClick={shareList}
                className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full text-white text-sm font-medium hover:bg-white/20 transition"
                title="Copy share link"
              >
                <span className="material-symbols-outlined text-base">share</span>
                Share
              </button>

              <button
                onClick={() => navigate('/calendar')}
                className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full text-white text-sm font-medium hover:bg-white/20 transition"
                title="Airing calendar"
              >
                <span className="material-symbols-outlined text-base">calendar_month</span>
                Calendar
              </button>

              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full text-white text-sm font-medium hover:bg-white/20 transition"
                  title="Admin dashboard"
                >
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                  Admin
                </button>
              )}

              {/* Export dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu((v) => !v)}
                  disabled={exporting}
                  className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full text-white text-sm font-medium hover:bg-white/20 transition disabled:opacity-60"
                  title="Export your list"
                >
                  {exporting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <span className="material-symbols-outlined text-base">download</span>
                  )}
                  {exporting ? 'Exporting…' : 'Export'}
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#E67E22] transition"
                    >
                      <span className="material-symbols-outlined text-base text-[#E67E22]">table_chart</span>
                      Export as CSV
                    </button>
                    <div className="h-px bg-gray-100" />
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#E67E22] transition"
                    >
                      <span className="material-symbols-outlined text-base text-[#E67E22]">data_object</span>
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="bg-[#E67E22] px-4 py-1.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition"
              >
                Logout
              </button>
            </div>

            {/* ── Mobile three-dot menu — hidden above sm ── */}
            <div className="relative sm:hidden" ref={mobileMenuRef}>
              <button
                onClick={() => setShowMobileMenu((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white"
                title="Menu"
              >
                <span className="material-symbols-outlined text-xl">more_vert</span>
              </button>

              {showMobileMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">

                  {/* User header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#E67E22] flex items-center justify-center font-bold uppercase text-xs text-white flex-shrink-0">
                      {user[0]}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 truncate">{user}</span>
                  </div>

                  <button
                    onClick={() => { navigate('/profile'); setShowMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#E67E22] transition"
                  >
                    <span className="material-symbols-outlined text-base text-[#E67E22]">manage_accounts</span>
                    Profile
                  </button>

                  <div className="h-px bg-gray-100" />

                  <button
                    onClick={shareList}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#E67E22] transition"
                  >
                    <span className="material-symbols-outlined text-base text-[#E67E22]">share</span>
                    Share my list
                  </button>

                  <div className="h-px bg-gray-100" />

                  <button
                    onClick={() => { navigate('/calendar'); setShowMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#E67E22] transition"
                  >
                    <span className="material-symbols-outlined text-base text-[#E67E22]">calendar_month</span>
                    Airing Calendar
                  </button>

                  {isAdmin && (
                    <>
                      <div className="h-px bg-gray-100" />
                      <button
                        onClick={() => { navigate('/admin'); setShowMobileMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#E67E22] transition"
                      >
                        <span className="material-symbols-outlined text-base text-[#E67E22]">admin_panel_settings</span>
                        Admin Dashboard
                      </button>
                    </>
                  )}

                  <div className="h-px bg-gray-100" />

                  <button
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#E67E22] transition disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base text-[#E67E22]">table_chart</span>
                    Export as CSV
                  </button>

                  <button
                    onClick={() => handleExport('json')}
                    disabled={exporting}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#E67E22] transition disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base text-[#E67E22]">data_object</span>
                    Export as JSON
                  </button>

                  <div className="h-px bg-gray-100" />

                  <button
                    onClick={() => { setShowMobileMenu(false); setShowLogoutModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Logout
                  </button>

                </div>
              )}
            </div>

          </div>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="bg-[#E67E22] px-4 py-1.5 rounded-full text-white font-semibold hover:opacity-90 transition"
          >
            Login
          </button>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLogoutModal(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#E67E22] text-xl">logout</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Logout?</h3>
                <p className="text-sm text-gray-500 mt-0.5">Signed in as <strong>{user}</strong></p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-5">Are you sure you want to log out?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-[#E67E22] rounded-lg hover:bg-[#d35400] transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
