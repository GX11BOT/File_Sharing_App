const express = require("express");
require("dotenv").config();
const dbConnect = require("./config/database");
const userRouter = require("./routes/userRoutes");
const fileRouter = require("./routes/fileRoutes");

const app = express();
const PORT = process.env.PORT || 4888;

// Middleware
app.use(express.json());
app.use("/uploads", express.static("uploads")); 

// Routes
app.use("/api/user", userRouter);
app.use("/api/file", fileRouter);

dbConnect().then(() => {
  app.listen(PORT, () => {
    console.log("Server running on port:", PORT);
  });
});
