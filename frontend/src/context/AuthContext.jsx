import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

function decodeToken(token) {
    try {
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(
                    (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join("")
        )
        return JSON.parse(jsonPayload)
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem("token"))

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem("token")
            if (storedToken) {
                const decoded = decodeToken(storedToken)

                if (decoded && decoded.exp * 1000 > Date.now()) {
                    setToken(storedToken)
                    setUser({ _id: decoded.user._id })
                } else {
                    localStorage.removeItem("token")
                    setToken(null)
                    setUser(null)
                }
            }
        }

        initAuth()
    }, [])

    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token)
        } else {
            localStorage.removeItem("token")
        }
    }, [token])

    const register = async (firstName, lastName, emailId, password) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
            const response = await fetch(`${apiUrl}/api/user/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    emailId,
                    password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Registration failed")
            }

            setToken(data.token)
            await login(emailId, password)
        } catch (error) {
            throw new Error(error.message || "Registration failed")
        }
    }

    const login = async (emailId, password) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
            const response = await fetch(`${apiUrl}/api/user/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailId, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Invalid credentials")
            }

            setToken(data.token)

            const decoded = decodeToken(data.token)
            if (decoded) {
                setUser({ _id: decoded.user._id, emailId })
            } else {
                setUser({ emailId })
            }
        } catch (error) {
            throw new Error(error.message || "Login failed")
        }
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem("token")
    }

    const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

    return (
        <AuthContext.Provider
            value={{ user, login, logout, register, authHeader }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
