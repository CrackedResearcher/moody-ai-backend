const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refreshTokens: [
    {
      token: { type: String },
    },
  ],
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    const bcrypt = require("bcrypt");
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

const User = mongoose.model("User", userSchema);

module.exports = User;