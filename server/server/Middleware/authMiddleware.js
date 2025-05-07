const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
  const publicRoutes = ["/api/login", "/api/login-users", "/api/users"];
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const authHeader = req.header("Authorization");
  if (!authHeader) {
    console.log("❌ No Authorization header provided");
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  // Extract token
  const token = authHeader.startsWith("Bearer")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("🚨 JWT Error:", error.message);
    return res
      .status(403)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
