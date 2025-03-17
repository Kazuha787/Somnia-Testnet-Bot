// actions/memecoin_trading_contest/random.js

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const colors = require('colors');

const chain = require('../../utils/chain.js');
const { ABI, SUSDT_CONTRACT_ADDRESS, SOMINI_CONTRACT, SOMSOM_CONTRACT, SOMI_CONTRACT, ROUTER_CONTRACT_ADDRESS } = require('./ABI.js');

let wallets = [];
try {
  const walletsPath = path.join(__dirname, '..', '..', 'utils', 'wallets.json');
  wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
} catch (error) {
  console.error('Error reading wallets.json:'.red, error);
  process.exit(1);
}

// Shuffle wallets randomly
wallets.sort(() => Math.random() - 0.5);

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

const provider = new ethers.providers.JsonRpcProvider(chain.RPC_URL, chain.CHAIN_ID);

// Define tokens for the contest
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
  const allowance = await tokenContract.allowance(owner, ROUTER_CONTRACT_ADDRESS);
  if (allowance.gte(amountNeeded)) return;
  console.log(`🔥 Approving ${tokenName} for Router usage...`.yellow);
  const maxUint = ethers.constants.MaxUint256;
  const tx = await tokenContract.approve(ROUTER_CONTRACT_ADDRESS, maxUint);
  await tx.wait();
  console.log(`✅ ${tokenName} approved for Router usage.`.green);
  await new Promise(res => setTimeout(res, 2000));
}

async function processWallet(wallet) {
  const signer = new ethers.Wallet(wallet.privateKey, provider);
  const walletAddress = wallet.address;
  console.log(`\n🚀 Processing Wallet [${wallet.id}] - ${walletAddress}\n`.green);

  // Check native balance (ETH) to ensure the wallet can pay gas
  const nativeBalanceBN = await provider.getBalance(walletAddress);
  if (nativeBalanceBN.isZero()) {
    console.log(`⚠️  Wallet [${wallet.id}] has 0 native balance to pay for gas.`.red);
    return;
  }

  const susdtToken = tokens.find(t => t.name === 'SUSDT');
  const numSwaps = Math.floor(Math.random() * (18 - 10 + 1)) + 10;
  console.log(`💼 Wallet [${wallet.id}] will perform ${numSwaps} swaps.`.blue);

  for (let i = 1; i <= numSwaps; i++) {
    console.log(`\n🔄 Swap ${i} for Wallet [${wallet.id}]`.yellow);

    // Retrieve current balances for decision-making
    const currentSusdtBalance = await getTokenBalance(susdtToken.address, walletAddress);
    const nonSusdtTokens = tokens.filter(t => t.name !== 'SUSDT');
    const nonSusdtBalances = await Promise.all(nonSusdtTokens.map(async (t) => ({
      token: t,
      balance: await getTokenBalance(t.address, walletAddress)
    })));

    // Determine if wallet holds only SUSDT (all non-SUSDT balances are 0)
    const onlySusdt = nonSusdtBalances.every(item => item.balance === 0);
    let action;
    if (onlySusdt) {
      action = "buy_new"; // Swap from SUSDT to a non-SUSDT token
    } else {
      const r = Math.random();
      if (r < 0.33) {
        action = "sell_existing"; // Swap from a non-SUSDT token to SUSDT
      } else if (r < 0.66) {
        action = "buy_more_existing"; // Swap from SUSDT to a non-SUSDT token already held
      } else {
        action = "buy_new"; // Swap from SUSDT to a non-SUSDT token not held, if available
      }
    }

    let tokenA, tokenB;
    if (action === "sell_existing") {
      const candidates = nonSusdtBalances.filter(item => item.balance > 0);
      if (candidates.length === 0) {
        console.log(`⚠️  No non-SUSDT tokens available to sell. Skipping swap.`.red);
        continue;
      }
      tokenA = candidates[Math.floor(Math.random() * candidates.length)].token;
      tokenB = susdtToken;
    } else if (action === "buy_more_existing") {
      const candidates = nonSusdtBalances.filter(item => item.balance > 0);
      if (candidates.length === 0) {
        action = "buy_new";
      } else {
        tokenA = susdtToken;
        tokenB = candidates[Math.floor(Math.random() * candidates.length)].token;
      }
    }
    if (action === "buy_new") {
      const zeroCandidates = nonSusdtBalances.filter(item => item.balance === 0);
      tokenA = susdtToken;
      if (zeroCandidates.length > 0) {
        tokenB = zeroCandidates[Math.floor(Math.random() * zeroCandidates.length)].token;
      } else {
        tokenB = nonSusdtTokens[Math.floor(Math.random() * nonSusdtTokens.length)];
      }
    }

    // Get pre-swap balances
    const beforeBalanceA = await getTokenBalance(tokenA.address, walletAddress);
    const beforeBalanceB = await getTokenBalance(tokenB.address, walletAddress);

    // Print pre-swap summary
    console.log(`⚡ Balances: ${tokenA.name}: ${beforeBalanceA.toFixed(3)}, ${tokenB.name}: ${beforeBalanceB.toFixed(3)}`);

    if (beforeBalanceA === 0) {
      console.log(`⚠️  Wallet [${wallet.id}] has 0 ${tokenA.name} balance, cannot perform swap.`.red);
      continue;
    }

    // Determine swap amount: random percentage between 40% and 100% of source balance
    const randomPercentage = Math.random() * (1.0 - 0.4) + 0.4;
    const amountToSwap = Number((beforeBalanceA * randomPercentage).toFixed(3));
    if (amountToSwap === 0) {
      console.log(`⚠️  Wallet [${wallet.id}] cannot swap 0 tokens.`.red);
      continue;
    }
    console.log(`✨ Swap Amount: ${amountToSwap} ${tokenA.name}`);

    // Calculate swap amount in BigNumber
    const decimalsA = await getTokenDecimals(tokenA.address);
    const amountInBN = ethers.utils.parseUnits(amountToSwap.toString(), decimalsA);

    // Approve token if needed
    await checkAndApproveToken(tokenA.address, tokenA.name, signer, amountInBN);

    const routerContract = new ethers.Contract(ROUTER_CONTRACT_ADDRESS, [swapAbi], signer);
    const swapParams = {
      tokenIn: tokenA.address,
      tokenOut: tokenB.address,
      fee: 500,
      recipient: walletAddress,
      amountIn: amountInBN,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };

    let expectedOut = '0';
    try {
      const outBN = await routerContract.callStatic.exactInputSingle(swapParams);
      const decimalsB = await getTokenDecimals(tokenB.address);
      expectedOut = ethers.utils.formatUnits(outBN, decimalsB);
      console.log(`💡 Expected: [${expectedOut} ${tokenB.name}]`);
    } catch (error) {
      if (error.code === 'CALL_EXCEPTION') {
        console.error(`❌ Swap simulation failed due to CALL_EXCEPTION`.red);
      } else {
        console.error(`❌ Error simulating swap: ${error.message}`.red);
      }
      continue;
    }

    console.log(`🚀 Executing Swap [${tokenA.name} -> ${tokenB.name}]...`);
    let tx, receipt;
    try {
      tx = await routerContract.exactInputSingle(swapParams);
      console.log(`🔗 Swap Tx Sent! ${chain.TX_EXPLORER}${tx.hash}`);
      receipt = await tx.wait();
      console.log(`✅ Tx Confirmed in Block - ${receipt.blockNumber}`);
    } catch (error) {
      if (error.code === 'CALL_EXCEPTION') {
        console.error(`❌ Swap failed due to CALL_EXCEPTION`.red);
      } else {
        console.error(`❌ Error executing swap: ${error.message}`.red);
      }
      continue;
    }

    // Get post-swap balances
    const afterBalanceA = await getTokenBalance(tokenA.address, walletAddress);
    const afterBalanceB = await getTokenBalance(tokenB.address, walletAddress);
    console.log(`⚡ Post-Swap Balances: ${tokenA.name}: ${afterBalanceA.toFixed(3)}, ${tokenB.name}: ${afterBalanceB.toFixed(3)}`);
    
    // Wait for 3 seconds between swaps
    await new Promise(res => setTimeout(res, 3000));
  }
}

async function main() {
  for (const wallet of wallets) {
    await processWallet(wallet);
  }
  console.log('\nAll done! Exiting random.js'.green);
}

main();
