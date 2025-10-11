import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, FileIcon, Image, FileText, Archive } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function Home() {
    const [file, setFile] = useState(null)
    const [emails, setEmails] = useState({ sender: "", receiver: "" })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [uploadProgress, setUploadProgress] = useState(0)
    const [dragActive, setDragActive] = useState(false)
    const navigate = useNavigate()
    const { authHeader } = useAuth()

    const MAX_FILE_SIZE = 100 * 1024 * 1024
    const ALLOWED_TYPES = [
        "application/pdf",
        "application/zip",
        "application/x-zip-compressed",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ]

    const validateFile = (file) => {
        if (!file) return "Please select a file"
        if (file.size > MAX_FILE_SIZE)
            return "File size should be less than 100MB"
        if (!ALLOWED_TYPES.includes(file.type)) return "File type not supported"
        return null
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        const error = validateFile(selectedFile)
        if (error) {
            setError(error)
            setFile(null)
        } else {
            setError("")
            setFile(selectedFile)
        }
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const droppedFile = e.dataTransfer.files[0]
        const error = validateFile(droppedFile)
        if (error) {
            setError(error)
            setFile(null)
        } else {
            setError("")
            setFile(droppedFile)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("sender_email", emails.sender)
        formData.append("receiver_email", emails.receiver)
        formData.append("file_type", file.type)
        formData.append("file_size", file.size)

        try {
            setLoading(true)
            setError("")
            setUploadProgress(0)

            const xhr = new XMLHttpRequest()

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round(
                        (event.loaded * 100) / event.total
                    )
                    setUploadProgress(progress)
                }
            }

            const uploadPromise = new Promise((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText))
                    } else {
                        try {
                            reject(JSON.parse(xhr.responseText))
                        } catch {
                            reject({ message: "Upload failed" })
                        }
                    }
                }
                xhr.onerror = () =>
                    reject({ message: "Network error occurred" })
            })

            xhr.open("POST", "/api/file/upload")

            // Add auth header
            if (authHeader.Authorization) {
                xhr.setRequestHeader("Authorization", authHeader.Authorization)
            }

            xhr.send(formData)

            const data = await uploadPromise
            setUploadProgress(100)

            setTimeout(() => {
                navigate("/success", {
                    state: {
                        fileId: data.fileId,
                        downloadLink: data.downloadLink,
                        fileName: file.name,
                        fileSize: file.size,
                        expiryTime: data.expiryTime,
                    },
                })
            }, 500) // Short delay to show 100% progress
        } catch (error) {
            console.error("Upload error:", error)
            setError(
                error.message || "Failed to upload file. Please try again."
            )
            setUploadProgress(0)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
            <div className="max-w-2xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                        Share Files Securely
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Upload files up to 100MB and share them with anyone,
                        anywhere
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {error && (
                        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
                            <span className="text-red-500 font-bold">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer
                ${
                    dragActive
                        ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
                        : "border-gray-300 hover:border-blue-400"
                }
                ${error ? "border-red-300 bg-red-50" : ""}`}
                        >
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                id="fileInput"
                                accept={ALLOWED_TYPES.join(",")}
                            />
                            <label
                                htmlFor="fileInput"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                <div
                                    className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300
                  ${
                      dragActive
                          ? "bg-blue-500 scale-110"
                          : "bg-gradient-to-br from-blue-100 to-indigo-100"
                  }`}
                                >
                                    <Upload
                                        className={`w-10 h-10 ${
                                            dragActive
                                                ? "text-white"
                                                : "text-blue-600"
                                        }`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    {file ? (
                                        <>
                                            <p className="text-lg font-semibold text-gray-800">
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {(
                                                    file.size /
                                                    (1024 * 1024)
                                                ).toFixed(2)}{" "}
                                                MB
                                            </p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    setFile(null)
                                                }}
                                                className="text-sm text-blue-600 hover:text-blue-700 underline"
                                            >
                                                Choose a different file
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xl font-semibold text-gray-700">
                                                Drop your file here or click to
                                                browse
                                            </p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Supports: PDF, ZIP, Images, DOC
                                                • Max size: 100MB
                                            </p>
                                            <div className="flex items-center justify-center gap-4 mt-4">
                                                <FileText className="w-6 h-6 text-gray-400" />
                                                <Image className="w-6 h-6 text-gray-400" />
                                                <Archive className="w-6 h-6 text-gray-400" />
                                                <FileIcon className="w-6 h-6 text-gray-400" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </label>

                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="mt-6">
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300 shadow-md"
                                            style={{
                                                width: `${uploadProgress}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-2 font-medium">
                                        Uploading: {uploadProgress}%
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <input
                                type="email"
                                placeholder="Your email (optional)"
                                value={emails.sender}
                                onChange={(e) =>
                                    setEmails((prev) => ({
                                        ...prev,
                                        sender: e.target.value,
                                    }))
                                }
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />

                            <input
                                type="email"
                                placeholder="Recipient's email (optional)"
                                value={emails.receiver}
                                onChange={(e) =>
                                    setEmails((prev) => ({
                                        ...prev,
                                        receiver: e.target.value,
                                    }))
                                }
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!file || loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg font-semibold 
                       hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 
                       transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed
                       transform hover:scale-[1.02] disabled:hover:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
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
                                    Uploading...
                                </span>
                            ) : (
                                "Upload File"
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>
                        Your files are encrypted and automatically deleted after
                        24 hours
                    </p>
                </div>
            </div>
        </div>
    )
}
