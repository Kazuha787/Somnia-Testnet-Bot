const QUOTER_CONTRACT = "0x27a1e87aed9949808a7c6db733ad1cd96e365d9e";
const PONG_CONTRACT = "0x7968ac15a72629E05F41B8271e4e7292E0cC9f90"; // Function: mint(address, uint256)
const PING_CONTRACT = "0xBeCd9B5F373877881D91cBdBaF013D97eB532154"; // Function: mint(address, uint256)
const ROUTER_CONTRACT = "0x6AAC14f090A35EeA150705f72D90E4CDC4a49b2C";

const ABI = [
  // exactInputSingle for swapping tokens with expected output amount (minOut)
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "tokenIn", "type": "address" },
          { "internalType": "address", "name": "tokenOut", "type": "address" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" },
          { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "internalType": "struct IExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  // quoteExactInputSingle (for reference)
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "tokenIn", "type": "address" },
          { "internalType": "address", "name": "tokenOut", "type": "address" },
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "quoteExactInputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
      { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" },
      { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" },
      { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // exactOutputSingle
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "tokenIn", "type": "address" },
          { "internalType": "address", "name": "tokenOut", "type": "address" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
          { "internalType": "uint256", "name": "amountInMaximum", "type": "uint256" },
          { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "internalType": "struct IV3SwapRouter.ExactOutputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactOutputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  // swapTokensForExactTokens
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
      { "internalType": "uint256", "name": "amountInMax", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" }
    ],
    "name": "swapTokensForExactTokens",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  // swapExactTokensForTokens
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  // exactInput
  {
    "inputs": [
      {
        "components": [
          { "internalType": "bytes", "name": "path", "type": "bytes" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" }
        ],
        "internalType": "struct IV3SwapRouter.ExactInputParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInput",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  // exactOutput
  {
    "inputs": [
      {
        "components": [
          { "internalType": "bytes", "name": "path", "type": "bytes" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
          { "internalType": "uint256", "name": "amountInMaximum", "type": "uint256" }
        ],
        "internalType": "struct IV3SwapRouter.ExactOutputParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactOutput",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  // quoteExactInput
  {
    "inputs": [
      { "internalType": "bytes", "name": "path", "type": "bytes" },
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
    ],
    "name": "quoteExactInput",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
      { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" },
      { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" },
      { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // quoteExactOutput
  {
    "inputs": [
      { "internalType": "bytes", "name": "path", "type": "bytes" },
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "name": "quoteExactOutput",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" },
      { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" },
      { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // quoteExactOutputSingle
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "tokenIn", "type": "address" },
          { "internalType": "address", "name": "tokenOut", "type": "address" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "internalType": "struct IQuoterV2.QuoteExactOutputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "quoteExactOutputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" },
      { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" },
      { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // mint(address, uint256) for PONG_CONTRACT / PING_CONTRACT
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

module.exports = {
  QUOTER_CONTRACT,
  PONG_CONTRACT,
  PING_CONTRACT,
  ROUTER_CONTRACT,
  ABI
};
