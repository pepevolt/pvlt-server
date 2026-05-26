require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/health", (req, res) => {
    res.json({
        status: "PVLT SERVER RUNNING"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`PVLT SERVER RUNNING ON ${PORT}`);
});