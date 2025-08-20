const File = require("../models/fileModel");
const DownloadLog = require("../models/downloadLogModel");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");

// Configure nodemailer with your SMTP info in .env
const transporter = nodemailer.createTransport({
  service: "Gmail", // or other SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Upload file
exports.uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).send({ message: "No file uploaded" });

  const { sender_email, receiver_email } = req.body;
  const expiryHrs = 24; // 24 hours expiry
  const expiry_time = new Date(Date.now() + expiryHrs * 60 * 60 * 1000);

  const fileUuid = uuidv4();
  const fileData = {
    id: fileUuid,
    filename: req.file.originalname,
    file_path: req.file.path,
    upload_time: new Date(),
    expiry_time,
    sender_email,
    receiver_email,
    created_by: req.user ? req.user._id : null
  };

  const fileDoc = await File.create(fileData);
  const downloadLink = ${process.env.BASE_URL}/api/file/download/${fileUuid};

  // Send email if recipient provided
  if (receiver_email) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: receiver_email,
      subject: "File download link",
      text: You have received a file. Download: ${downloadLink}\nIt will expire in 24 hours.
    });
  }

  res.status(201).json({
    message: "File uploaded successfully",
    downloadLink,
    fileId: fileUuid,
    expiryTime: expiry_time
  });
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileDoc = await File.findOne({ id: fileId });

    if (!fileDoc) return res.status(404).send({ message: "File not found" });
    if (new Date() > fileDoc.expiry_time) {
      // Optional: delete file + metadata
      fs.unlink(fileDoc.file_path, () => {});
      await File.deleteOne({ id: fileId });
      return res.status(410).send({ message: "File link expired" });
    }

    // Increment download count
    fileDoc.download_count += 1;
    await fileDoc.save();

    // Log download
    await DownloadLog.create({
      file_id: fileId,
      ip_address: req.ip,
      user_id: req.user ? req.user._id : null
    });

    res.download(fileDoc.file_path, fileDoc.filename);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
