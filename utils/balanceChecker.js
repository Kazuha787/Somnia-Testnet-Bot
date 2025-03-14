const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const chain = require(path.join(__dirname, 'chain.js'));

const walletsPath = path.join(__dirname, 'wallets.json');
let wallets;
try {
  wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
} catch (error) {
  console.error("Error reading wallets.json:", error);
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(chain.RPC_URL, chain.CHAIN_ID);

async function checkBalances() {
  for (const wallet of wallets) {
    try {
      const balance = await provider.getBalance(wallet.address);
      const formattedBalance = ethers.utils.formatEther(balance);
      console.log(`💰 Wallet - [${wallet.address}] has a balance of [${formattedBalance} ${chain.SYMBOL}]`);
    } catch (error) {
      console.error(`Error getting balance for wallet ${wallet.address}:`, error);
    }
  }
}

checkBalances();
