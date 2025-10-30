# FHE RaceTrack - Encrypted Horse Racing DApp

A decentralized horse racing DApp built with Zama FHEVM technology, featuring encrypted betting, private race results, and secure reward distribution.

## 🏇 Project Overview

FHE RaceTrack is a privacy-preserving horse racing platform where:
- **Horse NFTs** are minted with encrypted attributes (speed, stamina, agility)
- **Bets** are placed using encrypted data (horse selection and bet amount)
- **Race results** are calculated using encrypted random numbers
- **Rewards** are distributed fairly based on encrypted calculations

All sensitive data remains encrypted throughout the process, ensuring complete privacy and fairness.

## 📁 Project Structure

```
FHERaceTrack/
├── contracts/          # Smart contracts (backend)
│   ├── contracts/
│   │   └── FHERaceTrack.sol
│   ├── deploy/
│   │   └── deploy.ts
│   ├── test/
│   │   └── FHERaceTrack.ts
│   ├── hardhat.config.ts
│   └── package.json
│
└── frontend/          # React frontend
    ├── app/
    ├── components/
    ├── hooks/
    ├── fhevm/
    ├── abi/
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- MetaMask or compatible Web3 wallet
- Hardhat node with FHEVM support (for local development)

### Installation

#### 1. Install Backend Dependencies

```bash
cd contracts
npm install
```

#### 2. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Development Setup

#### Step 1: Start Hardhat Node with FHEVM

In the `contracts` directory:

```bash
npx hardhat node
```

This will start a local Hardhat node with FHEVM support on `http://localhost:8545`.

#### Step 2: Deploy Contracts

In a new terminal, from the `contracts` directory:

```bash
npx hardhat deploy --network localhost
```

This will deploy the `FHERaceTrack` contract to your local network. Note the contract address.

#### Step 3: Generate ABI Files

From the `frontend` directory:

```bash
npm run genabi
```

This script reads the deployed contract information and generates TypeScript files in `frontend/abi/`.

#### Step 4: Start Frontend Development Server

From the `frontend` directory:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Using the Application

1. **Connect MetaMask**: Click "Connect to MetaMask" and approve the connection
2. **Mint a Horse**: 
   - Generate random attributes (speed, stamina, agility) in the range 50-100
   - Encrypt the attributes using FHEVM
   - Call `mintHorse` with encrypted attributes
3. **Create a Race**:
   - Select at least 2 horses to participate
   - Set race duration
   - Create the race
4. **Place a Bet**:
   - Select a horse (encrypted)
   - Enter bet amount (encrypted)
   - Submit the bet
5. **Execute Race**:
   - Wait for race end time
   - Generate encrypted random number
   - Execute race calculation
6. **Decrypt Results**:
   - Decrypt the winner index
   - View race results
7. **Claim Rewards**:
   - If you won, claim your reward

## 🔧 Configuration

### Backend Configuration

Edit `contracts/hardhat.config.ts` to configure networks, accounts, and other settings.

### Frontend Configuration

The frontend automatically detects the contract address from the deployment files. Make sure to run `npm run genabi` after deploying contracts.

## 🌐 Deploying to Sepolia Testnet

This project supports deployment to Sepolia testnet with custom RPC URL and mnemonic configuration.

### Prerequisites

- Sepolia ETH in your wallet (for gas fees)
- A custom Sepolia RPC URL (or use Infura/other providers)
- A mnemonic phrase for your wallet

### Step-by-Step Deployment Guide

#### Step 1: Set Environment Variables (PowerShell)

Open PowerShell and navigate to the `contracts` directory, then set the required environment variables:

```powershell
# Set your custom Sepolia RPC URL
$env:SEPOLIA_RPC_URL="https://your-custom-sepolia-rpc-url.com"

# Set your wallet mnemonic (12 or 24 words)
$env:MNEMONIC="your twelve word mnemonic phrase goes here example test test test test test test test test test test test junk"

# Optional: Set Etherscan API key for contract verification
$env:ETHERSCAN_API_KEY="your-etherscan-api-key"
```

**Note**: 
- The `SEPOLIA_RPC_URL` environment variable takes priority over the Infura URL in the config
- The `MNEMONIC` environment variable takes priority over hardhat vars
- These environment variables are session-specific in PowerShell. If you close the terminal, you'll need to set them again

#### Step 2: Compile Contracts

From the `contracts` directory:

```powershell
npm run compile
```

This compiles your Solidity contracts and generates the necessary artifacts.

#### Step 3: Deploy to Sepolia

From the `contracts` directory:

```powershell
npm run deploy:sepolia
```

Or using hardhat directly:

```powershell
npx hardhat deploy --network sepolia
```

The deployment script will:
- Use your mnemonic to derive the deployer account
- Connect to Sepolia using your custom RPC URL (or Infura if not set)
- Deploy the `FHERaceTrack` contract
- Save the deployment information to `contracts/deployments/sepolia/`

**Expected Output:**
```
deploying "FHERaceTrack" (tx: 0x...)
FHERaceTrack deployed at: 0x...
FHERaceTrack contract: 0x...
```

#### Step 4: Generate Frontend ABI and Addresses

From the `frontend` directory:

```powershell
npm run genabi
```

This script will:
- Automatically detect the Sepolia deployment (chain ID: 11155111)
- Read the contract ABI and address from `contracts/deployments/sepolia/`
- Generate `FHERaceTrackABI.ts` with the contract ABI
- Generate `FHERaceTrackAddresses.ts` with the Sepolia address mapping
- Skip any networks that don't have deployments (no errors)

**Note**: If you haven't deployed to localhost, the script will skip it and only include Sepolia addresses.

#### Step 5: Verify Contract (Optional)

If you set the `ETHERSCAN_API_KEY`, you can verify your contract on Etherscan:

```powershell
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Complete Deployment Workflow

Here's the complete workflow in one PowerShell session:

```powershell
# Navigate to contracts directory
cd contracts

# Set environment variables
$env:SEPOLIA_RPC_URL="https://your-custom-sepolia-rpc-url.com"
$env:MNEMONIC="your twelve word mnemonic phrase goes here"

# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia

# Navigate to frontend directory
cd ../frontend

# Generate ABI and addresses
npm run genabi

# Start frontend (optional)
npm run dev
```

### Troubleshooting Deployment

#### Error: "insufficient funds"
- Make sure your wallet has enough Sepolia ETH for gas fees
- Check your account balance: `npx hardhat run --network sepolia scripts/check-balance.js`

#### Error: "network error" or "connection refused"
- Verify your `SEPOLIA_RPC_URL` is correct and accessible
- Test the RPC URL: `curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' $env:SEPOLIA_RPC_URL`

#### Error: "invalid mnemonic"
- Ensure your mnemonic is exactly 12 or 24 words
- Check for typos or extra spaces

#### Contract address not found in frontend
- Make sure you ran `npm run genabi` after deployment
- Check that `frontend/abi/FHERaceTrackAddresses.ts` contains the Sepolia address
- Verify the chain ID is `11155111` in the addresses file

### Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SEPOLIA_RPC_URL` | No* | Custom Sepolia RPC endpoint | `https://sepolia.infura.io/v3/YOUR_KEY` |
| `MNEMONIC` | No* | Wallet mnemonic phrase | `word1 word2 ... word12` |
| `ETHERSCAN_API_KEY` | No | For contract verification | `ABC123...` |

*If not set, the config will use Infura (for RPC) or hardhat vars (for mnemonic)

## 📝 Key Features

### 1. Encrypted Horse Attributes

Horses are minted with three encrypted attributes:
- **Speed** (euint32): 50-100
- **Stamina** (euint32): 50-100  
- **Agility** (euint32): 50-100

These attributes remain encrypted on-chain and can only be decrypted by the horse owner.

### 2. Encrypted Betting

When placing a bet:
- Horse selection is encrypted
- Bet amount is encrypted
- Only the bettor can decrypt their own bet information

### 3. Encrypted Race Calculation

Race results are calculated using:
- Encrypted horse attributes
- Encrypted random number
- FHE operations (addition, comparison)

The winner is determined through encrypted computations, ensuring fairness.

### 4. Secure Reward Distribution

Rewards are calculated and distributed based on encrypted race results. Winners can claim their rewards after the race completes.

## 🧪 Testing

Run tests from the `contracts` directory:

```bash
npm test
```

Tests require a local Hardhat node with FHEVM support.

## 📚 Technical Details

### FHEVM Integration

The contract uses:
- `@fhevm/solidity` for encrypted types (`euint32`)
- `FHE.fromExternal()` to convert external encrypted inputs
- `FHE.add()`, `FHE.sub()`, `FHE.rem()` for encrypted operations
- `FHE.allow()` and `FHE.allowThis()` for decryption permissions

### Frontend FHEVM Usage

The frontend uses:
- `@zama-fhe/relayer-sdk` for encryption/decryption
- `instance.createEncryptedInput()` to create encrypted inputs
- `instance.userDecrypt()` to decrypt results
- `FhevmDecryptionSignature` for decryption signatures

## 🔒 Security Considerations

- All sensitive data (horse attributes, bets, race results) remain encrypted
- Decryption requires proper permissions set by the contract
- Random number generation uses encrypted values
- Race results cannot be predicted before execution

## 📖 API Reference

### Contract Functions

#### Horse Management
- `mintHorse(speed, stamina, agility, proofs)` - Mint a new horse with encrypted attributes
- `getHorseAttributes(horseId)` - Get encrypted horse attributes

#### Race Management
- `createRace(horseIds, duration)` - Create a new race
- `executeRace(raceId, randomEncrypted, randomProof)` - Execute race with encrypted random number
- `getRace(raceId)` - Get race information
- `getRaceWinner(raceId)` - Get encrypted winner index

#### Betting
- `placeBet(raceId, horseIdEncrypted, amountEncrypted, proofs)` - Place an encrypted bet
- `getBet(raceId, bettor)` - Get bet information

#### Rewards
- `claimReward(raceId, winnerIndexDecrypted)` - Claim reward after race completion

## 🐛 Troubleshooting

### Contract Not Deployed

If the frontend shows "Contract not deployed":
1. Make sure Hardhat node is running
2. Deploy contracts: `npx hardhat deploy --network localhost`
3. Regenerate ABI: `npm run genabi` (from frontend directory)

### FHEVM Instance Not Loading

1. Check browser console for errors
2. Ensure MetaMask is connected
3. Verify you're on the correct network (localhost:8545)
4. Check that FHEVM Relayer SDK is loaded

### Decryption Fails

1. Ensure you have permission to decrypt (contract must call `FHE.allow()`)
2. Check that decryption signature is valid
3. Verify contract address matches

## 📄 License

MIT

## 🙏 Acknowledgments

Built using [Zama FHEVM](https://github.com/zama-ai/fhevm) technology.

