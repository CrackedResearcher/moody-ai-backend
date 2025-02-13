const express = require("express");
const User = require("../models/User");
const Mood = require("../models/Mood");
const logger = require("../utils/logger");
const { verifyToken } = require("../middlewares/auth");

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

router.post("/dailyMood", verifyToken, async (req, res) => {
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
    const latestMood = await Mood.findOne({
      user: req.userId,
    }).sort({
      timestamp: -1,
    });

    logger.info("the latest mood fetched is this; ", {latestMood: latestMood})

    const allMoods = await Mood.find({ user: req.userId }).sort({
      timestamp: -1,
    });

    logger.info("all the moods for the user is this: ", {allMoods: allMoods})
    let currentStreak = 0;
    let lastDate = null;

    const isConsecutiveDay = (date1, date2) => {
      const day1 = new Date(date1).setHours(0, 0, 0, 0);
      const day2 = new Date(date2).setHours(0, 0, 0, 0);
      const diffTime = Math.abs(day1 - day2);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays === 1;
    };

    for (let i = 0; i < allMoods.length; i++) {
      const currentDate = new Date(allMoods[i].timestamp);

      if (i === 0) {
        currentStreak = 1;
        lastDate = currentDate;
      } else if (isConsecutiveDay(lastDate, currentDate)) {
        currentStreak++;
        lastDate = currentDate;
      } else {
        break;
      }
    }

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
        totalEntries: allMoods.length,
      },
    });
  } catch (error) {
    logger.info("Error fetching mood data:", {error: error});
    return res.status(500).json({
      message: "Failed to fetch mood data",
      success: false,
    });
  }
});

module.exports = router;
