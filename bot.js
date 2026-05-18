import { Telegraf } from "telegraf";
import axios from "axios";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// storage (use DB later in production)
const users = {};

// 🪙 PVLT GAME CONTRACT
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC = process.env.RPC_URL;

const provider = new ethers.JsonRpcProvider(RPC);

bot.start((ctx) => {
ctx.reply("Welcome to PVLT Auto Claim Bot 🚀\nSend your wallet:");
});

// 💼 SAVE WALLET
bot.on("text", async (ctx) => {

const msg = ctx.message.text;

if (msg.startsWith("0x")) {
users[ctx.from.id] = { wallet: msg };

return ctx.reply("Wallet saved ✔\nNow send /claim");
}

ctx.reply("Send valid wallet starting with 0x");
});

// ⚡ CLAIM COMMAND
bot.command("claim", async (ctx) => {

const user = users[ctx.from.id];

if (!user?.wallet) {
return ctx.reply("No wallet found");
}

// STEP 1: get signature from Render
let res = await axios.post(
process.env.RENDER_URL + "/claim",
{
address: user.wallet,
points: 1000 // or fetch from DB/backend
}
);

let data = res.data;

if (!data.signature) {
return ctx.reply("Claim failed ❌");
}

// STEP 2: send tx to contract (via bot wallet)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const abi = [
"function claim(uint256,uint256,bytes) external"
];

const contract = new ethers.Contract(
CONTRACT_ADDRESS,
abi,
wallet
);

try {

const tx = await contract.claim(
data.amount,
data.nonce,
data.signature
);

await tx.wait();

ctx.reply("CLAIM SUCCESS ✅\nTX: " + tx.hash);

} catch (e) {
ctx.reply("Transaction failed ❌");
}

});

bot.launch();
console.log("Telegram bot running...");