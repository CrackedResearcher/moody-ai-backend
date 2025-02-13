const mongoose = require("mongoose");

const streakSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number, 
    default: 0,
  },
  totalEntries: {
    type: Number,
    default: 0,
  },
  lastLoggedDate: {
    type: Date,
    default: null,
  },
  streakHistory: [
    {
      startDate: Date,
      endDate: Date,
      length: Number,
    },
  ],
});

const Streaks = mongoose.model("Streaks", streakSchema);

module.exports = Streaks;