# Morpho Strategy Bot

Dynamic strategy bot for identifying and executing highest APY strategies on Morpho across chains.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp env.example .env
   # Edit .env with your keys
   ```

   Required environment variables:
   - `RPC_URL_MAINNET` - Ethereum mainnet RPC endpoint
   - `RPC_URL_ARBITRUM` - Arbitrum RPC endpoint
   - `RPC_URL_BASE` - Base RPC endpoint
   - `BICONOMY_API_KEY` - Biconomy API key for gasless transactions
   - `PRIVATE_KEY` - Bot wallet private key

3. Run tests:
   ```bash
   npm test
   ```

## Architecture

See architecture documentation for detailed system design.

