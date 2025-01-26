const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    logger.info("MongoDB connection init...")
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected successfully...")
  } catch (error) {
    logger.error("MongoDB connection unsuccessfull. Exiting the process:", error.message)
    process.exit(1); 
  } 
};

module.exports = connectDB;
