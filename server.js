const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

// POLYGON RPC ([Polygon Labs](chatgpt://generic-entity?number=0))
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");

// ADMIN WALLET (backend signer)
const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    provider
);

// ====== YOUR DEPLOYED CONTRACTS ======
const GAME_TOKEN_ADDRESS = "0xcaf3f8172d8accaa87d3eb9f679b693d04976aee";

// ONLY NEED GAME TOKEN ABI FOR MINT
const abi = [
    "function mint(address to, uint256 amount) external"
];

const gameToken = new ethers.Contract(
    GAME_TOKEN_ADDRESS,
    abi,
    wallet
);

// simple DB
const users = {};

function getUser(wallet) {
    if (!users[wallet]) {
        users[wallet] = { score: 0, lastTap: 0 };
    }
    return users[wallet];
}

// TAP SYSTEM
app.post("/tap", async (req, res) => {
    const { walletAddr } = req.body;

    if (!walletAddr) return res.json({ error: "No wallet" });

    const user = getUser(walletAddr);

    const now = Date.now();
    if (now - user.lastTap < 300) {
        return res.json({ error: "Too fast" });
    }

    user.lastTap = now;
    user.score += 1;

    res.json({
        wallet: walletAddr,
        score: user.score
    });
});

// CLAIM REWARDS (THIS CALLS YOUR CONTRACT)
app.post("/claim", async (req, res) => {
    const { walletAddr } = req.body;

    const user = getUser(walletAddr);

    const reward = Math.floor(user.score / 100);

    if (reward <= 0) {
        return res.json({ error: "No reward" });
    }

    try {
        const tx = await gameToken.mint(walletAddr, reward * 10 ** 18);
        await tx.wait();

        user.score = 0; // reset after claim

        res.json({
            success: true,
            minted: reward,
            tx: tx.hash
        });

    } catch (e) {
        res.json({ error: e.message });
    }
});

app.listen(3000, () => {
    console.log("PEPEVOLT system running");
});