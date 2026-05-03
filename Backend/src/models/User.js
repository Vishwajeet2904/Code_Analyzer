const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: "" },
    plan: { type: String, enum: ["Free", "Pro", "Enterprise"], default: "Free" },
    isVerified: { type: Boolean, default: false },
    refreshTokens: [{ type: String }], // store hashed refresh tokens
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    githubConnected: { type: Boolean, default: false },
    githubUsername: { type: String, default: "" },
  },
  { timestamps: true }
);

// Remove sensitive fields from JSON output
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    plan: this.plan,
    isVerified: this.isVerified,
  };
};

module.exports = mongoose.model("User", userSchema);
