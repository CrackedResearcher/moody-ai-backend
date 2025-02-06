require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("../routes/auth");
const dashboardRoutes = require("../routes/dashboard");
const connectDB = require("../config/db");
const morgan = require('morgan');
const logger = require('../utils/logger');


const port = process.env.PORT || 4000;


const app = express();
const cors = require("cors");
app.use(
    cors({
      origin: ["http://localhost:3000","https://moody-ai.onrender.com"], // allowed origins
      credentials: true, 
    })
  );
app.use(express.json());
app.use(cookieParser());
app.use("/api", authRoutes);
app.use("/api", dashboardRoutes);

app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) }
}));

try {
  connectDB(); 
} catch (err) {
  logger.error('Database connection failed', {
    error: err.stack,
    dbHost: process.env.DB_HOST
  });
  process.exit(1);
}


app.listen(port, ()=>{
    logger.info("teh server start running with the command node server.js on port: ", port)
})