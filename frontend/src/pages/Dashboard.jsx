import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import {
    FileText,
    Trash2,
    ExternalLink,
    AlertTriangle,
    Upload,
    Download,
    Clock,
    Copy,
    Check,
    Mail,
} from "lucide-react"
import { Link } from "react-router-dom"

function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function formatTimeLeft(expiryTime) {
    const now = new Date()
    const expiry = new Date(expiryTime)
    const difference = expiry - now

    if (difference <= 0) return "Expired"

    const hours = Math.floor(difference / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
}

export default function Dashboard() {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [copied, setCopied] = useState({})
    const [sharing, setSharing] = useState({})
    const [emailSent, setEmailSent] = useState({})
    const [showEmailModal, setShowEmailModal] = useState({})
    const [emailInput, setEmailInput] = useState({})
    const { authHeader } = useAuth()

    const fetchFiles = useCallback(async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
            const response = await fetch(`${apiUrl}/api/file/my-files`, {
                headers: {
                    ...authHeader,
                },
            })

            if (!response.ok) throw new Error("Failed to fetch files")

            const data = await response.json()
            setFiles(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [authHeader])

    useEffect(() => {
        fetchFiles()
    }, [fetchFiles])

    const handleDelete = async (fileId) => {
        if (!confirm("Are you sure you want to delete this file?")) return

        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
            const response = await fetch(`${apiUrl}/api/file/${fileId}`, {
                method: "DELETE",
                headers: {
                    ...authHeader,
                },
            })

            if (!response.ok) throw new Error("Failed to delete file")

            setFiles(files.filter((file) => file.id !== fileId))
        } catch (err) {
            setError(err.message)
        }
    }

    const handleCopyLink = async (fileId) => {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
        const downloadLink = `${apiUrl}/download/${fileId}`
        
        try {
            await navigator.clipboard.writeText(downloadLink)
            setCopied({ ...copied, [fileId]: true })
            setTimeout(() => setCopied({ ...copied, [fileId]: false }), 2000)
        } catch {
            setError("Failed to copy link")
        }
    }

    const handleSendEmail = async (fileId, file) => {
        const email = emailInput[fileId]
        if (!email) return

        try {
            setSharing({ ...sharing, [fileId]: true })
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
            const downloadLink = `${apiUrl}/download/${fileId}`

            const response = await fetch(`${apiUrl}/api/file/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    downloadLink,
                    fileName: file.filename,
                    expiryTime: file.expiry_time,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || "Failed to send email")
            }

            setEmailSent({ ...emailSent, [fileId]: true })
            setEmailInput({ ...emailInput, [fileId]: "" })
            setShowEmailModal({ ...showEmailModal, [fileId]: false })
            setTimeout(() => setEmailSent({ ...emailSent, [fileId]: false }), 3000)
        } catch (err) {
            setError(err.message)
        } finally {
            setSharing({ ...sharing, [fileId]: false })
        }
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl w-1/3"></div>
                        <div className="space-y-4">
                            <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
                            <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
                            <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 p-6 rounded-2xl flex items-center gap-4 text-red-600 shadow-lg">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                        <p className="font-medium">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        My Uploads
                    </h1>
                    <Link
                        to="/"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                        <Upload className="w-5 h-5" />
                        Upload New File
                    </Link>
                </div>

                {files.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
                        <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6 animate-pulse" />
                        <p className="text-xl text-gray-500 font-medium">
                            No files uploaded yet
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            Start sharing files by uploading your first one!
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01]"
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex-1 space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-800 break-all">
                                            {file.filename}
                                        </h3>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1.5 rounded-lg">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                                <span className="text-gray-700 font-medium">
                                                    {formatBytes(
                                                        file.file_size
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-1.5 rounded-lg">
                                                <Download className="w-4 h-4 text-green-600" />
                                                <span className="text-gray-700 font-medium">
                                                    {file.download_count}{" "}
                                                    downloads
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm bg-purple-50 px-3 py-1.5 rounded-lg">
                                                <Clock className="w-4 h-4 text-purple-600" />
                                                <span className="text-gray-700 font-medium">
                                                    {formatTimeLeft(
                                                        file.expiry_time
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={() =>
                                                handleCopyLink(file.id)
                                            }
                                            className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                                                copied[file.id]
                                                    ? "bg-green-500 text-white"
                                                    : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                            }`}
                                            title="Copy download link"
                                        >
                                            {copied[file.id] ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <Copy className="w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() =>
                                                setShowEmailModal({
                                                    ...showEmailModal,
                                                    [file.id]: true,
                                                })
                                            }
                                            className="p-3 text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                                            title="Share via email"
                                        >
                                            <Mail className="w-5 h-5" />
                                        </button>
                                        <Link
                                            to={`/download/${file.id}`}
                                            className="p-3 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                                            title="View download page"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDelete(file.id)
                                            }
                                            className="p-3 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                                            title="Delete file"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Email Modal */}
                                {showEmailModal[file.id] && (
                                    <div className="fixed top-36 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                        <div className="max-w-6xl mx-auto w-full">
                                            <div className="bg-white rounded-2xl p-8 shadow-xl">
                                                <h3 className="text-xl font-semibold mb-6 text-gray-800">
                                                    Share File via Email
                                                </h3>
                                                <div className="mb-4 text-sm text-gray-600">
                                                    <p className="font-medium mb-2">File: <span className="text-gray-800 font-semibold">{file.filename}</span></p>
                                                </div>
                                                <input
                                                    type="email"
                                                    placeholder="Enter recipient's email address"
                                                    value={emailInput[file.id] || ""}
                                                    onChange={(e) =>
                                                        setEmailInput({
                                                            ...emailInput,
                                                            [file.id]:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full p-4 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                                                />
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() =>
                                                            setShowEmailModal({
                                                                ...showEmailModal,
                                                                [file.id]: false,
                                                            })
                                                        }
                                                        className="flex-1 p-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-all text-lg"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleSendEmail(
                                                                file.id,
                                                                file
                                                            )
                                                        }
                                                        disabled={
                                                            sharing[file.id] ||
                                                            !emailInput[file.id]
                                                        }
                                                        className={`flex-1 p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-lg ${
                                                            emailSent[file.id]
                                                                ? "bg-green-500 text-white"
                                                                : "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-400"
                                                        }`}
                                                    >
                                                        {sharing[file.id] ? (
                                                            <>
                                                                <svg
                                                                    className="animate-spin h-5 w-5"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle
                                                                        className="opacity-25"
                                                                        cx="12"
                                                                        cy="12"
                                                                        r="10"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                        fill="none"
                                                                    ></circle>
                                                                    <path
                                                                        className="opacity-75"
                                                                        fill="currentColor"
                                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                    ></path>
                                                                </svg>
                                                                Sending
                                                            </>
                                                        ) : emailSent[file.id] ? (
                                                            <>
                                                                <Check className="w-5 h-5" />
                                                                Sent!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Mail className="w-5 h-5" />
                                                                Send Email
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
