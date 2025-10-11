const express = require("express")
const cors = require("cors")
const cron = require("node-cron")
const fs = require("fs")
require("dotenv").config()
const dbConnect = require("./config/database")
const userRouter = require("./routes/userRoutes")
const fileRouter = require("./routes/fileRoutes")
const File = require("./models/fileModel")
const DownloadLog = require("./models/downloadLogModel")

const app = express()
const PORT = process.env.PORT || 4888

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static("uploads"))

app.use("/api/user", userRouter)
app.use("/api/file", fileRouter)

cron.schedule("0 * * * *", async () => {
    try {
        const now = new Date()
        const expiredFiles = await File.find({ expiry_time: { $lt: now } })

        let deletedCount = 0
        for (const file of expiredFiles) {
            try {
                if (fs.existsSync(file.file_path)) {
                    fs.unlinkSync(file.file_path)
                }
                await DownloadLog.deleteMany({ file_id: file.id })
                await File.deleteOne({ id: file.id })
                deletedCount++
            } catch (err) {
                console.error(`Error deleting file ${file.id}:`, err.message)
            }
        }

        if (deletedCount > 0) {
            console.log(`Cleanup: deleted ${deletedCount} expired file(s)`)
        }
    } catch (err) {
        console.error("Cleanup error:", err.message)
    }
})

dbConnect().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
})
