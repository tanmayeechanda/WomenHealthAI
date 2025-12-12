// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

/* ============================================================
   Helper: create JWT for a user
============================================================ */
function createToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d", // token valid for 7 days
  });
}

/* ============================================================
   Email transporter using Gmail (for password reset)
============================================================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ============================================================
   POST /api/auth/register
============================================================ */
router.post("/register", async (req, res) => {
  try {
    let { name, email, password, dob } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // normalize email
    email = email.trim().toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      dob: dob ? new Date(dob) : undefined,
    });

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   POST /api/auth/login
============================================================ */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // normalize email
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   POST /api/auth/forgot-password
   - User submits email
   - We generate a reset token + expiry
   - Send email with reset link (or just log URL in dev)
============================================================ */
router.post("/forgot-password", async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });

    // Always respond the same for security (do not reveal if email exists or not)
    if (!user) {
      return res.json({
        message: "If this email exists, a reset link was sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password/${token}`;

    console.log("🔗 Password reset URL:", resetUrl);

    // If EMAIL_USER or EMAIL_PASS are not set, don't try to send email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(
        "⚠️ EMAIL_USER or EMAIL_PASS not set. Skipping email send. Use the reset URL from the console."
      );
      return res.json({
        message:
          "Reset link generated (email not configured). Check server logs for the link.",
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset your password - Women's Health AI",
      text: `You requested a password reset.\n\nClick this link to set a new password (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ Reset email sent to:", user.email);
      return res.json({
        message: "If this email exists, a reset link was sent.",
      });
    } catch (mailErr) {
      console.error("Email send error:", mailErr);
      // Don't crash – still allow using the link from console
      return res.json({
        message:
          "Reset link generated, but email could not be sent. Check server logs for the reset link.",
      });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   POST /api/auth/reset-password
   - Frontend passes token + newPassword
   - We verify token & expiry, then update passwordHash
============================================================ */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // token not expired
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message:
        "Password updated successfully. Please log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   GET /api/auth/me
   - Returns current user from token
   - Uses requireAuth middleware
============================================================ */
/* ============================================================
   POST /api/auth/google
   - Frontend sends Google credential (ID token)
   - We verify it with Google
   - Find or create user
   - Return our own JWT + user object
============================================================ */
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body; // id token from frontend
    if (!credential) {
      return res.status(400).json({ error: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = (payload.email || "").toLowerCase();
    const name = payload.name || "Google User";

    if (!email) {
      return res.status(400).json({ error: "No email in Google account" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user with a random password hash (not used for login)
      const bcrypt = require("bcrypt");
      const fakePasswordHash = await bcrypt.hash("google-" + payload.sub, 10);

      user = await User.create({
        name,
        email,
        passwordHash: fakePasswordHash,
      });
    }

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ error: "Google login failed" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authorized" });
  }

  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    dob: req.user.dob,
  });
});

module.exports = router;
