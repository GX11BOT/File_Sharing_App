import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { UserPlus, LogIn, Loader2 } from "lucide-react"

export default function Login() {
    const [credentials, setCredentials] = useState({
        firstName: "",
        lastName: "",
        emailId: "",
        password: "",
    })
    const [isRegistering, setIsRegistering] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const { login, register } = useAuth()
    
    // Get the page to return to after login
    const returnTo = location.state?.returnTo || "/"

    const validatePassword = (password) => {
        const requirements = {
            minLength: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        }
        return Object.values(requirements).every(Boolean)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            if (isRegistering) {
                if (!credentials.firstName?.trim()) {
                    throw new Error("First name is required")
                }
                if (!credentials.emailId?.trim()) {
                    throw new Error("Email is required")
                }
                if (!credentials.password) {
                    throw new Error("Password is required")
                }
                if (!validatePassword(credentials.password)) {
                    throw new Error(
                        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
                    )
                }

                await register(
                    credentials.firstName,
                    credentials.lastName,
                    credentials.emailId,
                    credentials.password
                )
            } else {
                if (!credentials.emailId?.trim() || !credentials.password) {
                    throw new Error("Please fill in all required fields")
                }
                await login(credentials.emailId, credentials.password)
            }
            navigate(returnTo)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
                    <div className="flex items-center justify-center mb-6">
                        {isRegistering ? (
                            <UserPlus className="w-12 h-12 text-indigo-600 mb-2" />
                        ) : (
                            <LogIn className="w-12 h-12 text-blue-600 mb-2" />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {isRegistering ? "Create Account" : "Welcome Back"}
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm animate-pulse">
                                {error}
                            </div>
                        )}

                        {isRegistering && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        First Name{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required={isRegistering}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                                        value={credentials.firstName}
                                        onChange={(e) =>
                                            setCredentials((prev) => ({
                                                ...prev,
                                                firstName: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                                        value={credentials.lastName}
                                        onChange={(e) =>
                                            setCredentials((prev) => ({
                                                ...prev,
                                                lastName: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                                value={credentials.emailId}
                                onChange={(e) =>
                                    setCredentials((prev) => ({
                                        ...prev,
                                        emailId: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                                value={credentials.password}
                                onChange={(e) =>
                                    setCredentials((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                            />
                            {isRegistering && (
                                <p className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
                                    Password must be at least 8 characters and
                                    include uppercase, lowercase, number, and
                                    special character
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <span>
                                    {isRegistering
                                        ? "Create Account"
                                        : "Sign In"}
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-600">
                            {isRegistering
                                ? "Already have an account?"
                                : "Don't have an account?"}{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(!isRegistering)
                                    setError("")
                                    setCredentials({
                                        firstName: "",
                                        lastName: "",
                                        emailId: "",
                                        password: "",
                                    })
                                }}
                                className="text-blue-600 hover:text-indigo-600 font-semibold hover:underline transition-colors"
                            >
                                {isRegistering ? "Sign in" : "Create account"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
