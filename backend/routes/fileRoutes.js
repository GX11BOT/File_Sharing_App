const express = require("express")
const multer = require("multer")
const path = require("path")
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

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
        cb(null, Date.now() + path.extname(file.originalname)),
})

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
