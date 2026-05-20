const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// REQUIRED for Render
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/config", (req, res) => {
  res.json({
    token: process.env.TOKEN_CONTRACT,
    treasury: process.env.TREASURY_CONTRACT,
    engine: process.env.ENGINE_CONTRACT
  });
});

// root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});