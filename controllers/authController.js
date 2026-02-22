const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ──────────────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
// ──────────────────────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Check if all fields are provided
    if (!firstName || !lastName || !username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all fields" });
    }

    // Check if user already exists (by email or username)
    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
    });

    // Respond with user data + token
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────
// @desc    Login user (by email OR username)
// @route   POST /api/auth/login
// @access  Public
// ──────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    // "login" can be either an email or a username
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email/username and password",
      });
    }

    // Find user by email or username, explicitly select password
    const user = await User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { username: login.toLowerCase() },
      ],
    }).select("+password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Respond with user data + token
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────
// @desc    Get logged-in user's profile
// @route   GET /api/auth/profile
// @access  Private (requires JWT)
// ──────────────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { signup, login, getProfile };
