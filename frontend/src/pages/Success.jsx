import { useLocation, useNavigate } from "react-router-dom"
import {
    Copy,
    Check,
    Mail,
    ArrowLeft,
    Clock,
    CheckCircle2,
    Share2,
} from "lucide-react"
import { useState } from "react"

function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function getTimeRemaining(expiryTime) {
    const total = new Date(expiryTime) - new Date()
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((total / 1000 / 60) % 60)

    if (hours > 0) {
        return `${hours} hours ${minutes} minutes`
    }
    return `${minutes} minutes`
}

export default function Success() {
    const location = useLocation()
    const navigate = useNavigate()
    const [copied, setCopied] = useState(false)
    const [sending, setSending] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [error, setError] = useState("")
    const [email, setEmail] = useState("")

    const { downloadLink, fileName, fileSize, expiryTime } =
        location.state || {}

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(downloadLink)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setError("Failed to copy link")
        }
    }

    const handleSendEmail = async (e) => {
        e.preventDefault()
        if (!email) return

        try {
            setSending(true)
            setError("")
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"

            const response = await fetch(`${apiUrl}/api/file/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    downloadLink,
                    fileName,
                    expiryTime,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || "Failed to send email")
            }

            setEmailSent(true)
            setEmail("")
            setTimeout(() => setEmailSent(false), 3000)
        } catch (err) {
            setError(err.message)
        } finally {
            setSending(false)
        }
    }

    if (!downloadLink) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
                    <p className="text-red-500 mb-4">
                        No file information available
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go back to upload
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                            Upload Successful!
                        </h1>
                        <p className="text-gray-600">
                            Your file is ready to share
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Share2 className="w-5 h-5 text-blue-600" />
                            <h2 className="font-semibold text-gray-800">
                                File Details
                            </h2>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">{fileName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Size:</span>
                                <span className="font-medium">
                                    {formatBytes(fileSize)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Expires in:
                                </span>
                                <span className="font-medium text-orange-600">
                                    {getTimeRemaining(expiryTime)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Copy className="w-5 h-5 text-blue-600" />
                            Shareable Link
                        </h2>
                        <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <input
                                type="text"
                                value={downloadLink}
                                readOnly
                                className="flex-1 bg-transparent outline-none text-sm text-gray-700"
                            />
                            <button
                                onClick={handleCopy}
                                className={`p-3 rounded-lg transition-all duration-300 ${
                                    copied
                                        ? "bg-green-500 text-white"
                                        : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                                title="Copy to clipboard"
                            >
                                {copied ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <Copy className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        {copied && (
                            <p className="text-sm text-green-600 mt-2 animate-fade-in">
                                ✓ Copied to clipboard!
                            </p>
                        )}
                    </div>

                    <div className="mb-8">
                        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-600" />
                            Send via Email
                        </h2>
                        <form onSubmit={handleSendEmail} className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter recipient's email"
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={sending || emailSent}
                                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-md
                    ${
                        emailSent
                            ? "bg-green-500 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                    }`}
                                >
                                    {sending ? (
                                        <>
                                            <svg
                                                className="animate-spin h-4 w-4"
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
                                    ) : emailSent ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Sent!
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4" />
                                            Send
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-6 py-3 rounded-lg transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Upload Another File
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
