const File = require("../models/fileModel")
const DownloadLog = require("../models/downloadLogModel")
const { v4: uuidv4 } = require("uuid")
const nodemailer = require("nodemailer")
const cloudinary = require("../config/cloudinary")

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

exports.uploadFile = async (req, res) => {
    if (!req.file) return res.status(400).send({ message: "No file uploaded" })

    const { sender_email, receiver_email } = req.body
    const expiryHrs = 24
    const expiry_time = new Date(Date.now() + expiryHrs * 60 * 60 * 1000)

    const fileUuid = uuidv4()

    try {
        // Upload to Cloudinary using buffer
        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    public_id: fileUuid,
                    folder: "file-sharing",
                },
                (error, result) => {
                    if (error) reject(error)
                    else resolve(result)
                }
            )
            uploadStream.end(req.file.buffer)
        })

        const cloudinaryResult = await uploadPromise

        const fileData = {
            id: fileUuid,
            filename: req.file.originalname,
            file_path: cloudinaryResult.secure_url,
            upload_time: new Date(),
            expiry_time,
            sender_email,
            receiver_email,
            created_by: req.user ? req.user._id : null,
        }

        const fileDoc = await File.create(fileData)
        const downloadLink = `${process.env.FRONTEND_BASE_URL || process.env.BASE_URL}/download/${fileUuid}`

        if (receiver_email) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: receiver_email,
                subject: "File download link",
                text: `You have received a file. Download: ${downloadLink}\nIt will expire in 24 hours.`,
            })
        }

        res.status(201).json({
            message: "File uploaded successfully",
            downloadLink,
            fileId: fileUuid,
            expiryTime: expiry_time,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.downloadFile = async (req, res) => {
    try {
        const { fileId } = req.params
        const fileDoc = await File.findOne({ id: fileId })

        if (!fileDoc) return res.status(404).send({ message: "File not found" })
        if (new Date() > fileDoc.expiry_time) {
            // Delete from Cloudinary
            try {
                await cloudinary.uploader.destroy(`file-sharing/${fileId}`)
            } catch (err) {
                console.error("Error deleting file from Cloudinary:", err)
            }
            await File.deleteOne({ id: fileId })
            return res.status(410).send({ message: "File link expired" })
        }

        fileDoc.download_count += 1
        await fileDoc.save()

        await DownloadLog.create({
            file_id: fileId,
            ip_address: req.ip,
            user_id: req.user ? req.user._id : null,
        })

        // Determine file type for preview
        const fileExtension = fileDoc.filename.split('.').pop().toLowerCase()
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)
        const isPdf = fileExtension === 'pdf'
        const isVideo = ['mp4', 'webm', 'avi', 'mov'].includes(fileExtension)
        const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(fileExtension)

        // Return HTML page with preview and download option
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileDoc.filename}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 900px;
            width: 100%;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            word-break: break-word;
        }
        .file-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            font-size: 14px;
            margin-top: 15px;
        }
        .info-item {
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 15px;
            border-radius: 6px;
        }
        .info-label {
            font-weight: 600;
            opacity: 0.9;
        }
        .info-value {
            margin-top: 5px;
            opacity: 0.95;
        }
        .preview-section {
            padding: 40px;
            text-align: center;
            min-height: 400px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
        }
        .preview-section img,
        .preview-section video,
        .preview-section audio {
            max-width: 100%;
            max-height: 500px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .preview-section iframe {
            width: 100%;
            height: 600px;
            border: none;
            border-radius: 8px;
        }
        .no-preview {
            color: #666;
            font-size: 16px;
            margin-bottom: 20px;
        }
        .actions {
            padding: 30px;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            background: white;
            border-top: 1px solid #eee;
        }
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
            background: #f0f0f0;
            color: #333;
        }
        .btn-secondary:hover {
            background: #e0e0e0;
        }
        .expiry-warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 ${fileDoc.filename}</h1>
            <div class="file-info">
                <div class="info-item">
                    <div class="info-label">Uploaded</div>
                    <div class="info-value">${new Date(fileDoc.upload_time).toLocaleDateString()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Expires</div>
                    <div class="info-value">${new Date(fileDoc.expiry_time).toLocaleString()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Downloads</div>
                    <div class="info-value">${fileDoc.download_count}</div>
                </div>
            </div>
        </div>

        ${new Date() < new Date(fileDoc.expiry_time) ? '' : '<div class="expiry-warning">⚠️ This file link has expired</div>'}

        <div class="preview-section">
            ${isImage ? `<img src="${fileDoc.file_path}" alt="${fileDoc.filename}" />` : ''}
            ${isPdf ? `<iframe src="${fileDoc.file_path}"></iframe>` : ''}
            ${isVideo ? `<video controls><source src="${fileDoc.file_path}" type="video/${fileExtension}"></video>` : ''}
            ${isAudio ? `<audio controls style="width: 100%;"><source src="${fileDoc.file_path}" type="audio/${fileExtension}"></audio>` : ''}
            ${!isImage && !isPdf && !isVideo && !isAudio ? '<div class="no-preview">No preview available for this file type</div>' : ''}
        </div>

        <div class="actions">
            <a href="/api/file/download/${fileId}/raw" class="btn btn-primary">⬇️ Download File</a>
            <a href="${process.env.BASE_URL || 'http://localhost:3000'}" class="btn btn-secondary">← Back to App</a>
        </div>
    </div>
</body>
</html>
        `

        res.setHeader('Content-Type', 'text/html')
        res.send(htmlContent)
    } catch (err) {
        res.status(500).json({ err: err.message })
    }
}

exports.getFileInfo = async (req, res) => {
    try {
        const { fileId } = req.params
        const fileDoc = await File.findOne({ id: fileId })

        if (!fileDoc) return res.status(404).send({ message: "File not found" })
        if (new Date() > fileDoc.expiry_time) {
            return res.status(410).send({ message: "File link expired" })
        }

        res.json({
            id: fileDoc.id,
            filename: fileDoc.filename,
            upload_time: fileDoc.upload_time,
            expiry_time: fileDoc.expiry_time,
            download_count: fileDoc.download_count,
            sender_email: fileDoc.sender_email,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.getMyFiles = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" })
        }

        const files = await File.find({ created_by: req.user._id }).sort({
            createdAt: -1,
        })

        const filesWithSize = files.map((file) => ({
            id: file.id,
            filename: file.filename,
            upload_time: file.upload_time,
            expiry_time: file.expiry_time,
            download_count: file.download_count,
            sender_email: file.sender_email,
        }))

        res.json(filesWithSize)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.deleteFile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" })
        }

        const { fileId } = req.params
        const fileDoc = await File.findOne({
            id: fileId,
            created_by: req.user._id,
        })

        if (!fileDoc) {
            return res
                .status(404)
                .json({ message: "File not found or unauthorized" })
        }

        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(`file-sharing/${fileId}`)
        } catch (err) {
            console.error("Error deleting file from Cloudinary:", err)
        }

        await File.deleteOne({ id: fileId })
        await DownloadLog.deleteMany({ file_id: fileId })

        res.json({ message: "File deleted successfully" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.sendEmail = async (req, res) => {
    try {
        const { email, downloadLink, fileName, expiryTime } = req.body

        if (!email || !downloadLink) {
            return res
                .status(400)
                .json({ message: "Email and download link are required" })
        }

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "File download link",
            html: `
        <h2>You have received a file</h2>
        <p>File name: ${fileName}</p>
        <p>Download link: <a href="${downloadLink}">${downloadLink}</a></p>
        <p>This link will expire on ${new Date(expiryTime).toLocaleString()}</p>
      `,
        })

        res.json({ message: "Email sent successfully" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.downloadFileRaw = async (req, res) => {
    try {
        const { fileId } = req.params
        const fileDoc = await File.findOne({ id: fileId })

        if (!fileDoc) return res.status(404).send({ message: "File not found" })
        if (new Date() > fileDoc.expiry_time) {
            // Delete from Cloudinary
            try {
                await cloudinary.uploader.destroy(`file-sharing/${fileId}`)
            } catch (err) {
                console.error("Error deleting file from Cloudinary:", err)
            }
            await File.deleteOne({ id: fileId })
            return res.status(410).send({ message: "File link expired" })
        }

        // Redirect to Cloudinary URL for actual file download
        res.redirect(fileDoc.file_path)
    } catch (err) {
        res.status(500).json({ err: err.message })
    }
}
