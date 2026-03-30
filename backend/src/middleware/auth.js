const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect middleware — verifies the JWT in the Authorization header.
 * Usage: router.get("/profile", protect, (req, res) => { ... })
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized to access this route" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey123");

    // Add user to request object
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(404).json({ success: false, message: "No user found with this id" });
    }

    next();
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    return res.status(401).json({ success: false, message: "Not authorized to access this route" });
  }
};

/**
 * RestrictTo middleware — limits access to specific roles.
 * Usage: router.delete("/user", protect, restrictTo("Admin"), (req, res) => { ... })
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
