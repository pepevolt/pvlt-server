require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ethers = require("ethers");

const app = express();

app.use(cors());
app.use(express.json());

// Main database lookup tracking session logs
const userProgressDatabase = {};

// Blockchain Admin Provider Configuration
let adminWallet;
let gameContractAdmin;

const GAME_ABI = [
    "function tap() external",
    "function gPVLT(address) view returns(uint256)"
];

async function initAdminSyncEngine() {
    try {
        if (process.env.PRIVATE_KEY && process.env.GAME_CONTRACT) {
            const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
            adminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
            gameContractAdmin = new ethers.Contract(process.env.GAME_CONTRACT, GAME_ABI, adminWallet);
            console.log(`Synchronization wallet running: ${adminWallet.address}`);
        } else {
            console.log("Warning: Missing PRIVATE_KEY or GAME_CONTRACT env variables. Sync will fail.");
        }
    } catch(e) {
        console.error("Failed to boot blockchain admin update worker:", e);
    }
}
initAdminSyncEngine();

app.get("/api/config", (req, res) => {
    res.json({
        pvlt: process.env.PVLT_CONTRACT,
        treasury: process.env.TREASURY_CONTRACT,
        game: process.env.GAME_CONTRACT
    });
});

app.get("/api/user-stats", (req, res) => {
    const { address } = req.query;
    if (!address) {
        return res.status(400).json({ error: "Required address identification string missing parameter mapping." });
    }

    const standardMappingKey = address.toLowerCase();
    
    if (!userProgressDatabase[standardMappingKey]) {
        userProgressDatabase[standardMappingKey] = {
            energy: 1000,
            gPVLT: 0.0
        };
    }

    res.json(userProgressDatabase[standardMappingKey]);
});

app.post("/api/sync-progress", (req, res) => {
    const { walletAddress, currentGPVLT, currentEnergy } = req.body;
    
    if (!walletAddress) {
        return res.status(400).json({ error: "Invalid synchronization payload array: wallet location expected." });
    }

    const standardMappingKey = walletAddress.toLowerCase();

    userProgressDatabase[standardMappingKey] = {
        energy: parseInt(currentEnergy) || 0,
        gPVLT: parseFloat(currentGPVLT) || 0.0
    };

    res.json({ success: true, timestamp: Date.now() });
});

// CRITICAL ROUTE: Syncs off-chain taps to the on-chain smart contract before a user claims or converts
app.post("/api/blockchain-sync", async (req, res) => {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: "Missing address identification payload." });

    if (!gameContractAdmin) {
        return res.status(500).json({ error: "Admin wallet engine is offline. Check backend configurations." });
    }

    try {
        const key = walletAddress.toLowerCase();
        const localRecord = userProgressDatabase[key] || { energy: 1000, gPVLT: 0.0 };

        // 1. Query what the smart contract currently thinks the user's gPVLT is
        const contractScoreWei = await gameContractAdmin.gPVLT(walletAddress);
        const contractScore = parseFloat(ethers.utils.formatEther(contractScoreWei));

        // 2. If their server taps are greater than on-chain score, submit a transaction to close the gap
        if (localRecord.gPVLT > contractScore) {
            const tapDifference = Math.floor(localRecord.gPVLT - contractScore);
            console.log(`Writing ${tapDifference} missing database score elements for ${walletAddress}`);

            // Send standard tap requests to update contract mapping state storage safely
            for(let i = 0; i < tapDifference; i++) {
                const tx = await gameContractAdmin.tap({ gasLimit: 120000 });
                await tx.wait(); // Ensures nonces stay linear
            }
        }
        res.json({ success: true });
    } catch(err) {
        console.error("Blockchain sync transaction failed:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get("/", (req, res) => {
    res.send("PVLT HYBRID SERVER RUNNING - CLICKS PERSISTENCE INTERFACES DEPLOYED OPERATIONAL");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`SERVER STARTED ON PORT ${PORT}`);
});
