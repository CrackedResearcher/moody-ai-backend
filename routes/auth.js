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

    const isProduction = process.env.NODE_ENV === "production";
    logger.info("isProduction", {isProduction: isProduction});
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
      domain: isProduction ? ".onrender.com" : undefined,
      path: "/",
    };

    res
      .cookie("accessTokenMoodyAI", accessTokenMoodyAI, cookieOptions)
      .cookie("refreshTokenMoodyAI", refreshTokenMoodyAI, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      })
      .status(201)
      .json({ message: "User registration was successfull!" });
      logger.info("cookies were generated in register-----", {
        accessToken: accessTokenMoodyAI,
        refreshToken: refreshTokenMoodyAI
      });



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

    const isProduction = process.env.NODE_ENV === "production";
    logger.info("isProduction", {isProduction: isProduction});
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
      domain: isProduction ? ".onrender.com" : undefined,
      path: "/",
    };

    res
      .cookie("accessTokenMoodyAI", accessTokenMoodyAI, cookieOptions)
      .cookie("refreshTokenMoodyAI", refreshTokenMoodyAI, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ message: "Logged in successfully" });

      logger.info("cookies were generated in login-----", {
        accessToken: accessTokenMoodyAI,
        refreshToken: refreshTokenMoodyAI
      });


  } catch (error) {
    logger.info("error furing login ", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/refresh", async (req, res) => {
  logger.info("refresgn logic was triggered-----")
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
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
        path: "/",
      })
      .cookie("refreshTokenMoodyAI", refreshTokenMoodyAI, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      })
      .status(200)
      .json({ message: "Tokens refreshed" });
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
