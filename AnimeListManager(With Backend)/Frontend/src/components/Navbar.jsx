import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux"
import toast from "react-hot-toast";

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("profile"))?.result?.username);

  // Hide personal controls when viewing someone else's public list
  const isPublicListView = location.pathname.startsWith("/list/");

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("profile"))?.result?.username);
  }, [location]);

  const logout = () => {
    dispatch({ type: "LOGOUT" })
    toast.success("Logged out successfully.");
    navigate("/")
    setUser(null)
  }

  const shareList = () => {
    const url = `${window.location.origin}/list/${user}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Share link copied to clipboard!");
    }).catch(() => {
      toast("Your public list: " + url, { duration: 5000 });
    });
  }

  return (
    <div className="bg-[#2C3E50] px-6 py-2 shadow-md flex items-center justify-between">

      {/* Logo */}
      <img src="/logo.png" alt="logo" className="h-12 cursor-pointer" onClick={() => navigate("/")} />

      {/* Right Side */}
      {isPublicListView ? (
        // On public list view: show only a "Back" or "Login/Home" button
        <div className="flex items-center gap-3 text-white">
          {user ? (
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 bg-[#E67E22] px-4 py-1.5 rounded-full text-white font-semibold hover:opacity-90 transition"
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
        <div className="flex items-center gap-3 text-white">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#E67E22] flex items-center justify-center font-bold uppercase">
            {user[0]}
          </div>

          {/* Name */}
          <span className="font-medium">{user}</span>

          {/* Share Button */}
          <button
            onClick={shareList}
            className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full text-white text-sm font-medium hover:bg-white/20 transition"
            title="Copy share link"
          >
            <span className="material-symbols-outlined text-base">share</span>
            Share
          </button>

          <button
            onClick={logout}
            className="bg-[#E67E22] px-4 py-1.5 rounded-full text-white font-semibold hover:opacity-90 transition"
          >
            Logout
          </button>
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
  )
}

export default Navbar