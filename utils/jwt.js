const jwt = require("jsonwebtoken");

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
        return null;
    }
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
}