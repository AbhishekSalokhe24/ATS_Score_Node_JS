const express = require("express");
const router = express.Router();

const { signup, login, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected routes
router.get("/profile", protect, getProfile);

module.exports = router;
