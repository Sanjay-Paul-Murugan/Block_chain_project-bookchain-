// User-specific script for borrowing, returning books, and viewing NFT
// Load contract instances and ABIs
let libraryBookContract;
let membershipNFTContract;
let lendingManagerContract;
// IPFS Gateway for NFT metadata & images
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";


// Network explorer URL
const EXPLORER_URL = 'https://sepolia.etherscan.io/tx/';  // Change for different networks

// Store for fine information
let currentFineRecordId = null;
let currentFineAmount = 0;

// Initialize user page
window.addEventListener('DOMContentLoaded', async () => {
    await initContracts();  // Initialize contract instances
    setupUserEventListeners();  // Setup user-specific event listeners
    displayUserInfo();  // Display user address
    await checkMembership();  // Check membership status
});

// Initialize contract instances
async function initContracts() {
    try {
        if (typeof web3 === 'undefined') {
            displayToast('Please connect wallet first');
            setTimeout(() => { window.location.href = 'index.html'; }, 2000);
            return;
        }
        
        const accounts = await web3.eth.getAccounts();
        if (accounts && accounts.length > 0) {
            account = accounts[0];
        } else {
            displayToast('No accounts found');
            return;
        }
        
        libraryBookContract = new web3.eth.Contract(LIBRARY_BOOK_ABI, LIBRARY_BOOK_ADDRESS);
        membershipNFTContract = new web3.eth.Contract(MEMBERSHIP_NFT_ABI, MEMBERSHIP_NFT_ADDRESS);
        lendingManagerContract = new web3.eth.Contract(LENDING_MANAGER_ABI, LENDING_MANAGER_ADDRESS);
    } catch (error) {
        console.error('Contract initialization error:', error);
        displayToast('Failed to initialize contracts: ' + error.message);
    }
}

// Setup user event listeners
function setupUserEventListeners() {
    document.getElementById('borrowBookForm').addEventListener('submit', borrowBookHandler);
    document.getElementById('loadBooksBtn').addEventListener('click', loadUserBooks);
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await checkMembership();
        await loadUserBooks();
    });
    document.getElementById('backBtn').addEventListener('click', () => { window.location.href = 'index.html'; });
    document.getElementById('showNFTBtn').addEventListener('click', showNFT);
    document.getElementById('payFineBtn').addEventListener('click', payFineHandler);
    document.getElementById('cancelFineBtn').addEventListener('click', () => { document.getElementById('fineModal').style.display = 'none'; });
    document.querySelector('.modal-close').addEventListener('click', () => { document.getElementById('fineModal').style.display = 'none'; });
}

// Display user information
async function displayUserInfo() {
    const userAddressEl = document.getElementById('userAddress');
    if (userAddressEl) {
        userAddressEl.textContent = account || 'Not connected';
    }
}

// Check membership status
async function checkMembership() {
    try {
        const hasMembership = await membershipNFTContract.methods.hasMembership(account).call();
        
        if (!hasMembership) {
            displayToast('You do not have a membership. Contact admin to mint membership.');
        }
    } catch (error) {
        console.error('Error checking membership:', error);
    }
}

// Show NFT details and generate QR + display NFT card
async function showNFT() {
    const nftDisplay = document.getElementById('nftDisplay');
    const noMembership = document.getElementById('noMembership');
    const nftInfo = document.getElementById('nftInfo');
    const tokenIdSpan = document.getElementById('tokenId');
    const nftCardContainer = document.getElementById('nftCard'); // ✅ ADD THIS DIV IN HTML

    try {
        const hasMembership = await membershipNFTContract.methods.hasMembership(account).call();
        
        if (!hasMembership) {
            noMembership.style.display = 'block';
            nftInfo.style.display = 'none';
            nftDisplay.style.display = 'block';
            return;
        }

        const balance = await membershipNFTContract.methods.balanceOf(account).call();
        if (balance == 0) {
            noMembership.style.display = 'block';
            nftInfo.style.display = 'none';
            nftDisplay.style.display = 'block';
            return;
        }

        // ✅ Get tokenId
        const tokenId = await membershipNFTContract.methods.tokenOfOwnerByIndex(account, 0).call();
        tokenIdSpan.textContent = tokenId;

        // ✅ Fetch tokenURI
        let tokenURI = await membershipNFTContract.methods.tokenURI(tokenId).call();
        tokenURI = tokenURI.replace("ipfs://", IPFS_GATEWAY);

        const metadata = await fetch(tokenURI).then(res => res.json());

        const imageURL = metadata.image.replace("ipfs://", IPFS_GATEWAY);

        // ✅ Build membership card UI
        nftCardContainer.innerHTML = `
            <div style="
                border:1px solid #ddd;
                padding:15px;
                width:260px;
                border-radius:12px;
                background:#ffffff;
                text-align:center;
                box-shadow:0px 3px 10px rgba(0,0,0,0.15);
                margin:auto;
            ">
                <img src="${imageURL}" style="width:100%; border-radius:10px;">
                <h3>${metadata.name}</h3>
                <p>${metadata.description}</p>
                <hr>
                <strong>Token ID:</strong> ${tokenId}
            </div>
        `;

        // ✅ Generate QR code
        const qrContainer = document.getElementById('nftQR');
        qrContainer.innerHTML = "";
        
        const qrData = JSON.stringify({
            address: account,
            tokenId: tokenId,
            type: "membership"
        });

        const qr = new QRious({
            value: qrData,
            size: 180
        });

        qrContainer.appendChild(qr.canvas);

        nftInfo.style.display = 'block';
        noMembership.style.display = 'none';
        nftDisplay.style.display = 'block';

    } catch (error) {
        console.error("Error fetching NFT:", error);
        displayToast("Failed to load NFT: " + error.message);
    }
}

// Load user books from LendingManager
async function loadUserBooks() {
    const tbody = document.getElementById('borrowedBooksBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Loading...</td></tr>';
    
    try {
        const userRecords = await lendingManagerContract.methods.getUserRecords(account).call();
        
        if (userRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No borrowed books found</td></tr>';
            return;
        }
        
        let html = '';
        
        for (const recordId of userRecords) {
            try {
                const record = await lendingManagerContract.methods.getRecord(recordId).call();
                
                let statusBadge = record.returned 
                    ? '<span class="status-returned">Returned</span>' 
                    : '<span class="status-active">Active</span>';
                
                let actionButton = record.returned
                    ? '<button class="btn-action-disabled" disabled>Returned</button>'
                    : `<button class="btn-action" onclick="returnBookFromTable(${record.id})">Return</button>`;
                
                // Get book details
                const book = await libraryBookContract.methods.getBook(record.bookId).call();
                
                const issueDate = new Date(record.issueDate * 1000).toLocaleString();
                const dueDate = new Date(record.dueDate * 1000).toLocaleString();
                
                html += `
                    <tr>
                        <td>${record.id}</td>
                        <td>${record.bookId}</td>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${issueDate}</td>
                        <td>${dueDate}</td>
                        <td>${statusBadge}</td>
                        <td>${actionButton}</td>
                    </tr>
                `;
            } catch (e) {
                console.error('Error loading record:', e);
                continue;
            }
        }
        
        tbody.innerHTML = html || '<tr><td colspan="8" style="text-align: center;">No borrowed books found</td></tr>';
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Error loading books</td></tr>';
        displayToast('Failed to load books: ' + error.message);
    }
}

// Borrow book handler
async function borrowBookHandler(event) {
    event.preventDefault();
    
    const bookId = document.getElementById('borrowBookId').value;
    const days = document.getElementById('borrowDays').value;
    
    try {
        displayToast('Submitting borrow transaction...');
        
        const tx = lendingManagerContract.methods.issueBook(bookId, days).send({ from: account });
        
        tx.on('transactionHash', (hash) => {
            const link = `<a href="${EXPLORER_URL}${hash}" target="_blank">View on explorer</a>`;
            displayToast(`Transaction submitted: ${link}`);
        });
        
        await tx;
        
        displayToast('Book issued successfully!');
        document.getElementById('borrowBookForm').reset();
        await loadUserBooks();
    } catch (error) {
        console.error('Error borrowing book:', error);
        displayToast('Failed to borrow book: ' + error.message);
    }
}

// Return book handler
async function returnBookFromTable(recordId) {
    try {
        const fine = await lendingManagerContract.methods.calculateFine(recordId).call();
        currentFineRecordId = recordId;
        currentFineAmount = fine;
        
        if (parseInt(fine) > 0) {
            document.getElementById('fineAmount').textContent = fine;
            document.getElementById('fineModal').style.display = 'block';
        } else {
            await processReturn(recordId);
        }
    } catch (error) {
        displayToast('Failed to calculate fine: ' + error.message);
    }
}

// Pay fine and return book
async function payFineHandler() {
    if (currentFineRecordId === null) return;
    
    try {
        displayToast('Processing return with fine payment...');
        
        const tx = lendingManagerContract.methods.returnBook(currentFineRecordId).send({
            from: account,
            value: currentFineAmount
        });
        
        tx.on('transactionHash', (hash) => {
            const link = `<a href="${EXPLORER_URL}${hash}" target="_blank">View on explorer</a>`;
            displayToast(`Transaction submitted: ${link}`);
        });
        
        await tx;
        
        displayToast('Book returned and fine paid successfully!');
        document.getElementById('fineModal').style.display = 'none';
        await loadUserBooks();
    } catch (error) {
        console.error('Error returning book:', error);
        displayToast('Failed to return book: ' + error.message);
    }
}

// Process return without fine
async function processReturn(recordId) {
    try {
        displayToast('Processing return...');
        
        const tx = lendingManagerContract.methods.returnBook(recordId).send({ from: account });
        
        tx.on('transactionHash', (hash) => {
            const link = `<a href="${EXPLORER_URL}${hash}" target="_blank">View on explorer</a>`;
            displayToast(`Transaction submitted: ${link}`);
        });
        
        await tx;
        
        displayToast('Book returned successfully!');
        await loadUserBooks();
    } catch (error) {
        console.error('Error returning book:', error);
        displayToast('Failed to return book: ' + error.message);
    }
}

// Display toast notification
function displayToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.innerHTML = msg;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

// Make functions globally available for onclick handlers
window.returnBookFromTable = returnBookFromTable;