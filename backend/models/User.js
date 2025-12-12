const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // ensures stored in lowercase
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    dob: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// Ensure email uniqueness (helps with deployment issues)
UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);
