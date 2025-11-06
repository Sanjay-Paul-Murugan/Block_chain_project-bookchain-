# Library DApp - Decentralized Library Management System

A decentralized library management system built with Solidity smart contracts and vanilla JavaScript. This dApp allows library administrators to manage books and users to borrow/return books using blockchain technology.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Smart Contracts](#smart-contracts)
- [Setup Instructions](#setup-instructions)
- [Deployment Steps](#deployment-steps)
- [Testing Instructions](#testing-instructions)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Admin Portal**: Add, edit, and manage books in the library
- **User Portal**: Borrow and return books with membership NFT verification
- **Membership NFT**: ERC721-based membership tokens for library access
- **Transaction History**: View all borrow/return transactions on blockchain
- **QR Code Generation**: Display membership NFT as QR code
- **Mobile-Friendly**: Responsive design for all screen sizes

## 📁 Project Structure

```
library-dapp/
├── index.html              # Landing page with wallet connection
├── admin.html             # Admin portal for managing books
├── user.html              # User portal for borrowing books
├── style.css              # Global styles
├── admin-styles.css       # Admin-specific styles
├── user-styles.css        # User-specific styles
├── script.js              # Shared JavaScript (wallet connection, utilities)
├── admin-script.js        # Admin-specific functionality
├── user-script.js         # User-specific functionality
├── contracts/             # Solidity smart contracts
│   ├── LibraryBook.sol
│   ├── MembershipNFT.sol
│   └── LendingManager.sol
├── abi/                   # Contract ABIs (replace with actual ABIs)
│   ├── LibraryBook.json
│   ├── MembershipNFT.json
│   └── LendingManager.json
├── assets/
│   ├── qr.js             # QR code generation library
│   └── images/           # Image assets folder
└── README.md             # This file
```

## 🛠 Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Blockchain**: Solidity ^0.8.0
- **Web3**: Web3.js (via CDN)
- **QR Code**: QRious library (custom implementation)
- **Development**: Remix IDE or Hardhat

## 🔗 Smart Contracts

### 1. LibraryBook.sol
Manages book metadata and availability:
- `addBook()`: Add new book to library (admin only)
- `removeBook()`: Remove book from library (admin only)
- `updateAvailability()`: Update available copies count
- `getBook()`: Get book details by ID
- `bookExists()`: Check if book exists
- `totalBooks()`: Get total books count

### 2. MembershipNFT.sol
Handles library membership as NFTs:
- `mintMembership()`: Create new membership NFT (admin only)
- `transferFrom()`: Transfer membership to another address
- `hasMembership()`: Check if address has active membership
- `balanceOf()`: Get membership count for address
- `totalSupply()`: Get total memberships issued

### 3. LendingManager.sol
Manages book lending and returns:
- `borrowBook()`: Borrow a book (requires membership)
- `returnBook()`: Return a borrowed book
- `getBorrowRecord()`: Get borrow record details
- `getUserActiveBorrows()`: Get all active borrows for user
- `getBookBorrows()`: Get all borrows for a book
- `totalBorrows()`: Get total borrow records

## 🚀 Setup Instructions

### Prerequisites
- MetaMask browser extension installed
- Local blockchain (Ganache) or testnet (Sepolia/Rinkeby)
- HTTP server (VS Code Live Server, Python's http.server, or Node.js http-server)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd library-dapp
```

### Step 2: Install HTTP Server (if needed)
```bash
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js
npx http-server -p 8000

# Option 3: Using VS Code
# Install "Live Server" extension and click "Go Live"
```

### Step 3: Open in Browser
Navigate to `http://localhost:8000`

## 🔧 Deployment Steps

### Option 1: Using Remix IDE

1. **Open Remix IDE**: Go to https://remix.ethereum.org

2. **Create Contracts**:
   - Create `LibraryBook.sol` in contracts folder
   - Create `MembershipNFT.sol` in contracts folder
   - Create `LendingManager.sol` in contracts folder

3. **Compile Contracts**:
   - Select Solidity compiler version 0.8.0
   - Click "Compile contracts"
   - Verify no errors

4. **Deploy LibraryBook**:
   - Go to "Deploy & Run Transactions"
   - Select "LibraryBook" from dropdown
   - Click "Deploy"
   - Copy deployed address

5. **Deploy MembershipNFT**:
   - Select "MembershipNFT" from dropdown
   - Click "Deploy"
   - Copy deployed address

6. **Deploy LendingManager**:
   - Select "LendingManager" from dropdown
   - Enter LibraryBook address in constructor
   - Enter MembershipNFT address in constructor
   - Click "Deploy"
   - Copy deployed address

7. **Get Contract ABIs**:
   - Click on deployed contract name (e.g., "LIBRARYBOOK")
   - Click "Copy ABI" button
   - Save to corresponding JSON file in `abi/` folder

### Option 2: Using Hardhat

1. **Install Hardhat**:
```bash
npm install --save-dev hardhat
npx hardhat init
```

2. **Create Hardhat Config**:
Create `hardhat.config.js`:
```javascript
require("@nomiclabs/hardhat-web3");

module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
```

3. **Compile Contracts**:
```bash
npx hardhat compile
```

4. **Deploy Contracts**:
Create `scripts/deploy.js`:
```javascript
const hre = require("hardhat");

async function main() {
  // Deploy LibraryBook
  const LibraryBook = await hre.ethers.getContractFactory("LibraryBook");
  const libraryBook = await LibraryBook.deploy();
  console.log("LibraryBook deployed to:", libraryBook.address);

  // Deploy MembershipNFT
  const MembershipNFT = await hre.ethers.getContractFactory("MembershipNFT");
  const membershipNFT = await MembershipNFT.deploy();
  console.log("MembershipNFT deployed to:", membershipNFT.address);

  // Deploy LendingManager
  const LendingManager = await hre.ethers.getContractFactory("LendingManager");
  const lendingManager = await LendingManager.deploy(libraryBook.address, membershipNFT.address);
  console.log("LendingManager deployed to:", lendingManager.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

5. **Run Deployment**:
```bash
npx hardhat run scripts/deploy.js
```

## 🔄 Configure Frontend

After deploying contracts, update the JavaScript files:

1. **Open `script.js`**:
   - **IMPORTANT**: Set `ADMIN_ADDRESS` to your deployer address (the one that deployed LibraryBook)
   - Replace `/* REPLACE_WITH_ADDRESS */` with deployed addresses
   - Replace `/* REPLACE_WITH_ABI */` with copied ABIs

2. **Open `admin-script.js`**:
   - Replace `/* REPLACE_WITH_ABI */` with copied ABIs

3. **Open `user-script.js`**:
   - Replace `/* REPLACE_WITH_ABI */` with copied ABIs

### Step 1: Configure Admin Address
The `ADMIN_ADDRESS` in `script.js` must be set to the address that deployed the LibraryBook contract. This is used to redirect users to either the admin or user portal based on their wallet address.

```javascript
// In script.js - Line 8
const ADMIN_ADDRESS = '0xYourDeployerAddress';  // Replace with your deployer address
```

### Step 2: Configure Contract Addresses
```javascript
const LIBRARY_BOOK_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const MEMBERSHIP_NFT_ADDRESS = '0x1234567890123456789012345678901234567890';
const LENDING_MANAGER_ADDRESS = '0x0987654321098765432109876543210987654321';

const LIBRARY_BOOK_ABI = [/* paste ABI array here */];
const MEMBERSHIP_NFT_ABI = [/* paste ABI array here */];
const LENDING_MANAGER_ABI = [/* paste ABI array here */];
```

## 🧪 Testing Instructions

### Test as Admin

1. **Connect MetaMask**:
   - Open index.html
   - Click "Connect Wallet" button
   - Use the admin account (deployer address you set in `ADMIN_ADDRESS`)
   - You should be automatically redirected to admin.html

2. **Mint Membership** (via Remix or console):
```javascript
// In console or Remix
await membershipNFT.mintMembership('0xUserAddress');
```

3. **Add Books**:
   - Click "Admin Portal"
   - Fill in book details (title, author, ISBN, copies)
   - Click "Add Book"

4. **View All Books**:
   - Click "Load All Books"
   - Verify books are displayed

5. **View Transactions**:
   - Click "Load Transactions"
   - View borrow/return history

### Test as User

1. **Connect MetaMask**:
   - Open index.html
   - Click "Connect Wallet" button
   - Use a different account (not the admin/deployer address)
   - You should be automatically redirected to user.html

2. **Check Membership**:
   - Go to "User Portal"
   - Verify membership status is "Active"
   - View membership QR code

3. **Browse Available Books**:
   - Click "Load Available Books"
   - View books with available copies

4. **Borrow a Book**:
   - Enter a book ID
   - Click "Borrow Book"
   - Approve transaction in MetaMask
   - Wait for confirmation

5. **View My Active Borrows**:
   - Click "Load My Borrows"
   - Verify borrowed books

6. **Return a Book**:
   - Enter borrow ID
   - Click "Return Book"
   - Approve transaction in MetaMask
   - Wait for confirmation

### Manual Testing Checklist

- [ ] Connect MetaMask successfully
- [ ] Admin can add books
- [ ] Admin can view all books
- [ ] Admin can view transactions
- [ ] User can view membership status
- [ ] User can browse available books
- [ ] User can borrow books (with membership)
- [ ] User can view active borrows
- [ ] User can return books
- [ ] Available copies update correctly
- [ ] Error handling works for invalid inputs
- [ ] Mobile responsive design

## 📱 Usage Guide

### For Administrators

1. **Connecting**: Visit the homepage and connect MetaMask
2. **Adding Books**: Use the "Add New Book" form with all required fields
3. **Managing Availability**: Update available copies when books are restocked
4. **Monitoring**: View all borrow/return transactions in real-time

### For Users

1. **Connecting**: Visit the homepage and connect MetaMask
2. **Verifying Membership**: Check membership status in user portal
3. **Browsing Books**: Load and view all available books
4. **Borrowing**: Select a book and complete the borrow transaction
5. **Returning**: Return books using the borrow ID

## ⚠️ Troubleshooting

### MetaMask Not Connecting
- Ensure MetaMask extension is installed
- Check network connection
- Verify you're on the correct blockchain network
- Try refreshing the page

### Contract Calls Failing
- Verify contract addresses are correct
- Ensure ABIs are properly formatted JSON arrays
- Check that contracts are deployed to the same network as MetaMask
- Verify you have enough gas (ETH) for transactions

### "Membership Required" Error
- Ensure user has been granted membership NFT
- Check membership via `hasMembership()` function call
- Mint membership NFT for the user address

### Books Not Loading
- Verify LibraryBook contract is deployed and address is correct
- Check ABI is properly loaded
- Ensure totalBooks count is > 0
- Check browser console for errors

### Transactions Not Confirming
- Increase gas limit in MetaMask
- Check network congestion
- Verify sufficient balance for gas fees
- Wait for network confirmation

### QR Code Not Displaying
- Ensure qr.js is loaded from assets folder
- Check that membership exists for user
- Verify canvas element exists in DOM
- Check browser console for errors

## 📝 Notes

- All transactions are on-chain and require gas fees
- Admin functions are restricted to contract owner
- Membership NFT is required for borrowing
- Book availability is tracked in real-time on blockchain
- Mobile-friendly responsive design
- No external paid dependencies required

## 📄 License

This project is provided as-is for educational purposes.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

Built with ❤️ using Solidity, Web3.js, and vanilla JavaScript
