const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ error: "No authorization header provided" });
  }

  // Expected: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid authorization format" });
  }

  const token = parts[1].trim();
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user; // Attach user to request
    next(); // Continue to route
  } catch (err) {
    console.error("Auth error:", err.name, err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { requireAuth };
