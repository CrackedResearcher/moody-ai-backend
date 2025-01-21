require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const connectDB = require("./config/db");
const port = process.env.PORT || 4000;


const app = express();
const cors = require("cors");
app.use(
    cors({
      origin: ["http://localhost:3000", "https://moody-ai.onrender.com"], // Allowed origins
      credentials: true, // Allow credentials (cookies)
    })
  );
app.use(express.json());
app.use(cookieParser());
app.use("/api", authRoutes);

connectDB();


app.get("/", (req, res)=>{
    res.send("hey this is the first server of mine");
})

app.get("/hello", (req, res)=>{
    res.send("hey you just vivited a res hello route");
})

app.listen(port, ()=>{
    console.log("teh server start running with the command node server.js on port: ", port)
})