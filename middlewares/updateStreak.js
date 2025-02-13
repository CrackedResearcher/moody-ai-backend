const Streak = require("../models/Streaks");
const logger = require("../utils/logger");

const updateStreak = async (req, res, next) => {
  try {
    const userId = req.userId; 
    const today = new Date().setHours(0, 0, 0, 0);

    let userStreak = await Streak.findOne({ user: userId });

    if (!userStreak) {

      userStreak = await Streak.create({
        user: userId,
        currentStreak: 1,
        longestStreak: 1,
        totalEntries: 1,
        lastLoggedDate: today,
        streakHistory: [],
      });

      logger.info(`New streak created for user ${userId}`);
      return next();
    }

    const lastDate = new Date(userStreak.lastLoggedDate).setHours(0, 0, 0, 0);
    const diffDays = (today - lastDate) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      userStreak.currentStreak++;
      userStreak.longestStreak = Math.max(userStreak.longestStreak, userStreak.currentStreak);
      logger.info(`Streak continued for user ${userId}: ${userStreak.currentStreak}`);
    } else if (diffDays > 1) {
      userStreak.streakHistory.push({
        startDate: new Date(userStreak.lastLoggedDate),
        endDate: new Date(lastDate),
        length: userStreak.currentStreak,
      });

      userStreak.currentStreak = 1;
      logger.info(`Streak reset for user ${userId}.`);
    }

    userStreak.totalEntries++;
    userStreak.lastLoggedDate = today;
    await userStreak.save();

    next(); 
  } catch (error) {
    logger.error("Error updating streak: ", { error });
    return res.status(500).json({
      message: "Failed to update streak",
      success: false,
    });
  }
};

module.exports = { updateStreak };