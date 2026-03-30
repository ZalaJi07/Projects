import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux"
import toast from "react-hot-toast";

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("profile"))?.result?.username);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("profile"))?.result?.username);
  }, [location]);

  const logout = () => {
    dispatch({ type: "LOGOUT" })
    toast.success("Logged out successfully.");
    navigate("/")
    setUser(null)
  }

  return (
    <div className="bg-[#2C3E50] px-6 py-2 shadow-md flex items-center justify-between">

      {/* Logo */}
      <img src="/logo.png" alt="logo" className="h-12" />

      {/* Right Side */}
      {(user) ? (
        <div className="flex items-center gap-3 text-white">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#E67E22] flex items-center justify-center font-bold uppercase">
            {user[0]}
          </div>

          {/* Name */}
          <span className="font-medium">{user}</span>

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



// import React from 'react'

// const Navbar = () => {
//     return (
//         <div className="bg-[#2C3E50] px-6 py-2 shadow-md flex items-center justify-center md:justify-start">
//                 <img src="/logo.png" alt="logo" className="h-12" />
//         </div>
//     )
// }

// export default Navbar