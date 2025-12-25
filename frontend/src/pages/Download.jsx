import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Download, Clock } from "lucide-react"

function getTimeRemaining(expiryTime) {
    const total = new Date(expiryTime) - new Date()

    if (total <= 0) {
        return { total: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
    }

    const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((total / 1000 / 60) % 60)
    const seconds = Math.floor((total / 1000) % 60)

    return { total, hours, minutes, seconds, expired: false }
}

export default function DownloadComponent() {
    const { fileId } = useParams()
    const [fileInfo, setFileInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
    })

    useEffect(() => {
        const fetchFileInfo = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
                const response = await fetch(`${apiUrl}/api/file/info/${fileId}`)
                if (!response.ok) throw new Error("File not found or expired")
                const data = await response.json()
                setFileInfo(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchFileInfo()
    }, [fileId])

    useEffect(() => {
        if (!fileInfo) return

        const timer = setInterval(() => {
            const remaining = getTimeRemaining(fileInfo.expiry_time)
            setTimeLeft(remaining)

            if (remaining.expired) {
                clearInterval(timer)
                setError("This file has expired")
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [fileInfo])

    const handleDownload = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
            const response = await fetch(`${apiUrl}/api/file/download/${fileId}`)
            if (!response.ok) throw new Error("Download failed")

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = fileInfo.filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch {
            alert("Failed to download file")
        }
    }

    if (loading) return <div className="text-center">Loading...</div>
    if (error) return <div className="text-center text-red-500">{error}</div>

    return (
        <div className="max-w-xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold mb-4">Download Your File</h1>

                {fileInfo && (
                    <div className="space-y-4">
                        <div className="text-gray-600">
                            <p className="font-medium text-lg">
                                {fileInfo.filename}
                            </p>
                            <p className="text-sm mt-2">
                                Size:{" "}
                                {(fileInfo.file_size / (1024 * 1024)).toFixed(
                                    2
                                )}{" "}
                                MB
                            </p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                                <Clock className="w-5 h-5" />
                                <span className="font-semibold">
                                    Time Remaining
                                </span>
                            </div>
                            {timeLeft.expired ? (
                                <p className="text-red-500 font-semibold">
                                    Expired
                                </p>
                            ) : (
                                <div className="text-2xl font-bold text-gray-800">
                                    {timeLeft.hours > 0 && (
                                        <>
                                            <span>{timeLeft.hours}</span>
                                            <span className="text-sm text-gray-500">
                                                {" "}
                                                hours{" "}
                                            </span>
                                        </>
                                    )}
                                    <span>{timeLeft.minutes}</span>
                                    <span className="text-sm text-gray-500">
                                        {" "}
                                        minutes{" "}
                                    </span>
                                    <span>{timeLeft.seconds}</span>
                                    <span className="text-sm text-gray-500">
                                        {" "}
                                        seconds
                                    </span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleDownload}
                            disabled={timeLeft.expired}
                            className="flex items-center justify-center w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            {timeLeft.expired ? "File Expired" : "Download Now"}
                        </button>

                        {fileInfo.download_count > 0 && (
                            <p className="text-sm text-gray-500">
                                Downloaded {fileInfo.download_count} time
                                {fileInfo.download_count !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
