const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateTokens");
const validator = require("validator");

const registerUser = async (req, res) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !emailId || !password)
    return res.status(400).send({ message: "Please add all mandatory fields" });

  if (!validator.isEmail(emailId))
    return res.status(400).send({ message: "Please provide correct email" });

  if (!validator.isStrongPassword(password))
    return res.status(400).send({ message: "Please provide strong password" });

  try {
    const userExists = await User.findOne({ emailId });
    if (userExists)
      return res.status(400).json({ message: "Already Exist" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstName,
      lastName,
      emailId,
      password: hashedPassword
    });

    const token = generateToken(newUser);
    return res.status(201).json({
      message: "USER ADDED SUCCESSFULLY",
      token
    });
  } catch (err) {
    return res.status(500).json({ err: err.message });
  }
};

const loginUser = async (req, res) => {
  const { emailId, password } = req.body;
  if (!emailId || !password)
    return res.status(400).json({ message: "ADD ALL DETAILS" });

  try {
    const userExists = await User.findOne({ emailId });
    if (!userExists)
      return res.status(400).json({ message: "No user Found" });

    const isValid = await bcrypt.compare(password, userExists.password);
    if (!isValid)
      return res.status(400).json({ message: "Incorrect Password" });

    const token = generateToken(userExists);
    return res.status(200).json({ message: "LoggedIn", token });
  } catch (err) {
    return res.status(500).json({ err: err.message });
  }
};

module.exports = { registerUser, loginUser };
