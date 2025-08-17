
const express = require("express");
require("dotenv").config();
const dbConnect = require("./config/database");

const app = express();

const PORT = process.env.PORT || 4888;

app.use(express.json());


dbConnect().then(() => {
  app.listen(PORT, () => {
    console.log("Server running on port:", PORT);
  });
}).catch((err) => {
  console.error("Failed to connect to the database.", err);
});
