const inquirer = require('inquirer');
const figlet = require('figlet');
const { spawn } = require('child_process');
const colors = require('colors');
const clear = require('console-clear');

process.on('SIGINT', () => {
  console.log('\nExiting...'.green);
  process.exit(0);
});

async function pause() {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press ENTER to return to the main menu...',
    },
  ]);
}

function runScript(scriptPath) {
  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath], { stdio: 'inherit' });
    child.on('close', () => {
      resolve();
    });
  });
}

async function mainMenu() {
  clear();
  const title = figlet.textSync('SomniaTestnet', { horizontalLayout: 'full' });
  console.log(title.green);
  console.log('Script created by Naeaex'.green);
  console.log('Follow me on X - x.com/naeaexeth - Github - github.com/Naeaerc20'.green);
  console.log();

  const { option } = await inquirer.prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Select an option:',
      choices: [
        { name: '1. Claim Faucet', value: 'claimFaucet' },
        { name: '2. Execute Swaps', value: 'executeSwaps' },
        { name: '3. Deploy Contract', value: 'deployContract' },
        { name: '4. Use Specific App', value: 'specificApp' },
        { name: '5. Check Wallet Stuff', value: 'checkWalletStuff' },
        { name: '6. Perform Specific Action', value: 'performSpecificAction' },
        { name: '0. Exit', value: 'exit' }
      ],
    },
  ]);

  switch (option) {
    case 'claimFaucet':
      const { faucetChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'faucetChoice',
          message: 'Select Faucet:',
          choices: [
            { name: '1. Official Faucet', value: 'officialFaucet' }
          ],
        },
      ]);
      if (faucetChoice === 'officialFaucet') {
        console.log('Launching Official Faucet...'.green);
        await runScript('actions/faucets/official_faucet/claim.js');
      }
      await pause();
      break;

    case 'executeSwaps':
      const { swapOption } = await inquirer.prompt([
        {
          type: 'list',
          name: 'swapOption',
          message: 'Select a Swap Method:',
          choices: [
            { name: '1. SomniaSwap', value: 'somniaSwap' }
          ],
        },
      ]);
      if (swapOption === 'somniaSwap') {
        const { somniaAction } = await inquirer.prompt([
          {
            type: 'list',
            name: 'somniaAction',
            message: 'What would you like to do?',
            choices: [
              { name: '1. Perform Swaps', value: 'performSwaps' },
              { name: '2. Claim Tokens', value: 'claimTokens' }
            ]
          }
        ]);
        if (somniaAction === 'performSwaps') {
          const { somniaChoice } = await inquirer.prompt([
            {
              type: 'list',
              name: 'somniaChoice',
              message: 'Select Swap Method:',
              choices: [
                { name: '1. Manual Swap', value: 'manual' },
                { name: '2. Automatic Swaps', value: 'random' }
              ]
            }
          ]);
          if (somniaChoice === 'manual') {
            console.log('Launching Manual Swap...'.green);
            await runScript('actions/SomniaSwap/swap.js');
          } else if (somniaChoice === 'random') {
            console.log('Launching Automatic Swaps...'.green);
            await runScript('actions/SomniaSwap/random.js');
          }
        } else if (somniaAction === 'claimTokens') {
          console.log('Launching Claim Tokens...'.green);
          await runScript('actions/SomniaSwap/mint.js');
        }
      }
      await pause();
      break;

    case 'deployContract':
      console.log('Deploy Contract - coming soon...'.green);
      await pause();
      break;

    case 'specificApp':
      console.log('Use Specific App - coming soon...'.green);
      await pause();
      break;

    case 'checkWalletStuff':
      const { walletChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'walletChoice',
          message: 'Select an option:',
          choices: [
            { name: '1. Check Current Wallet Balances', value: 'balance' },
            { name: '2. Check Total Tx\'s Made Per Wallet', value: 'txCount' }
          ],
        },
      ]);
      if (walletChoice === 'balance') {
        console.log('Launching Balance Checker...'.green);
        await runScript('utils/balanceChecker.js');
      } else if (walletChoice === 'txCount') {
        console.log('Launching Transaction Counter...'.green);
        await runScript('utils/txCount.js');
      }
      await pause();
      break;

    case 'performSpecificAction':
      // New option for the Trading Meme Contest
      const { contestChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'contestChoice',
          message: 'Participate in Trading Meme Contest:',
          choices: [
            { name: '1. Participate in Trading Meme Contest', value: 'tradingContest' }
          ]
        }
      ]);
      if (contestChoice === 'tradingContest') {
        const { contestAction } = await inquirer.prompt([
          {
            type: 'list',
            name: 'contestAction',
            message: 'What would you like to do?',
            choices: [
              { name: '1. Perform Swaps', value: 'performSwaps' },
              { name: '2. Mint Tokens', value: 'mintTokens' }
            ]
          }
        ]);
        if (contestAction === 'performSwaps') {
          const { swapType } = await inquirer.prompt([
            {
              type: 'list',
              name: 'swapType',
              message: 'What types of swaps would you like to do?',
              choices: [
                { name: '1. Manual Swaps', value: 'manual' },
                { name: '2. Automatic Swaps', value: 'random' }
              ]
            }
          ]);
          if (swapType === 'manual') {
            console.log('Launching Manual Swap (Trading Meme Contest)...'.green);
            await runScript('actions/memecoin_trading_contest/swap.js');
          } else if (swapType === 'random') {
            console.log('Launching Automatic Swaps (Trading Meme Contest)...'.green);
            await runScript('actions/memecoin_trading_contest/random.js');
          }
        } else if (contestAction === 'mintTokens') {
          console.log('Launching Mint Tokens (Trading Meme Contest)...'.green);
          await runScript('actions/memecoin_trading_contest/mint.js');
        }
      }
      await pause();
      break;

    case 'exit':
      console.log('Exiting...'.green);
      process.exit(0);

    default:
      break;
  }

  mainMenu();
}

mainMenu();
