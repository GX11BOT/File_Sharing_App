import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { FileUp, LayoutDashboard, LogOut, LogIn } from "lucide-react"

export default function Navbar() {
    const { user, logout } = useAuth()

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-white font-bold text-xl hover:text-blue-100 transition-colors"
                    >
                        <FileUp className="w-6 h-6" />
                        <span>FileShare</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="flex items-center gap-2 text-white hover:text-blue-100 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span>My Files</span>
                                </Link>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 text-white hover:text-blue-100 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all shadow-md"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Login</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
