const express = require("express")
const User = require("../models/User");
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



module.exports = router;