# Blockchain-Based Provenance and Trust Tracking for AI-Generated Images

This repository contains a blockchain final project focused on provenance and trust tracking for AI-generated images. The project was motivated by the recent improvement in image generation quality: highly realistic AI-generated visuals are becoming increasingly difficult to distinguish from real photographs, and hidden watermarks or platform-side safeguards are often not enough once images are reposted, edited, or stripped of context.

Instead of making a binary real-or-fake judgment, this system creates a transparent and tamper-evident provenance record. It combines SHA-256 hashing, IPFS storage, and an Ethereum-compatible smart contract to register image metadata and preserve a later verification history.

## Dashboard Preview

![AI Image Provenance Dashboard](docs/dashboard.png)

## Project Motivation

Recent AI image systems can generate photo-like content convincing enough to create trust and safety risks in journalism, education, social media, digital art, and online communication. Even if a model provider uses hidden watermarks or metadata-based protections, those signals can be lost during screenshots, compression, reposting, or third-party redistribution.

This project explores blockchain as one possible direction for stronger provenance infrastructure. The goal is not to automatically prove absolute authenticity, but to preserve a durable history of:

- what file was registered
- what SHA-256 digest identifies it
- where the file is stored on IPFS
- what prompt and model metadata were provided
- who registered it on-chain
- what later verification records were appended

## Core Features

The system supports:

- uploading an AI-generated image
- computing the image SHA-256 hash
- uploading the image to IPFS
- writing image metadata to the blockchain
- querying provenance and verification history
- appending follow-up verification records

## System Workflow

1. A user connects MetaMask in the frontend.
2. The user selects an image and enters the model name, prompt, and confidence score.
3. The browser computes a local SHA-256 hash of the file.
4. The image is uploaded to IPFS through Pinata.
5. The smart contract stores the hash, CID, metadata, creator address, and timestamp.
6. Other users can later query the image by hash and append verification records with updated scores and remarks.

## Why Blockchain and IPFS

- Blockchain is used for immutable, transparent, and time-stamped provenance metadata.
- SHA-256 is used to create a stable cryptographic fingerprint for each uploaded image.
- IPFS is used to store the image content off-chain while preserving a verifiable content identifier.
- Together, Ethereum and IPFS create a practical hybrid architecture: lightweight on-chain provenance plus decentralized media storage.

## Tech Stack

- Solidity
- Hardhat
- Ethers.js
- React + Vite
- IPFS via Pinata API
- MetaMask
- Mocha + Chai

## Repository and Report

- Code repository: `https://github.com/Cody-Jiang-Zhihong/Pic-On-Chain`
- Final project title: `Blockchain-Based Provenance and Trust Tracking for AI-Generated Images`

## Project Structure

```text
.
├── contracts/ImageProvenance.sol
├── scripts/deploy.js
├── test/ImageProvenance.test.js
├── hardhat.config.js
├── package.json
├── FINAL_PROJECT_PAPER.md
├── FINAL_PROJECT_PAPER.rtf
├── docs/dashboard.png
└── frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src
        ├── App.jsx
        ├── main.jsx
        ├── styles.css
        ├── components
        │   ├── RecordList.jsx
        │   └── UploadForm.jsx
        └── utils
            ├── hash.js
            └── ipfs.js
```

## Smart Contract Features

The `ImageProvenance` contract exposes the following functions:

- `registerImage(bytes32 imageHash, string ipfsCid, string modelName, string prompt, uint8 confidenceScore)`
- `addVerification(bytes32 imageHash, uint8 newScore, string remark)`
- `getImageRecord(bytes32 imageHash)`
- `getVerificationCount(bytes32 imageHash)`
- `getVerification(bytes32 imageHash, uint256 index)`

### Data Structures

`ImageRecord`

- `bytes32 imageHash`
- `string ipfsCid`
- `string modelName`
- `string prompt`
- `uint8 confidenceScore`
- `address creator`
- `uint256 timestamp`

`VerificationRecord`

- `address verifier`
- `uint8 newScore`
- `string remark`
- `uint256 timestamp`

## Prerequisites

- Node.js 22 LTS recommended
- MetaMask browser extension
- A local Hardhat node for local deployment
- A Pinata JWT for IPFS uploads

## Version Notes

- Recommended Node.js version: `22` LTS
- Current project toolchain:
  - Hardhat `2.28.x`
  - Solidity `0.8.24`
  - React `18`
  - Vite `5`
- The project can compile and test on Windows, but `Node 24` may trigger an exit-time assertion after Hardhat prompts on some setups.
- On Windows PowerShell, use `npm.cmd` and `npx.cmd` instead of `npm` and `npx` if script execution is restricted.
- This repository includes a root `.nvmrc` so you can switch to the recommended Node version quickly.

## Installation

Install the smart contract dependencies:

```bash
npm install
```

Install the frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

## Compile and Test

Compile the contract:

```bash
npx hardhat compile
```

Run the tests:

```bash
npx hardhat test
```

## Run Locally

1. Start a local Hardhat node:

```bash
npx hardhat node
```

2. Deploy the contract to localhost in a new terminal:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Copy the deployed contract address and create `frontend/.env.local`:

```bash
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_PINATA_JWT=your_pinata_jwt
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

4. Start the frontend:

```bash
cd frontend
npm run dev
```

## Windows PowerShell Command List

If your PowerShell blocks `npm.ps1` or `npx.ps1`, use the `.cmd` executables instead.

1. Optional: switch to the recommended Node version with nvm:

```powershell
nvm use 22
node -v
```

2. Install root dependencies:

```powershell
npm.cmd install
```

3. Compile contracts:

```powershell
$env:HARDHAT_DISABLE_TELEMETRY_PROMPT='true'
npx.cmd hardhat compile
```

4. Run tests:

```powershell
$env:HARDHAT_DISABLE_TELEMETRY_PROMPT='true'
npx.cmd hardhat test
```

5. Start the local Hardhat node in terminal A:

```powershell
$env:HARDHAT_DISABLE_TELEMETRY_PROMPT='true'
npx.cmd hardhat node
```

6. Deploy the contract in terminal B:

```powershell
$env:HARDHAT_DISABLE_TELEMETRY_PROMPT='true'
npx.cmd hardhat run scripts/deploy.js --network localhost
```

7. Install frontend dependencies:

```powershell
cd frontend
npm.cmd install
```

8. Create `frontend/.env.local`:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_PINATA_JWT=your_pinata_jwt
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

9. Start the frontend dev server:

```powershell
npm.cmd run dev
```

10. Optional: add temporary PowerShell helpers for the current session:

```powershell
function npm { & npm.cmd @Args }
function npx { & npx.cmd @Args }
```

## Frontend Workflow

1. Connect MetaMask.
2. Enter the deployed contract address if it is not already loaded from `VITE_CONTRACT_ADDRESS`.
3. Select an image file and provide the model name, prompt, and confidence score.
4. The app computes the SHA-256 hash locally in the browser.
5. The app uploads the image to IPFS through Pinata.
6. The app sends the registration transaction to the smart contract.
7. Use the image hash to query provenance details and append verification records.

## Test Coverage

The contract tests verify:

- successful registration
- duplicate registration failure
- successful verification insertion
- correct record and verification query responses
