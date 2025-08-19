const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  try {
    const token = authorization.split(" ")[1];
    const userData = jwt.verify(token, process.env.JWT_SECRET);
    if (!userData) return res.status(401).json({ message: "User not found" });

    const { _id } = userData.user;
    const user = await User.findById(_id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = authMiddleware;
