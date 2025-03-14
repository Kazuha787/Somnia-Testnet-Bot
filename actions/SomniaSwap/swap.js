const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
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

async function main() {
  let keepSwapping = true;
  let currentWallet = null;
  while (keepSwapping) {
    if (!currentWallet) {
      const { walletId } = await inquirer.prompt([
        { type: 'input', name: 'walletId', message: 'Please insert the ID for Wallet to perform Swap:' }
      ]);
      currentWallet = wallets.find(w => String(w.id) === walletId);
      if (!currentWallet) {
        console.error(`Wallet with ID ${walletId} not found in wallets.json`.red);
        process.exit(1);
      }
    }
    const signer = new ethers.Wallet(currentWallet.privateKey, provider);
    const walletAddress = currentWallet.address;
    const { sourceIndex } = await inquirer.prompt([
      { type: 'list', name: 'sourceIndex', message: 'Select the asset you want to swap (source):', choices: tokens.map((t, idx) => ({ name: t.name, value: idx })) }
    ]);
    const tokenA = tokens[sourceIndex];
    const { targetIndex } = await inquirer.prompt([
      { type: 'list', name: 'targetIndex', message: 'Select the asset you want to receive (target):', choices: tokens.filter((_, idx) => idx !== sourceIndex).map(t => ({ name: t.name, value: tokens.indexOf(t) })) }
    ]);
    const tokenB = tokens[targetIndex];
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
      console.log(`💡 Expected Amount to Receive: [${expectedOut} ${tokenB.name}]`.green);
    } catch (error) {
      console.error('Error simulating swap:'.red, error);
      continue;
    }
    console.log(`🚀 Swapping [${tokenA.name} -> ${tokenB.name}]...`.yellow);
    try {
      const tx = await routerContract.exactInputSingle(swapParams);
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
    if (!anotherSwap) { keepSwapping = false; break; }
    const { useSameWallet } = await inquirer.prompt([
      { type: 'input', name: 'useSameWallet', message: 'Would you like to use the same wallet? (Y/n)', default: 'Y' }
    ]);
    if (useSameWallet.toLowerCase() === 'n') { currentWallet = null; }
  }
  console.log('\nAll done! Exiting swap script.'.blue);
}

main();
