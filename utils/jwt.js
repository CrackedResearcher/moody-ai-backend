const jwt = require("jsonwebtoken");
const logger = require("./logger");

const generateAccessToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION_TIME });
}

const generateRefreshToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME });
}

const verifyToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        logger.error("verifyToken resulted in an error, check this:", {error: error.message});
        return null;
    }
}

const decodeJwt = (token, secret) => {
    try {
        const verifiedToken = jwt.verify(token, secret); 
        return verifiedToken.userId; 
    } catch (error) {
        logger.error("decodeJwt resulted in an error:", {error: error.message});
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken, 
    decodeJwt
}