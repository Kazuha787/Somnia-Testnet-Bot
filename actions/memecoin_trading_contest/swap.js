// actions/memecoin_trading_contest/swap.js

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { ethers } = require('ethers');
const colors = require('colors');
const clear = require('console-clear'); // Module to clear the console

const chain = require('../../utils/chain.js');
const { ABI, SUSDT_CONTRACT_ADDRESS, SOMINI_CONTRACT, SOMSOM_CONTRACT, SOMI_CONTRACT, ROUTER_CONTRACT_ADDRESS } = require('./ABI.js');

// Use the imported router contract address
const ROUTER_CONTRACT = ROUTER_CONTRACT_ADDRESS;

let wallets = [];
try {
  const walletsPath = path.join(__dirname, '..', '..', 'utils', 'wallets.json');
  wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
} catch (error) {
  console.error('Error reading wallets.json:'.red, error);
  process.exit(1);
}

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

// Find the exactInputSingle function in the ABI
const swapAbi = ABI.find(item => item.name === 'exactInputSingle' && item.type === 'function');
if (!swapAbi) {
  console.error('"exactInputSingle" not found in ABI.'.red);
  process.exit(1);
}

// Create the provider with the network configuration
const provider = new ethers.providers.JsonRpcProvider(chain.RPC_URL, chain.CHAIN_ID);

// Tokens available in this contest
const tokens = [
  { name: 'SUSDT', address: SUSDT_CONTRACT_ADDRESS },
  { name: 'SOMINI', address: SOMINI_CONTRACT },
  { name: 'SOMSOM', address: SOMSOM_CONTRACT },
  { name: 'SOMI', address: SOMI_CONTRACT }
];

async function getTokenBalance(tokenAddress, walletAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const [rawBalance, decimals] = await Promise.all([
    tokenContract.balanceOf(walletAddress),
    tokenContract.decimals()
  ]);
  return Number(ethers.utils.formatUnits(rawBalance, decimals));
}

async function getTokenDecimals(tokenAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return tokenContract.decimals();
}

async function checkAndApproveToken(tokenAddress, tokenName, signer, amountNeeded) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const allowance = await tokenContract.allowance(owner, ROUTER_CONTRACT);
  // If already approved sufficiently, skip approval
  if (allowance.gte(amountNeeded)) return;
  console.log(`🔥 Approving ${tokenName} for Router usage...`.yellow);
  const maxUint = ethers.constants.MaxUint256;
  const tx = await tokenContract.approve(ROUTER_CONTRACT, maxUint);
  await tx.wait();
  console.log(`✅ ${tokenName} approved for Router usage.`.green);
  // Brief wait to ensure the approval is registered on-chain
  await new Promise(res => setTimeout(res, 2000));
}

async function main() {
  let keepSwapping = true;
  let currentWallet = null;
  while (keepSwapping) {
    if (!currentWallet) {
      const { walletId } = await inquirer.prompt([
        { type: 'input', name: 'walletId', message: 'Please insert the ID for the wallet to perform the swap:' }
      ]);
      currentWallet = wallets.find(w => String(w.id) === walletId);
      if (!currentWallet) {
        console.error(`Wallet with ID ${walletId} not found in wallets.json`.red);
        process.exit(1);
      }
    }
    const signer = new ethers.Wallet(currentWallet.privateKey, provider);
    const walletAddress = currentWallet.address;

    // Prompt for source token selection
    const { sourceIndex } = await inquirer.prompt([
      { 
        type: 'list', 
        name: 'sourceIndex', 
        message: 'Select the asset you want to swap (source):', 
        choices: tokens.map((t, idx) => ({ name: t.name, value: idx })) 
      }
    ]);
    const tokenA = tokens[sourceIndex];
    let tokenB;

    // Logic for tokenB selection:
    // - If tokenA is "SUSDT", allow the user to choose one from the remaining three tokens.
    // - If tokenA is not "SUSDT", tokenB is automatically set to "SUSDT" (no prompt).
    if (tokenA.name === 'SUSDT') {
      const targetChoices = tokens.filter(t => t.name !== 'SUSDT')
                                  .map(t => ({ name: t.name, value: t.name }));
      const { targetName } = await inquirer.prompt([
        { 
          type: 'list', 
          name: 'targetName', 
          message: 'Select the asset you want to receive (target):', 
          choices: targetChoices 
        }
      ]);
      tokenB = tokens.find(t => t.name === targetName);
    } else {
      tokenB = tokens.find(t => t.name === 'SUSDT');
    }

    const balanceA = await getTokenBalance(tokenA.address, walletAddress);
    const balanceB = await getTokenBalance(tokenB.address, walletAddress);
    console.log(`⚡ Current Balances:`.blue);
    console.log(`${tokenA.name} - ${balanceA}`.cyan);
    console.log(`${tokenB.name} - ${balanceB}`.cyan);

    const { amountToSwap } = await inquirer.prompt([
      { type: 'input', name: 'amountToSwap', message: `How much ${tokenA.name} would you like to swap?` }
    ]);
    const decimalsA = await getTokenDecimals(tokenA.address);
    const amountInBN = ethers.utils.parseUnits(amountToSwap, decimalsA);

    // Check token approval if needed
    await checkAndApproveToken(tokenA.address, tokenA.name, signer, amountInBN);

    // Gas parameters:
    // - Random gasLimit between 120000 and 200000
    // - maxFeePerGas and maxPriorityFeePerGas based on latest block baseFee + 10%
    const latestBlock = await provider.getBlock("latest");
    const baseFee = latestBlock.baseFeePerGas;
    const extraFee = baseFee.mul(10).div(100); // 10% extra
    const maxFeePerGas = baseFee.add(extraFee);
    const maxPriorityFeePerGas = baseFee.add(extraFee);
    const gasLimit = Math.floor(Math.random() * (200000 - 120000 + 1)) + 120000;

    const txOptions = {
      gasLimit: gasLimit,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas
    };

    // Prepare the router contract using the exactInputSingle function
    const routerContract = new ethers.Contract(ROUTER_CONTRACT, [swapAbi], signer);
    const swapParams = {
      tokenIn: tokenA.address,
      tokenOut: tokenB.address,
      fee: 500,              // Fixed fee
      recipient: walletAddress,
      amountIn: amountInBN,
      amountOutMinimum: 0,   // No minimum output
      sqrtPriceLimitX96: 0   // No price limit
    };

    console.log(`🚀 Swapping [${tokenA.name} -> ${tokenB.name}]...`.yellow);
    try {
      const tx = await routerContract.exactInputSingle(swapParams, txOptions);
      console.log(`🔗 Swap Tx Sent! ${chain.TX_EXPLORER}${tx.hash}`.magenta);
      const receipt = await tx.wait();
      console.log(`✅ Tx Confirmed in Block - ${receipt.blockNumber}`.green);
    } catch (error) {
      console.error('Error executing swap:'.red, error);
      continue;
    }

    const newBalanceA = await getTokenBalance(tokenA.address, walletAddress);
    const newBalanceB = await getTokenBalance(tokenB.address, walletAddress);
    console.log(`⚡ Current Balances After Swap:`.blue);
    console.log(`${tokenA.name} - ${newBalanceA}`.cyan);
    console.log(`${tokenB.name} - ${newBalanceB}\n`.cyan);

    const { anotherSwap } = await inquirer.prompt([
      { type: 'confirm', name: 'anotherSwap', message: 'Would you like to perform another swap?', default: true }
    ]);
    if (!anotherSwap) { 
      keepSwapping = false; 
      break; 
    }
    const { useSameWallet } = await inquirer.prompt([
      { type: 'input', name: 'useSameWallet', message: 'Would you like to use the same wallet? (Y/n)', default: 'Y' }
    ]);
    if (useSameWallet.toLowerCase() === 'n') { 
      currentWallet = null; 
    }
    // Clear the console after the two prompts
    clear();
  }
  console.log('\nAll done! Exiting swap script.'.blue);
}

main();
