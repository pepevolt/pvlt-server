import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(
process.env.RPC_URL
);

const wallet = new ethers.Wallet(
process.env.PRIVATE_KEY,
provider
);

const abi = [
"function mint(address to, uint256 amount) external"
];

const contract = new ethers.Contract(
process.env.GAME_CONTRACT,
abi,
wallet
);

export async function mintTokens(to, amount) {
try {

const tx = await contract.mint(to, amount);
await tx.wait();

return tx.hash;

} catch (err) {
console.log("Mint error:", err);
throw new Error("Mint failed");
}
}