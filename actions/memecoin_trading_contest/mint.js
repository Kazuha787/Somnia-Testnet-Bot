// actions/memecoin_trading_contest/mint.js

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const colors = require('colors');

const chain = require('../../utils/chain.js');
// We only use the SUSDT token contract address from ABI.js.
const { SUSDT_CONTRACT_ADDRESS, TX_EXPLORER } = require('./ABI.js');

// Load wallets from file
let wallets = [];
try {
  const walletsPath = path.join(__dirname, '..', '..', 'utils', 'wallets.json');
  wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
} catch (error) {
  console.error('Error reading wallets.json:'.red, error);
  process.exit(1);
}

// Process wallets in the order they are stored

// Path for track.json file (will be created/updated in the same directory)
const trackFilePath = path.join(__dirname, 'track.json');

// Load existing tracking data if available, otherwise initialize as empty array
let trackData = [];
if (fs.existsSync(trackFilePath)) {
  try {
    trackData = JSON.parse(fs.readFileSync(trackFilePath, 'utf8'));
  } catch (error) {
    console.error('Error reading track.json:'.red, error);
    process.exit(1);
  }
}

// Check if all wallets have already minted tokens
const allMinted = wallets.length > 0 && wallets.every(walletData =>
  trackData.some(entry =>
    entry.address.toLowerCase() === walletData.address.toLowerCase() && entry.has_minted
  )
);
if (allMinted) {
  console.log('All wallets have already minted tokens. Tokens can only be minted once.'.green);
  process.exit(0);
}

// Hardcoded mint ABI for a parameterless function (mint())
// Function selector: 0x1249c58b
const mintABI = [
  {
    "inputs": [],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const provider = new ethers.providers.JsonRpcProvider(chain.RPC_URL, chain.CHAIN_ID);

function getMintContract(tokenAddress, signer) {
  return new ethers.Contract(tokenAddress, mintABI, signer);
}

function getRandomGasLimit() {
  const minGas = 80000;
  const maxGas = 150000;
  return Math.floor(Math.random() * (maxGas - minGas + 1)) + minGas;
}

// Helper: update the tracking file with a wallet's mint status
function updateTrack(walletAddress, hasMinted) {
  const index = trackData.findIndex(entry => entry.address.toLowerCase() === walletAddress.toLowerCase());
  if (index >= 0) {
    trackData[index].has_minted = hasMinted;
  } else {
    trackData.push({ address: walletAddress, has_minted: hasMinted });
  }
  fs.writeFileSync(trackFilePath, JSON.stringify(trackData, null, 2));
}

async function main() {
  for (const walletData of wallets) {
    // Skip wallet if already minted successfully according to track.json
    const existingEntry = trackData.find(entry => entry.address.toLowerCase() === walletData.address.toLowerCase());
    if (existingEntry && existingEntry.has_minted) {
      console.log(`\n⚡ Wallet [${walletData.id}] (${walletData.address}) has already minted tokens. Skipping...`.yellow);
      continue;
    }
    try {
      const signer = new ethers.Wallet(walletData.privateKey, provider);
      console.log(`\n🚀 Minting Tokens for Wallet - [${walletData.id}] (${walletData.address})`);

      const block = await provider.getBlock('latest');
      if (!block || !block.baseFeePerGas) {
        console.error('Could not retrieve baseFeePerGas from the latest block.');
        updateTrack(walletData.address, false);
        continue;
      }

      const baseFeePlus10 = block.baseFeePerGas.mul(110).div(100);
      const maxFeePerGas = baseFeePlus10;
      const maxPriorityFeePerGas = baseFeePlus10;

      // In our case, we only mint SUSDT tokens using mint() with no parameters.
      const token = { name: 'SUSDT', address: SUSDT_CONTRACT_ADDRESS };

      const contract = getMintContract(token.address, signer);
      const gasLimit = getRandomGasLimit();
      console.log(`⚙️  Mint Tx for [${token.name}] using random gasLimit [${gasLimit}] ...`);
      
      // Call mint() with no parameters
      const tx = await contract.mint({
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas
      });
      console.log(`🔗 Tx Sent! - [${tx.hash}]`);
      const receipt = await tx.wait();
      console.log(`✅ Mint Tx Confirmed in Block - [${receipt.blockNumber}]`);
      
      // Update tracking data as successful
      updateTrack(walletData.address, true);
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (err) {
      console.error(`Error minting tokens for wallet ID ${walletData.id}:`, err);
      updateTrack(walletData.address, false);
    }
  }
  console.log('\nAll done! Exiting mint.js'.green);
}

main();
