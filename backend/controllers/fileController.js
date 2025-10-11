const File = require("../models/fileModel")
const DownloadLog = require("../models/downloadLogModel")
const { v4: uuidv4 } = require("uuid")
const path = require("path")
const fs = require("fs")
const nodemailer = require("nodemailer")

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
    const fileData = {
        id: fileUuid,
        filename: req.file.originalname,
        file_path: req.file.path,
        upload_time: new Date(),
        expiry_time,
        sender_email,
        receiver_email,
        created_by: req.user ? req.user._id : null,
    }

    const fileDoc = await File.create(fileData)
    const downloadLink = `${process.env.BASE_URL}/api/file/download/${fileUuid}`

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
}

exports.downloadFile = async (req, res) => {
    try {
        const { fileId } = req.params
        const fileDoc = await File.findOne({ id: fileId })

        if (!fileDoc) return res.status(404).send({ message: "File not found" })
        if (new Date() > fileDoc.expiry_time) {
            fs.unlink(fileDoc.file_path, () => {})
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

        res.download(fileDoc.file_path, fileDoc.filename)
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
            file_size: fs.statSync(fileDoc.file_path).size,
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

        const filesWithSize = files
            .map((file) => {
                try {
                    const stats = fs.statSync(file.file_path)
                    return {
                        id: file.id,
                        filename: file.filename,
                        file_size: stats.size,
                        upload_time: file.upload_time,
                        expiry_time: file.expiry_time,
                        download_count: file.download_count,
                        sender_email: file.sender_email,
                    }
                } catch {
                    return null
                }
            })
            .filter(Boolean)

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

        try {
            fs.unlinkSync(fileDoc.file_path)
        } catch (err) {
            console.error("Error deleting file:", err)
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
