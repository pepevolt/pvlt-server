<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>PVLT Game & Utility Hub</title>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js"></script>
    
    <script src="https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/web3modal@1.9.12/dist/index.js"></script>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        html, body {
            width: 100%;
            height: 100%;
            background: #020b18;
            font-family: Arial, sans-serif;
            color: white;
        }
        body {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }
        .topbar {
            width: 100%;
            padding: 14px 18px;
            background: #091426;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            font-weight: bold;
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            gap: 20px;
        }
        
        /* TAP ELEMENT CODE */
        .tapContainer {
            width: 220px;
            height: 220px;
            margin-top: 10px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4ef2a4, #00bfff);
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 0 30px rgba(0, 255, 180, 0.25);
            cursor: pointer;
            clip-path: circle(50% at 50% 50%);
            -webkit-clip-path: circle(50% at 50% 50%);
            user-select: none;
            -webkit-user-select: none;
            transform: translateZ(0);
            transition: transform 0.05s;
        }
        .tapContainer:active {
            transform: scale(0.95);
        }
        .tapContainer img {
            width: 78%;
            height: 78%;
            object-fit: contain;
            pointer-events: none;
        }
        
        /* CARD MODULAR STRUCTURE */
        .card {
            width: 100%;
            max-width: 400px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .card-title {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #00ff99;
            margin-bottom: 4px;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
            padding-bottom: 6px;
        }
        input {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 12px;
            background: #0c1628;
            color: white;
            font-size: 14px;
            outline: none;
            text-align: center;
        }
        .actionBtn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: bold;
            background: linear-gradient(90deg, #00ff99, #00ccff);
            color: black;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .actionBtn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .withdrawBtn {
            background: linear-gradient(90deg, #ffcc00, #ff6600);
            color: white;
        }
        .stakeBtn {
            background: linear-gradient(90deg, #b066ff, #00e5ff);
            color: white;
        }
        .status {
            text-align: center;
            font-size: 12px;
            color: #00ff99;
            font-weight: bold;
            display: none;
        }
        .balance-box {
            width: 100%;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 12px;
            font-size: 13px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .balance-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .val-highlight { color: #00ff99; font-weight: bold; }
        .val-blue { color: #00ccff; font-weight: bold; }
        .val-purple { color: #d099ff; font-weight: bold; }

        /* POPUP MODAL OVERLAY STYLES */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(2, 11, 24, 0.85);
            backdrop-filter: blur(5px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: 0.25s;
        }
        .modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        .modal-box {
            width: 90%;
            max-width: 340px;
            background: #091426;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            padding: 24px;
            text-align: center;
            transform: scale(0.9);
            transition: 0.25s;
        }
        .modal-overlay.active .modal-box {
            transform: scale(1);
        }
        .modal-box h3 {
            font-size: 18px;
            margin-bottom: 12px;
            color: #00ff99;
        }
        .modal-box p {
            font-size: 14px;
            line-height: 1.5;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        .modal-buttons {
            display: flex;
            gap: 12px;
        }
        .modal-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
        }
        .btn-confirm { background: linear-gradient(90deg, #00ff99, #00ccff); color: black; }
        .btn-cancel { background: rgba(255, 255, 255, 0.1); color: white; }

        .info-footer {
            font-size: 11px;
            opacity: 0.5;
            text-align: center;
            line-height: 1.6;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>

<div class="topbar">
    <div>🛢️ Energy: <span id="energy">50</span></div>
    <div>⚡ Points: <span id="points">0</span></div>
    <div>💎 PVLTG: <span id="pvltg">0.0000</span></div>
</div>

<div class="main">
    
    <div class="tapContainer" id="tapZone">
        <img src="images/IMG_1850.png" alt="Game Target Core">
    </div>

    <div class="card">
        <div class="card-title">Identity & Access</div>
        <input id="walletInput" value="Connect Polygon Wallet" readonly>
        <button class="actionBtn" id="walletBtn" onclick="connectWallet()">CONNECT WALLET</button>
        <div class="status" id="walletStatus">CONNECTED NETWORK: POLYGON</div>
    </div>

    <div class="card">
        <div class="card-title">Token Ledger (Contract #1)</div>
        <div class="balance-box">
            <div class="balance-line">
                <span>Personal Wallet PVLT:</span>
                <span class="val-highlight" id="userPvltBalance">0.0000</span>
            </div>
            <div class="balance-line">
                <span>Approved Allowance:</span>
                <span id="contractAllowance">0.0000</span>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-title">Staking Engine (Contract #2)</div>
        <div class="balance-box">
            <div class="balance-line">
                <span>Total Amount Staked:</span>
                <span class="val-purple" id="userStakedWeight">0.0000 PVLT</span>
            </div>
            <div class="balance-line">
                <span>Accumulated Rewards:</span>
                <span class="val-highlight" id="pendingStakingYield">0.0000 PVLT</span>
            </div>
        </div>
        <input type="number" id="stakeAmountInput" placeholder="Enter PVLT Amount">
        <div style="display: flex; gap: 10px;">
            <button class="actionBtn stakeBtn" onclick="executeStakeTokens()">STAKE</button>
            <button class="actionBtn stakeBtn" style="background:#0c1628; border:1px solid #b066ff;" onclick="executeUnstakeTokens()">UNSTAKE</button>
        </div>
        <button class="actionBtn" style="background: linear-gradient(90deg, #b066ff, #ff66b2);" onclick="executeClaimYield()">CLAIM STAKING REWARDS</button>
    </div>

    <div class="card">
        <div class="card-title">Treasury Ecosystem (Contract #3)</div>
        <div class="balance-box">
            <div class="balance-line">
                <span>Available Treasury Liquidity:</span>
                <span class="val-blue" id="treasuryPvltPool">0.0000</span>
            </div>
        </div>
        <button class="actionBtn" onclick="openBuyModal()">BUY INSTANT ENERGY (+100k Pack)</button>
        <button class="actionBtn" id="swapBtn" onclick="openSwapModal()">SWAP POINTS → PVLTG</button>
        <button class="actionBtn withdrawBtn" id="withdrawBtn" onclick="claimPVLT()">WITHDRAW PVLT TO WALLET</button>
    </div>

    <div class="info-footer">
        1 Tap = 1 Point | 10k Points = 1 PVLTG | 100 PVLTG = 1 PVLT<br>
        Contracts Managed: ERC20 Core, Staking Engine & Utilities Vault.
    </div>
</div>

<div class="modal-overlay" id="buyModal">
    <div class="modal-box">
        <h3>Buy Energy Pack</h3>
        <p>Authorize payment of <b>100 PVLT</b> to instantly refill <b>100,000 Energy</b> units?</p>
        <div class="modal-buttons">
            <button class="modal-btn btn-cancel" onclick="closeBuyModal()">Cancel</button>
            <button class="modal-btn btn-confirm" id="confirmPaymentBtn" onclick="executeEnergyPurchase()">Confirm</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="swapModal">
    <div class="modal-box">
        <h3>Points Swap Matrix</h3>
        <p id="swapModalText">Convert game credits into cryptographically secured ledger weight values.</p>
        <div class="modal-buttons">
            <button class="modal-btn btn-cancel" onclick="closeSwapModal()">Cancel</button>
            <button class="modal-btn btn-confirm" id="confirmSwapBtn" onclick="executePointsSwap()">Confirm Swap</button>
        </div>
    </div>
</div>

<script>
    const API = "https://pepevolt-game-suite.onrender.com/";
    
    const PVLT_TOKEN_ADDRESS = "0xf4c400280f0d6aF9340fCD491F0cb5A7b51f70F1";
    const STAKING_ROUTER_ADDRESS = "0x15646258917F63D2b0b801ef3be132a35c28f6A7";
    const GAME_TREASURY_ADDRESS = "0x1dC8375d5D8C3fbCBaD85417ce66E9740D6b05e7";
    const TOKEN_DECIMALS = 18;

    let web3Modal = null;
    let web3Provider = null;
    let wallet = "";
    let points = 0;
    let energy = 50;
    let pvltg = 0;

    window.addEventListener('DOMContentLoaded', () => {
        try {
            const providerOptions = {
                walletconnect: {
                    package: window.WalletConnectProvider ? window.WalletConnectProvider.default : null,
                    options: {
                        rpc: { 137: "https://polygon-rpc.com" },
                        chainId: 137
                    }
                }
            };
            web3Modal = new window.Web3Modal.default({
                cacheProvider: false, 
                providerOptions,
                theme: "dark"
            });
        } catch (err) {
            console.error("Framework compilation block:", err);
        }
    });

    function updateUI() {
        // Enforce strong layout safety checks to block "undefined" rendering bugs
        document.getElementById("energy").innerText = (energy !== undefined && energy !== null) ? energy : 50;
        document.getElementById("points").innerText = points || 0;
        document.getElementById("pvltg").innerText = Number(pvltg || 0).toFixed(4);
    }

    function openBuyModal() { if (!wallet) { alert("Connect wallet first"); return; } document.getElementById("buyModal").classList.add("active"); }
    function closeBuyModal() { document.getElementById("buyModal").classList.remove("active"); }
    
    function openSwapModal() {
        if (!wallet) { alert("Connect wallet first!"); return; }
        if (points <= 0) { alert("Insufficient points weight balance to execute route calculation."); return; }
        const expected = (points / 10000).toFixed(4);
        document.getElementById("swapModalText").innerHTML = `Swap <b>${points} Points</b> for <b>${expected} PVLTG</b>?`;
        document.getElementById("swapModal").classList.add("active");
    }
    function closeSwapModal() { document.getElementById("swapModal").classList.remove("active"); }

    async function fetchOnChainBalances() {
        if (!web3Provider || !wallet) return;
        try {
            const signer = web3Provider.getSigner();
            
            const tokenABI = [
                "function balanceOf(address owner) external view returns (uint256)",
                "function allowance(address owner, address spender) external view returns (uint256)"
            ];
            const tokenContract = new ethers.Contract(PVLT_TOKEN_ADDRESS, tokenABI, signer);
            
            const stakingABI = [
                "function getUserInfo(address user) external view returns (uint256 stakedAmount, uint256 pendingRewards)",
                "function userInfo(address user) external view returns (uint256 amount, uint256 rewardDebt)"
            ];
            const stakingContract = new ethers.Contract(STAKING_ROUTER_ADDRESS, stakingABI, signer);

            const userBalRaw = await tokenContract.balanceOf(wallet);
            const allowanceRaw = await tokenContract.allowance(wallet, GAME_TREASURY_ADDRESS);
            const treasuryBalRaw = await tokenContract.balanceOf(GAME_TREASURY_ADDRESS);
            
            // Clean BigNumber conversion formatting to stop 1e+28 display formatting bugs
            const clearUserBal = ethers.utils.formatUnits(userBalRaw, TOKEN_DECIMALS);
            document.getElementById("userPvltBalance").innerText = parseFloat(clearUserBal).toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4});
            
            document.getElementById("contractAllowance").innerText = Number(ethers.utils.formatUnits(allowanceRaw, TOKEN_DECIMALS)).toFixed(4);
            document.getElementById("treasuryPvltPool").innerText = Number(ethers.utils.formatUnits(treasuryBalRaw, TOKEN_DECIMALS)).toFixed(4);

            try {
                const info = await stakingContract.getUserInfo(wallet);
                document.getElementById("userStakedWeight").innerText = Number(ethers.utils.formatUnits(info[0], TOKEN_DECIMALS)).toFixed(2) + " PVLT";
                document.getElementById("pendingStakingYield").innerText = Number(ethers.utils.formatUnits(info[1], TOKEN_DECIMALS)).toFixed(4);
            } catch (stakeErr) {
                try {
                    const fallbackInfo = await stakingContract.userInfo(wallet);
                    document.getElementById("userStakedWeight").innerText = Number(ethers.utils.formatUnits(fallbackInfo.amount, TOKEN_DECIMALS)).toFixed(2) + " PVLT";
                } catch(e) { console.log("Staking interface catch complete."); }
            }
        } catch (e) {
            console.error("Global balance router pipeline error:", e);
        }
    }

    async function connectWallet() {
        try {
            let instance;
            if (window.ethereum && (window.ethereum.isUXUY || window.ethereum.isMetaMask || navigator.userAgent.includes("Web3"))) {
                await window.ethereum.request({ method: "eth_requestAccounts" });
                instance = window.ethereum;
            } else {
                if (!web3Modal) { alert("Core assets processing. Standby."); return; }
                instance = await web3Modal.connect();
            }

            web3Provider = new ethers.providers.Web3Provider(instance);
            wallet = await web3Provider.getSigner().getAddress();

            document.getElementById("walletInput").value = wallet.slice(0, 6) + "..." + wallet.slice(-4);
            document.getElementById("walletBtn").style.display = "none";
            document.getElementById("walletStatus").style.display = "block";

            let res = await fetch(API + "user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet })
            });
            const data = await res.json();
            
            // Fixed Fallback values logic initialization step
            points = data.points !== undefined ? data.points : 0;
            energy = data.energy !== undefined ? data.energy : 50;
            pvltg = data.pvltg !== undefined ? data.pvltg : 0;

            updateUI();
            await fetchOnChainBalances();

            if (instance.on) {
                instance.on("accountsChanged", () => location.reload());
                instance.on("chainChanged", () => location.reload());
            }
        } catch (err) {
            console.error(err);
            alert("Wallet pipeline connection rejected.");
        }
    }

    async function tap() {
        if (!wallet) { alert("Connect wallet first"); return; }
        try {
            const res = await fetch(API + "tap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet })
            });
            const data = await res.json();
            if (data.error) { alert(data.error); return; }
            points = data.points;
            energy = data.energy !== undefined ? data.energy : energy - 1;
            updateUI();
        } catch (err) { console.error(err); }
    }

    document.getElementById("tapZone").addEventListener("pointerdown", (e) => { e.preventDefault(); tap(); });

    async function executeStakeTokens() {
        if (!wallet) return alert("Connect wallet first");
        const val = document.getElementById("stakeAmountInput").value;
        if(!val || val <= 0) return alert("Specify valid staking amount weight allocation");

        try {
            const signer = web3Provider.getSigner();
            const amountParsed = ethers.utils.parseUnits(val.toString(), TOKEN_DECIMALS);
            
            const tokenContract = new ethers.Contract(PVLT_TOKEN_ADDRESS, ["function approve(address s, uint256 a) external returns(bool)"], signer);
            const txApp = await tokenContract.approve(STAKING_ROUTER_ADDRESS, amountParsed);
            await txApp.wait();

            const stakeContract = new ethers.Contract(STAKING_ROUTER_ADDRESS, ["function stake(uint256 amount) external"], signer);
            const txStake = await stakeContract.stake(amountParsed);
            await txStake.wait();

            alert("Staking Allocation Settled On-Chain!");
            await fetchOnChainBalances();
        } catch(err) { console.error(err); alert("Staking process terminated."); }
    }

    async function executeUnstakeTokens() {
        if (!wallet) return alert("Connect wallet first");
        const val = document.getElementById("stakeAmountInput").value;
        if(!val || val <= 0) return alert("Specify valid unstaking parameters.");

        try {
            const signer = web3Provider.getSigner();
            const amountParsed = ethers.utils.parseUnits(val.toString(), TOKEN_DECIMALS);
            const stakeContract = new ethers.Contract(STAKING_ROUTER_ADDRESS, ["function unstake(uint256 amount) external"], signer);
            const tx = await stakeContract.unstake(amountParsed);
            await tx.wait();
            alert("Tokens successfully pulled from staking lock weight!");
            await fetchOnChainBalances();
        } catch(err) { console.error(err); alert("Unstaking failure."); }
    }

    async function executeClaimYield() {
        if (!wallet) return alert("Connect wallet first");
        try {
            const signer = web3Provider.getSigner();
            const stakeContract = new ethers.Contract(STAKING_ROUTER_ADDRESS, ["function claimRewards() external"], signer);
            const tx = await stakeContract.claimRewards();
            await tx.wait();
            alert("Yield parameters claimed directly to asset wallet!");
            await fetchOnChainBalances();
        } catch(err) { console.error(err); alert("Yield extraction block error."); }
    }

    async function executeEnergyPurchase() {
        const confirmBtn = document.getElementById("confirmPaymentBtn");
        if (!web3Provider || !wallet) return alert("Please connect your wallet configuration setup.");
        try {
            confirmBtn.innerText = "Processing...";
            confirmBtn.disabled = true;

            const signer = web3Provider.getSigner();
            const treasury = new ethers.Contract(GAME_TREASURY_ADDRESS, ["function buyEnergyPack(uint256 amount) external"], signer);
            const token = new ethers.Contract(PVLT_TOKEN_ADDRESS, [
                "function approve(address spender, uint256 amount) external returns (bool)",
                "function balanceOf(address owner) external view returns (uint256)"
            ], signer);

            const amount = ethers.utils.parseUnits("100", TOKEN_DECIMALS);
            const rawBalance = await token.balanceOf(wallet);

            if (rawBalance.lt(amount)) { alert("Insufficient PVLT Balance"); return; }

            const appTx = await token.approve(GAME_TREASURY_ADDRESS, amount);
            await appTx.wait();

            const tx = await treasury.buyEnergyPack(amount);
            closeBuyModal();
            
            // Immediate Client UI patch block update execution 
            energy = 100000;
            updateUI();

            await tx.wait();
            await fetchOnChainBalances();

            try {
                const refillRes = await fetch(API + "refill", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ wallet, txHash: tx.hash })
                });
                const refillData = await refillRes.json();
                if(refillData && refillData.energy !== undefined) {
                    energy = refillData.energy;
                    updateUI();
                }
            } catch(e) { console.log("Background synchronization delay logs saved."); }

            alert("100,000 Energy Refilled!");
        } catch (err) {
            console.error(err);
            alert("Transaction processing failed or timed out.");
        } finally {
            confirmBtn.innerText = "Confirm";
            confirmBtn.disabled = false;
            closeBuyModal();
        }
    }

    async function executePointsSwap() {
        const confirmBtn = document.getElementById("confirmSwapBtn");
        try {
            confirmBtn.innerText = "Processing...";
            confirmBtn.disabled = true;

            const res = await fetch(API + "swap-points", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet })
            });
            const data = await res.json();
            if (data.error) { alert("Server Error: " + data.error); return; }
            
            points = data.points;
            pvltg = data.pvltg;
            updateUI();
            closeSwapModal();
            alert("Points converted to PVLTG successfully!");
        } catch (err) {
            console.error(err);
            alert("Network routing validation fault.");
        } finally {
            confirmBtn.innerText = "Confirm Swap";
            confirmBtn.disabled = false;
            closeSwapModal();
        }
    }

    async function claimPVLT() {
        if (!wallet) { alert("Connect wallet first!"); return; }
        if (pvltg < 100) { alert("Need minimum 100 PVLTG to withdraw real tokens."); return; }
        const btn = document.getElementById("withdrawBtn");
        try {
            btn.innerText = "WITHDRAWING...";
            btn.disabled = true;

            const res = await fetch(API + "claim-pvltg", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet })
            });
            const data = await res.json();
            if (data.error) { alert("Withdrawal Denied: " + data.error); return; }
            
            pvltg = data.pvltg;
            updateUI();
            await fetchOnChainBalances();
            alert("Withdrawal Complete! PVLT sent directly to your wallet address.");
        } catch (err) {
            console.error(err);
            alert("Failed to reach withdrawal server.");
        } finally {
            btn.innerText = "WITHDRAW PVLT TO WALLET";
            btn.disabled = false;
        }
    }

    setInterval(() => { if (wallet && energy < 50) { energy += 1; updateUI(); } }, 30000);
    updateUI();
</script>
</body>
</html>
