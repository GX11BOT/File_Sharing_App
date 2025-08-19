const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign({ user: { _id: user._id } }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = generateToken;
