const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const colors = require('colors');

const chain = require('../../utils/chain.js');
const { ABI, PONG_CONTRACT, PING_CONTRACT, ROUTER_CONTRACT } = require('./ABI.js');

let wallets = [];
try {
  const walletsPath = path.join(__dirname, '..', '..', 'utils', 'wallets.json');
  wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
} catch (error) {
  console.error('Error reading wallets.json:'.red, error);
  process.exit(1);
}

wallets.sort(() => Math.random() - 0.5);

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

const swapAbi = ABI.find(item => item.name === 'exactInputSingle' && item.type === 'function');
if (!swapAbi) {
  console.error('"exactInputSingle" not found in ABI.'.red);
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(chain.RPC_URL, chain.CHAIN_ID);
const tokens = [
  { name: 'PONG', address: PONG_CONTRACT },
  { name: 'PING', address: PING_CONTRACT }
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
  if (allowance.gte(amountNeeded)) return;
  console.log(`🔥 Approving - [${tokenName}] to be used by Router...`.yellow);
  const maxUint = ethers.constants.MaxUint256;
  const tx = await tokenContract.approve(ROUTER_CONTRACT, maxUint);
  await tx.wait();
  console.log(`✅ [${tokenName}] has been approved for Router usage.`.green);
  await new Promise(res => setTimeout(res, 2000));
}

async function processWallet(wallet) {
  const signer = new ethers.Wallet(wallet.privateKey, provider);
  const walletAddress = wallet.address;
  console.log(`\n🚀 Processing Wallet [${wallet.id}] - ${walletAddress}\n`.green);

  const nativeBalanceBN = await provider.getBalance(walletAddress);
  if (nativeBalanceBN.isZero()) {
    console.log(`⚠️  Wallet [${wallet.id}] doesn't own Balances in Tokens to Swap (0 STT).`.red);
    return;
  }

  const initialBalancePong = await getTokenBalance(tokens[0].address, walletAddress);
  const initialBalancePing = await getTokenBalance(tokens[1].address, walletAddress);
  if (initialBalancePong === 0 && initialBalancePing === 0) {
    console.log(`⚠️  Wallet [${wallet.id}] doesn't own Balances in Tokens to Swap.`.red);
    return;
  }

  const numSwaps = Math.floor(Math.random() * (18 - 10 + 1)) + 10;
  console.log(`💼 Wallet [${wallet.id}] will perform ${numSwaps} swaps.`.blue);

  for (let i = 1; i <= numSwaps; i++) {
    console.log(`🔄 Swap ${i} for Wallet [${wallet.id}]`.yellow);
    const swapDirection = Math.floor(Math.random() * 2);
    const tokenA = swapDirection === 0 ? tokens[0] : tokens[1];
    const tokenB = swapDirection === 0 ? tokens[1] : tokens[0];

    const currentBalanceA = await getTokenBalance(tokenA.address, walletAddress);
    const currentBalanceB = await getTokenBalance(tokenB.address, walletAddress);
    console.log(`⚡ Balances: ${tokenA.name}: ${currentBalanceA.toFixed(3)}, ${tokenB.name}: ${currentBalanceB.toFixed(3)}`.cyan);

    if (currentBalanceA === 0 && currentBalanceB === 0) {
      console.log(`⚠️  Wallet [${wallet.id}] doesn't own Balances in Tokens to Swap.`.red);
      return;
    }

    const randomPercentage = (Math.random() * (1.0 - 0.4)) + 0.4;
    const amountToSwap = Number((currentBalanceA * randomPercentage).toFixed(3));
    if (amountToSwap === 0) {
      console.log(`⚠️  Wallet [${wallet.id}] can't swap 0 tokens.`.red);
      return;
    }

    console.log(`✨ Swap Amount: ${amountToSwap} ${tokenA.name}`.magenta);
    const decimalsA = await getTokenDecimals(tokenA.address);
    const amountInBN = ethers.utils.parseUnits(amountToSwap.toString(), decimalsA);

    await checkAndApproveToken(tokenA.address, tokenA.name, signer, amountInBN);

    const routerContract = new ethers.Contract(ROUTER_CONTRACT, [swapAbi], signer);
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
      console.log(`💡 Expected: [${expectedOut} ${tokenB.name}]`.green);
    } catch (error) {
      if (error.code === 'CALL_EXCEPTION') {
        console.error(`❌ Swap Failed due to CALL_EXCEPTION`.red);
      } else {
        console.error(`❌ Error simulating swap: ${error.message}`.red);
      }
      return;
    }

    console.log(`🚀 Executing Swap [${tokenA.name} -> ${tokenB.name}]...`.yellow);
    try {
      const tx = await routerContract.exactInputSingle(swapParams);
      console.log(`🔗 Swap Tx Sent! ${chain.TX_EXPLORER}${tx.hash}`.magenta);
      const receipt = await tx.wait();
      console.log(`✅ Tx Confirmed in Block - ${receipt.blockNumber}`.green);
    } catch (error) {
      if (error.code === 'CALL_EXCEPTION') {
        console.error(`❌ Swap Failed due to CALL_EXCEPTION`.red);
      } else {
        console.error(`❌ Error executing swap: ${error.message}`.red);
      }
      return;
    }

    const postSwapA = await getTokenBalance(tokenA.address, walletAddress);
    const postSwapB = await getTokenBalance(tokenB.address, walletAddress);
    console.log(`⚡ Post-Swap Balances: ${tokenA.name}: ${postSwapA.toFixed(3)}, ${tokenB.name}: ${postSwapB.toFixed(3)}\n`.cyan);

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
