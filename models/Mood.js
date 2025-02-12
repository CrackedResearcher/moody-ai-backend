const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true
    },
    moodEmotions: {
        type: String, 
        required: true
    },
    moodScore: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    activities: [{
        type: String
    }],
    moodDescription: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    streaks: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Mood = mongoose.model("Mood", moodSchema);

module.exports = Mood;