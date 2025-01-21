const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const {
  generateRefreshToken,
  generateAccessToken,
  verifyToken,
} = require("../utils/jwt");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists, please login" });
    }

    console.log("the existing user value comes as: ", existingUser);

    console.log("call came ---->>>");

    const user = new User({ name, email, password });
    await user.save();
    console.log("savedthe usr success");
    res.status(201).json({ message: "User registration was successfull" });
  } catch (error) {
    console.log("error furing register ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log("user data returned is this from mongodb: ", user);
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const ispasswordValid = await bcrypt.compare(password, user.password);
    if (!ispasswordValid) {
      return res
        .status(400)
        .json({
          message: "Your entered password is incorrect, please try again..",
        });
    }

    const accessTokenMoodyAI = generateAccessToken(user._id);
    const refreshTokenMoodyAI = generateRefreshToken(user._id);

    console.log("accessTokenMoodyAI: ", accessTokenMoodyAI);
    console.log("refreshTokenMoodyAI: ", refreshTokenMoodyAI);

    user.refreshTokens.push({ token: refreshTokenMoodyAI });
    await user.save();
    res
      .cookie("accessTokenMoodyAI", accessTokenMoodyAI, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        sameSite: "lax", // Lax allows cookies to be sent on navigation within the same site
      })
      .cookie("refreshTokenMoodyAI", refreshTokenMoodyAI, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .status(200)
      .json({ message: "Logged in successfully" });
  } catch (error) {
    console.log("error furing login ", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshTokenMoodyAI;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not provided" });
  }
  try {
    const payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!payload) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await User.findOne({
      _id: payload.userId,
      "refreshTokens.token": refreshToken,
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const accessTokenMoodyAI = generateAccessToken(user._id);
    const refreshTokenMoodyAI = generateRefreshToken(user._id);

    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.token !== refreshToken
    );
    user.refreshTokens.push({ token: refreshTokenMoodyAI });
    await user.save();

    res
      .cookie("accessTokenMoodyAI", accessTokenMoodyAI, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshTokenMoodyAI", refreshTokenMoodyAI, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ message: "Token refreshed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshTokenMoodyAI;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not provided" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { "refreshTokens.token": refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    res
      .clearCookie("accessTokenMoodyAI")
      .clearCookie("refreshTokenMoodyAI")
      .status(200)
      .json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
