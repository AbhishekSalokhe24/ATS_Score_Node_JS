const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect middleware — verifies JWT from Authorization header
 * Attaches the user object to req.user on success
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (exclude password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      next();
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token invalid" });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token provided" });
  }
};

module.exports = { protect };
