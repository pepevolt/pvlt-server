import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= PROVIDER ================= */
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

/* ================= SIGNER ================= */
const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

/* ================= GAME CONTRACT ABI ================= */
const ABI = [
  "function claim(uint256 amount,uint256 nonce,bytes signature) external"
];

/* ================= CLAIM ENDPOINT ================= */
app.post("/claim", async (req, res) => {
  try {
    const { address, points } = req.body;

    if (!address || !points) {
      return res.status(400).json({ error: "Missing data" });
    }

    // Convert points → token amount
    let amount = Math.floor(points / 10000);

    if (amount < 100) {
      return res.status(400).json({ error: "Minimum not met" });
    }

    if (amount > 500) amount = 500;

    // SIMPLE NONCE
    const nonce = Date.now();

    // MESSAGE TO SIGN
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256"],
      [address, amount, nonce]
    );

    // SIGN MESSAGE
    const signature = await wallet.signMessage(
      ethers.getBytes(messageHash)
    );

    res.json({
      amount,
      nonce,
      signature
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("PVLT SERVER RUNNING ON PORT", PORT);
});