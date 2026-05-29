// CONFIGURATION
const BACKEND_URL = 'https://your-render-app.onrender.com'; // CHANGE THIS
const CONTRACT_ADDRESS = '0xYourERC20ContractAddress'; // CHANGE THIS
const TOKEN_ABI = ['function mint(address to, uint256 amount) public returns (bool)', 'function balanceOf(address account) view returns (uint256)'];

let web3, userAddress, taps = 0, maxTaps = 50;
let contract, provider;

// DOM Elements
const connectBtn = document.getElementById('connectWallet');
const tapArea = document.getElementById('tapArea');
const claimBtn = document.getElementById('claimReward');
const tapCountSpan = document.getElementById('tapCount');
const walletSpan = document.getElementById('walletAddress');
const statusSpan = document.getElementById('statusMsg');

// Check if WalletConnect is supported
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Connect Wallet (supports Mobile WalletConnect)
connectBtn.onclick = async () => {
    if (window.ethereum) {
        // MetaMask or injected provider
        provider = window.ethereum;
        web3 = new Web3(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];
        setupWallet();
    } else if (isMobile) {
        // Mobile WalletConnect
        try {
            const WalletConnectProvider = window.WalletConnectProvider.default;
            provider = new WalletConnectProvider({
                rpc: { 137: 'https://polygon-rpc.com' },
                chainId: 137
            });
            await provider.enable();
            web3 = new Web3(provider);
            userAddress = provider.accounts[0];
            setupWallet();
        } catch (err) {
            statusSpan.innerText = '❌ Please install MetaMask or Trust Wallet';
        }
    } else {
        statusSpan.innerText = '❌ Please install MetaMask extension';
    }
};

async function setupWallet() {
    walletSpan.innerText = userAddress.slice(0,6)+'...'+userAddress.slice(-4);
    contract = new web3.eth.Contract(TOKEN_ABI, CONTRACT_ADDRESS);
    tapArea.style.opacity = '1';
    tapArea.style.pointerEvents = 'auto';
    connectBtn.disabled = true;
    statusSpan.innerText = '✅ Tap the Pepe! 50 taps = PVLT reward';
    loadUserProgress();
}

// Load taps from backend
async function loadUserProgress() {
    const response = await fetch(`${BACKEND_URL}/progress/${userAddress}`);
    const data = await response.json();
    taps = data.taps;
    tapCountSpan.innerText = taps;
    if (taps >= maxTaps) {
        claimBtn.disabled = false;
        statusSpan.innerText = '🎉 Ready to claim your PVLT tokens!';
    }
}

// Tap counter with anti-cheat
let lastTapTime = 0;
tapArea.onclick = async () => {
    const now = Date.now();
    if (now - lastTapTime < 100) return; // Anti-spam
    if (taps >= maxTaps) {
        statusSpan.innerText = '⚠️ Already reached max taps! Claim your reward.';
        return;
    }
    lastTapTime = now;
    
    taps++;
    tapCountSpan.innerText = taps;
    
    // Visual feedback
    tapArea.style.transform = 'scale(0.95)';
    setTimeout(() => tapArea.style.transform = 'scale(1)', 100);
    
    // Send tap to backend for validation
    try {
        const response = await fetch(`${BACKEND_URL}/tap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: userAddress, timestamp: now })
        });
        
        if (!response.ok) throw new Error('Anti-cheat validation failed');
        
        if (taps >= maxTaps) {
            claimBtn.disabled = false;
            statusSpan.innerText = '🎉 Ready to claim!';
        }
    } catch (err) {
        statusSpan.innerText = '⚠️ Anti-cheat: Invalid tap detected';
        taps--;
        tapCountSpan.innerText = taps;
    }
};

// Claim reward (backend signs transaction)
claimBtn.onclick = async () => {
    claimBtn.disabled = true;
    statusSpan.innerText = '⏳ Validating with backend...';
    
    const response = await fetch(`${BACKEND_URL}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress })
    });
    
    const data = await response.json();
    if (!response.ok) {
        statusSpan.innerText = '❌ ' + data.error;
        claimBtn.disabled = false;
        return;
    }
    
    // Backend gave us a signed voucher - now mint via contract
    statusSpan.innerText = '⏳ Minting PVLT tokens...';
    try {
        const tx = await contract.methods.mint(userAddress, data.amount).send({ from: userAddress });
        statusSpan.innerText = `✅ Claimed ${data.amount/1e18} PVLT! Tx: ${tx.transactionHash.slice(0,10)}...`;
        claimBtn.disabled = true;
        tapCountSpan.innerText = '0';
        taps = 0;
    } catch (err) {
        statusSpan.innerText = '❌ Mint failed. Check if contract allows claiming.';
        claimBtn.disabled = false;
    }
};