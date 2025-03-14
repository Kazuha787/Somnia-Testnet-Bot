# Somnia-Testnet Bot Support of Multiple Wallets

An automated bot for managing multiple Somnia with proxy support.

## 📢 Join Our Community

# Telegram Channel: .[Channel](https://t.me/Offical_Im_kazuha)
# GitHub Repository: [Somnia](https://github.com/Kazuha787/Somnia-Testnet-Bot.git)

Somnia Testnet is a blockchain automation tool designed to interact with various cryptocurrency services for swapping and staking tokens. It provides a dashboard interface to monitor operations and logs, and it cycles through tasks like wrapping/unwrapping and staking/unstaking tokens.

## Features

✅Official Faucet Automation – Automatically claim test tokens from the Somnia Testnet faucet.

✅SomniaSwap Integration – Perform swaps and execute randomized transactions using SomniaSwap smart contracts.

✅Wallet Management – Generate, store, and aggregate wallet details for multiple accounts.

✅Balance & Transaction Tracker – Monitor wallet balances and transaction history in real-time.

✅Proxy Support – Utilize socks5 proxies generated via 2Captcha for added security.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Kazuha787/Somnia-Testnet-Bot.git
   cd Somnia-Testnet-Bot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Edit the Configuration - (run node utils/wallet_aggregator.js - allowing you to add your existing addresses)

   ```bash
   npm run add 
   ```

## Usage

- **Start the bot**:

  ```bash
  npm start
  ```

- **Dashboard**: The dashboard will display real-time information about the bot's operations, including balance, network status, and transaction logs.

## Configuration

- **Network Settings**: Configure the RPC URL and explorer URL in `config/config.json`.
- **API Endpoints**: Set the API endpoints for liquid staking and other services.
- **Contract Addresses**: Update the contract addresses for the tokens and services you wish to interact with.
- **Cycle Parameters**: Adjust the cycle count, cooldown time, and delay settings to suit your needs.

## Dependencies

- **axios**: For making HTTP requests to external APIs.
- **lots of package**: For creating the  Fast interaction and Future Adding.
- **erhers**: For additional Creating Wallets components.
- **ethers**: For interacting with the Ethereum blockchain.

## License

This project is licensed under the ISC License.
