const express = require("express");
const User = require("../models/User");
const Mood = require("../models/Mood");
const Streaks = require("../models/Streaks");
const logger = require("../utils/logger");
const { verifyToken } = require("../middlewares/auth");
const { updateStreak } = require("../middlewares/updateStreak");

const router = express.Router();

router.get("/getUserDetails", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        userDetails: null,
      });
    }

    return res.status(200).json({
      message: "User details fetched successfully!",
      success: true,
      userDetails: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error("Error fetching user details:", {error: error});
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      userDetails: null,
    });
  }
});

router.post("/dailyMood", verifyToken, updateStreak, async (req, res) => {
  try {
    const { emotion, moodScore, activities } = req.body;

    const newMoodEntry = await Mood.create({
      user: req.userId,
      moodEmotions: emotion,
      moodScore,
      activities,
      timestamp: new Date(),
    });

    if (newMoodEntry) {
      return res.status(201).json({
        message: "Mood logged successfully!",
        success: true,
      });
    }
  } catch (error) {
    logger.error("Error while loggin the mood: ", {error: error});
    return res.status(500).json({
      message: "Failed to log the mood for today..",
      success: false,
    });
  }
});

router.get("/getDailyMoodData", verifyToken, async (req, res) => {
    try {
      const latestMood = await Mood.findOne({ user: req.userId }).sort({ timestamp: -1 });
      const allMoods = await Mood.find({ user: req.userId }).sort({ timestamp: -1 });
  
      const uniqueDates = [...new Set(allMoods.map(mood => 
        new Date(mood.timestamp).setHours(0, 0, 0, 0)
      ))];
  

      const userStreak = await Streaks.findOne({ user: req.userId });
      const currentStreak = userStreak ? userStreak.currentStreak : 0;
  
      return res.status(200).json({
        success: true,
        data: {
          lastEntry: latestMood ? latestMood.timestamp : null,
          latestMood: latestMood
            ? {
                emotion: latestMood.moodEmotions,
                score: latestMood.moodScore,
                activities: latestMood.activities,
              }
            : null,
          currentStreak,
          totalEntries: uniqueDates.length, 
        },
      });
    } catch (error) {
        console.log("error: ", error)
      logger.error("Error fetching mood data:", { error: error });
      return res.status(500).json({
        message: "Failed to fetch mood data",
        success: false,
      });
    }
  });

module.exports = router;
