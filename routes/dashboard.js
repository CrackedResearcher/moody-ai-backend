const express = require("express")
const User = require("../models/User");
const Mood = require("../models/Mood");
const logger = require('../utils/logger');
const { verifyToken} = require("../middlewares/auth")

const router = express.Router()

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
        logger.error("Error fetching user details:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            userDetails: null,
        });
    }
});

router.post("/dailyMood", verifyToken, async(req, res)=>{
    try {
        const { emotion, moodScore, activities } = req.body;

        const newMoodEntry = await Mood.create({
            user: req.userId,
            moodEmotions: emotion,
            moodScore,
            activities,
            timestamp: new Date()
        });

        if(newMoodEntry){
            return res.status(201).json({
                message: "Mood logged successfully!",
                success: true,
            })
        }
    } catch (error) {
        logger.error("Error while loggin the mood: ", error)
        return res.status(500).json({
            message: "Failed to log the mood for today..",
            success: false,
        })
    }
});


module.exports = router;