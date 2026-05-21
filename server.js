require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();

// Enabled specific cross-origin handling to support mobile web3 in-app browsers
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// In-Memory Database State
const db = {}; 

const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const walletSigner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

function getUser(wallet) {
    if (!wallet) return null;
    const addr = wallet.toLowerCase();
    if (!db[addr]) {
        db[addr] = { points: 0, energy: 50, pvltBalance: 0.0, nonce: 0 };
    }
    return db[addr];
}

app.post('/user', (req, res) => {
    const user = getUser(req.body.wallet);
    if(!user) return res.status(400).json({ error: "Invalid address argument provided." });
    res.json(user);
});

app.post('/tap', (req, res) => {
    const user = getUser(req.body.wallet);
    if(!user) return res.status(400).json({ error: "Invalid address argument provided." });
    
    if (user.energy <= 0) {
        return res.status(400).json({ error: "Out of energy! Purchase premium energy packs." });
    }
    
    user.points += 1;
    user.energy -= 1;
    res.json(user);
});

app.post('/swap-points', (req, res) => {
    const user = getUser(req.body.wallet);
    if(!user) return res.status(400).json({ error: "Invalid profile contextualized." });
    if (user.points < 10000) return res.status(400).json({ error: "Need a minimum of 10,000 gPVLT to convert into real balance assets." });
    
    const increment = Math.floor(user.points / 10000);
    user.points = user.points % 10000; 
    user.pvltBalance += increment;
    
    res.json(user);
});

app.post('/refill', (req, res) => {
    const user = getUser(req.body.wallet);
    if(!user) return res.status(400).json({ error: "Invalid target user handle." });
    user.energy += 10000; 
    res.json(user);
});

app.post('/claim-pvlt', async (req, res) => {
    const user = getUser(req.body.wallet);
    if(!user) return res.status(400).json({ error: "Invalid target user profile." });
    
    const claimAmount = Math.floor(user.pvltBalance);
    if (claimAmount < 100 || claimAmount > 500) {
        return res.status(400).json({ error: `Claim Restricted: Your balance is ${user.pvltBalance.toFixed(2)} PVLT. You can only claim when your balance is between 100 and 500 PVLT.` });
    }

    try {
        const messageHash = ethers.utils.solidityKeccak256(
            ["address", "uint256", "uint256", "address"],
            [req.body.wallet, claimAmount, user.nonce, process.env.TREASURY_VAULT_ADDRESS]
        );
        
        const signature = await walletSigner.signMessage(ethers.utils.arrayify(messageHash));
        
        user.pvltBalance -= claimAmount;
        user.nonce += 1; 

        res.json({ claimAmount, signature, remainingPvlt: user.pvltBalance });
    } catch (err) {
        res.status(500).json({ error: "Claim processing signature generation failed." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Ecosystem Core listening active on port ${PORT}`));
