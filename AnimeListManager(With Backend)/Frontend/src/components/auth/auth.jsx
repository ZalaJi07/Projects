import { useState } from "react"
import { GoogleLogin } from "@react-oauth/google"
import { jwtDecode } from "jwt-decode"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { signIn, signUp, googleSignIn } from "../../actions/auth"

const intialState = {
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
}

const Auth = () => {
    const [isSignIn, setIsSignIn] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState(intialState)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (isSignIn) {
            dispatch(signIn(formData, navigate))
        } else {
            dispatch(signUp(formData, navigate))
        }
    }

    return (
        <div className="flex flex-grow items-center justify-center bg-[var(--bg)]">
            <div className="bg-white p-6 rounded-xl shadow-md w-[90%] max-w-sm">

                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-4">
                    {isSignIn ? "Sign In" : "Sign Up"}
                </h2>

                {/* Email */}
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                    onChange={handleChange}
                />

                {/* Username (Sign Up only) */}
                {!isSignIn && (
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                        onChange={handleChange}
                    />
                )}

                {/* Password */}
                <div className="relative mb-3">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                        onChange={handleChange}
                    />
                    <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 select-none"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </span>
                </div>

                {/* Retype Password (Sign Up only) */}
                {!isSignIn && (
                    <div className="relative mb-3">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                            onChange={handleChange}
                        />
                    </div>
                )}

                {/* Button */}
                <button
                    className="w-full bg-[var(--primary)] text-white py-2 rounded-lg font-semibold hover:opacity-90 transition mt-2"
                    onClick={handleSubmit}
                >
                    {isSignIn ? "Sign In" : "Sign Up"}
                </button>

                {/* 🔹 Google Button (ADDED) */}
                <button
                    onClick={() => {
                        document.querySelector('div[role="button"]')?.click()
                    }}
                    className="w-full border border-gray-300 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 mt-3 hover:bg-gray-50 transition"
                >
                    <img
                        src="https://developers.google.com/identity/images/g-logo.png"
                        alt="google"
                        className="w-5 h-5"
                    />
                    Sign in with Google
                </button>

                {/* Switch Mode */}
                <p className="text-sm text-center mt-4 text-gray-600">
                    {isSignIn ? (
                        <>
                            Don’t have an account?{" "}
                            <span
                                className="text-[var(--primary)] font-semibold cursor-pointer hover:underline"
                                onClick={() => setIsSignIn(false)}
                            >
                                Sign Up
                            </span>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <span
                                className="text-[var(--primary)] font-semibold cursor-pointer hover:underline"
                                onClick={() => setIsSignIn(true)}
                            >
                                Sign In
                            </span>
                        </>
                    )}
                </p>

                {/* Hidden Google Login (REAL logic) */}
                <div className="hidden">
                    <GoogleLogin
                        onSuccess={(credentialResponse) => {
                            const token = credentialResponse.credential;

                            try {
                                dispatch(googleSignIn(token, navigate));
                            } catch (error) {
                                console.log("Error during Google authentication:", error);
                            }
                        }}
                        onError={() => {
                            console.log("Google Login Failed")
                        }}
                    />
                </div>

            </div>
        </div>
    )
}

export default Auth
