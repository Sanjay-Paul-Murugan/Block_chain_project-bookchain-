// Main shared script for Library DApp - wallet connection and role detection

let web3;
let account;

// Set after deployment
const ADMIN_ADDRESS = '0xa35f0c823b26b44f6da29dd552f70d4198046111';

// ABI paths
const LIBRARY_BOOK_JSON = 'abi/LibraryBook.json';
const MEMBERSHIP_NFT_JSON = 'abi/MembershipNFT.json';
const LENDING_MANAGER_JSON = 'abi/LendingManager.json';

let libraryBookContract, membershipNFTContract, lendingManagerContract;
let contractsInitialized = false;

// Utility: load ABI JSON
async function loadContractInfo(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}`);
    const data = await res.json();
    if (!data.abi || !data.address)
      throw new Error(`Invalid format in ${path}`);
    return { abi: data.abi, address: data.address };
  } catch (err) {
    console.error('ABI Load Error:', err);
    displayToast('Error loading contract info.');
    throw err;
  }
}

// Initialize contracts (only once)
async function initContracts() {
  if (contractsInitialized) return;
  if (!web3 || !account) return;

  try {
    const [libraryBook, membershipNFT, lendingManager] = await Promise.all([
      loadContractInfo(LIBRARY_BOOK_JSON),
      loadContractInfo(MEMBERSHIP_NFT_JSON),
      loadContractInfo(LENDING_MANAGER_JSON),
    ]);

    libraryBookContract = new web3.eth.Contract(
      libraryBook.abi,
      libraryBook.address
    );
    membershipNFTContract = new web3.eth.Contract(
      membershipNFT.abi,
      membershipNFT.address
    );
    lendingManagerContract = new web3.eth.Contract(
      lendingManager.abi,
      lendingManager.address
    );

    contractsInitialized = true;
    console.log('Contracts initialized successfully.');

    // Expose to global scope
    window.membershipNFTContract = membershipNFTContract;
    window.libraryBookContract = libraryBookContract;
    window.lendingManagerContract = lendingManagerContract;
  } catch (e) {
    displayToast('Contract init failed.');
  }
}

// Initialize web3
async function initWeb3() {
  try {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      account = accounts[0];
      console.log('Connected:', account);
      await initContracts();
      return true;
    } else {
      displayToast('Please install MetaMask.');
      return false;
    }
  } catch (e) {
    displayToast('Web3 init failed: ' + e.message);
    return false;
  }
}

// Handle wallet connect
async function connectWallet() {
  const success = await initWeb3();
  if (!success) return;

  const shortAddress = formatAddress(account);
  document.getElementById('shortAddress').textContent = shortAddress;
  document.getElementById('connectedAddress').style.display = 'block';
  document.querySelector('#walletStatus .status-text').textContent =
    'Connected';

  checkRole();
}

// Detect role and redirect
function checkRole() {
  if (!account || !ADMIN_ADDRESS) {
    displayToast('Admin address missing.');
    return;
  }

  const isAdmin = account.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  window.location.href = isAdmin ? 'admin.html' : 'user.html';
}

// Handle MetaMask account change
if (typeof window.ethereum !== 'undefined') {
  window.ethereum.on('accountsChanged', () => {
    location.reload();
  });
}

// Display short address
function formatAddress(addr) {
  return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : 'N/A';
}

// Toast utility
function displayToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => (toast.style.display = 'none'), 3000);
}

// DOM ready
window.addEventListener('DOMContentLoaded', () => {
  if (window.ethereum) {
    console.log('MetaMask detected.');
    const btn = document.getElementById('connectWallet');
    if (btn) btn.addEventListener('click', connectWallet);
  } else {
    displayToast('MetaMask not detected.');
  }
});
