const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const colors = require('colors');

const chain = require('../../utils/chain.js');
const { ABI, PONG_CONTRACT, PING_CONTRACT } = require('./ABI.js');

let wallets = [];
try {
  const walletsPath = path.join(__dirname, '..', '..', 'utils', 'wallets.json');
  wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
} catch (error) {
  console.error('Error reading wallets.json:'.red, error);
  process.exit(1);
}

const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const mintAbi = ABI.find(item => item.name === 'mint' && item.type === 'function');
if (!mintAbi) {
  console.error("Function 'mint(address, uint256)' not found in ABI. Please update your ABI file.");
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(chain.RPC_URL, chain.CHAIN_ID);

function getMintContract(tokenAddress, signer) {
  return new ethers.Contract(tokenAddress, [mintAbi], signer);
}

function getRandomGasLimit() {
  const minGas = 80000;
  const maxGas = 150000;
  return Math.floor(Math.random() * (maxGas - minGas + 1)) + minGas;
}

async function main() {
  for (const walletData of wallets) {
    try {
      const signer = new ethers.Wallet(walletData.privateKey, provider);
      console.log(`\n🚀 Minting Tokens for Wallet - [${walletData.id}]`);

      const block = await provider.getBlock('latest');
      if (!block || !block.baseFeePerGas) {
        console.error('Could not retrieve baseFeePerGas from the latest block.');
        continue;
      }

      const baseFeePlus10 = block.baseFeePerGas.mul(110).div(100);
      const maxFeePerGas = baseFeePlus10;
      const maxPriorityFeePerGas = baseFeePlus10;
      const MINT_AMOUNT = ethers.BigNumber.from("1000000000000000000000");

      const tokensToMint = [
        { name: 'PONG_CONTRACT', address: PONG_CONTRACT },
        { name: 'PING_CONTRACT', address: PING_CONTRACT }
      ];

      for (const token of tokensToMint) {
        const contract = getMintContract(token.address, signer);
        const gasLimit = getRandomGasLimit();
        console.log(`⚙️  Mint Tx for - [${token.name}] using random gasLimit [${gasLimit}] ...`);
        const tx = await contract.mint(walletData.address, MINT_AMOUNT, {
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        });
        console.log(`🔗 Tx Sent! - [${chain.TX_EXPLORER}${tx.hash}]`);
        const receipt = await tx.wait();
        console.log(`✅ Mint Tx Confirmed in Block - [${receipt.blockNumber}]`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (err) {
      console.error(`Error minting tokens for wallet ID ${walletData.id}:`, err);
    }
  }
  console.log('\nAll done! Exiting mint.js'.green);
}

main();
