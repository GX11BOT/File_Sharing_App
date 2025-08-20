const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadFile, downloadFile } = require("../controllers/fileController");
const authMiddleware = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const router = express.Router();

// Upload route -- auth optional (allow guest or require auth according to your policy)
router.post("/upload", authMiddleware, upload.single("file"), uploadFile);

// Download route, open to all
router.get("/download/:fileId", downloadFile);

module.exports = router;
