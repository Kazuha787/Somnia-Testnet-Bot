const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { claimFaucet, getProxyIP } = require('./scripts/apis');

function extractProxyId(proxy) {
  if (!proxy) return "None";
  const match = proxy.match(/-session-([^-]+)-sessTime/);
  return match && match[1] ? match[1] : 'Unknown';
}

async function processWallet(wallet, proxy) {
  console.log(`🚀 Initializing Faucet Claim For Wallet - [${wallet.id}]`);
  let publicIP = "None";
  if (proxy) {
    const publicIPData = await getProxyIP(proxy);
    publicIP = publicIPData && publicIPData.ip ? publicIPData.ip : 'Unknown';
  }
  const proxyId = extractProxyId(proxy);
  console.log(`🔄 Using Proxy ID - [${proxyId}] With Public IP - [${publicIP}]`);
  try {
    const apiResponse = await claimFaucet(wallet.address, proxy);
    console.log(`✅ Faucet Successfully Claimed for Wallet - [${wallet.address}]`);
    console.log(`🔗 API Response: ${JSON.stringify(apiResponse)}`);
    console.log('');
  } catch (error) {
    const code = error.code || 'Unknown';
    const response = error.data ? JSON.stringify(error.data) : JSON.stringify(error);
    console.log(`⚠️  Faucet Request Failed with code - [${code}] API Response: ${response}`);
    console.log('');
  }
}

async function processWallets() {
  const walletsPath = path.join(__dirname, '..', '..', '..', 'utils', 'wallets.json');
  const walletsData = fs.readFileSync(walletsPath, 'utf8');
  const wallets = JSON.parse(walletsData);

  const proxiesPath = path.join(__dirname, '..', '..', '..', 'utils', 'proxies.txt');
  const proxiesContent = fs.readFileSync(proxiesPath, 'utf8');
  const proxies = proxiesContent.split('\n').filter(line => line.trim() !== '');

  for (const wallet of wallets) {
    const proxyIndex = wallet.id - 1;
    const proxy = proxies[proxyIndex] ? proxies[proxyIndex].trim() : null;
    await processWallet(wallet, proxy);
  }
}

async function claimLoop() {
  const { keep } = await inquirer.prompt([
    {
      type: 'input',
      name: 'keep',
      message: 'Do you wish to keep code claiming Faucet everyday? (y/n)'
    }
  ]);

  await processWallets();

  if (keep.toLowerCase() === 'y') {
    // Calculate a random time between 24h30min (1470 minutes) and 26h (1560 minutes)
    const minMinutes = 1470;
    const maxMinutes = 1560;
    const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
    const randomMs = randomMinutes * 60 * 1000;
    const hours = Math.floor(randomMinutes / 60);
    const minutes = randomMinutes % 60;
    const randomTimeStr = `${hours}h ${minutes}m`;
    console.log(`✅ Faucet Claim Workflow completed today!`);
    console.log(`💤 Sleeping - [${randomTimeStr}] To initialize claims again\n`);
    setTimeout(() => {
      claimLoop();
    }, randomMs);
  }
}

claimLoop();
