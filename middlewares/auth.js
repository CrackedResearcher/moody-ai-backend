const logger = require('../utils/logger');
logger.debug('This is a debug message'); 
const { decodeJwt } = require("../utils/jwt");

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; 

    console.log("Token:", token);
    
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    try {
        const decoded = decodeJwt(token, process.env.JWT_SECRET); 
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
        req.userId = decoded; 
        next();
    } catch (error) {
        console.error("Error in verifyToken:", error);
        logger.info("Error verifying token:", { error: error.message });
        return res.status(401).json({ message: "Unauthorized: Token verification failed" });
    }
};

module.exports = { verifyToken }; 