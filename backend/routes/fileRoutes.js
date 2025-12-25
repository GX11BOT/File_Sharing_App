const express = require("express")
const multer = require("multer")
const {
    uploadFile,
    downloadFile,
    getFileInfo,
    getMyFiles,
    deleteFile,
    sendEmail,
} = require("../controllers/fileController")
const authMiddleware = require("../middleware/authMiddleware")
const { optionalAuth } = require("../middleware/authMiddleware")

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage()

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
})

const router = express.Router()

router.post("/upload", optionalAuth, upload.single("file"), uploadFile)
router.get("/download/:fileId", downloadFile)
router.get("/info/:fileId", getFileInfo)
router.get("/my-files", authMiddleware, getMyFiles)
router.delete("/:fileId", authMiddleware, deleteFile)
router.post("/send-email", sendEmail)

module.exports = router
