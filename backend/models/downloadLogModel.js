const mongoose = require("mongoose");
const { Schema } = mongoose;

const downloadLogSchema = new Schema(
  {
    file_id: { type: String, required: true }, // UUID
    timestamp: { type: Date, default: Date.now },
    ip_address: { type: String },
    user_id: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DownloadLog", downloadLogSchema);
