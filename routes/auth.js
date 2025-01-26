const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const {
  generateRefreshToken,
  generateAccessToken,
  verifyToken,
} = require("../utils/jwt");
const logger = require('../utils/logger');

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

    const user = new User({ name, email, password });

    const accessTokenMoodyAI = generateAccessToken(user._id);
    const refreshTokenMoodyAI = generateRefreshToken(user._id);

    user.refreshTokens.push({ token: refreshTokenMoodyAI });
    await user.save();

    res
      .status(201)
      .json({ 
        message: "User registration successful!",
        accessToken: accessTokenMoodyAI,
        refreshToken: refreshTokenMoodyAI
       });
      logger.info("cookies were generated in register-----");



  } catch (error) {
    logger.info("error furing register ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

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


    user.refreshTokens.push({ token: refreshTokenMoodyAI });
    await user.save();

    res
      .status(200)
      .json({ 
        message: "User login successful!",
        accessToken: accessTokenMoodyAI,
        refreshToken: refreshTokenMoodyAI
       });

      logger.info("cookies were generated in login-----");


  } catch (error) {
    logger.info("error furing login ", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/refresh", async (req, res) => {
  logger.info("refresh logic was triggered-----")
  const refreshToken = req.body;
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
      .status(200)
      .json({ 
        message: "Tokens refreshed",
        accessToken: accessTokenMoodyAI,
        refreshToken: refreshTokenMoodyAI
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = req.body;
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

router.post("/verify-token", async (req, res) => {
  const accessToken = req.body.token;

  if (!accessToken) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const payload = verifyToken(accessToken, process.env.JWT_SECRET);

    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired access token" });
    }

    return res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
});

module.exports = router;
