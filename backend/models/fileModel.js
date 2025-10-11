const mongoose = require("mongoose");
const { Schema } = mongoose;

const fileSchema = new Schema(
  {
    id: { type: String, required: true, unique: true }, // UUID
    filename: { type: String, required: true },
    file_path: { type: String, required: true },
    upload_time: { type: Date, default: Date.now },
    expiry_time: { type: Date, required: true },
    sender_email: { type: String },
    receiver_email: { type: String },
    download_count: { type: Number, default: 0 },
    created_by: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
