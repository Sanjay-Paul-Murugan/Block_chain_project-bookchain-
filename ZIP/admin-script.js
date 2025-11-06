// ==========================
// admin-script.js (Fixed)
// ==========================

const EXPLORER_URL = 'https://sepolia.etherscan.io/tx/';

let contractsReady = false;

// ✅ Wait for contracts safely
async function waitForContractsReady(maxTries = 10) {
  for (let i = 0; i < maxTries; i++) {
    if (
      window.libraryBookContract?.methods &&
      window.lendingManagerContract?.methods &&
      window.membershipNFTContract?.methods
    ) {
      console.log('✅ All contracts initialized.');
      contractsReady = true;
      return true;
    }
    console.log(`⏳ Waiting for contracts... (${i + 1}/${maxTries})`);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.error('❌ Contracts failed to initialize.');
  displayToast('Contracts not ready. Please reconnect wallet.');
  return false;
}

// ✅ DOM Ready
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await ensureWeb3Connection();

    const ok = await waitForContractsReady();
    if (!ok) return;

    setupAdminEventListeners();
    await Promise.all([loadAdminDashboard(), renderBooksTable()]);
  } catch (err) {
    console.error('❌ Init failed:', err);
    displayToast('Failed to load admin dashboard.');
  }
});

// ✅ Web3 + contract connection check
async function ensureWeb3Connection() {
  try {
    // Ensure wallet connected
    if (!window.web3 || !window.account) {
      if (typeof window.initWeb3 === 'function') {
        const ok = await window.initWeb3();
        if (!ok) throw new Error('Wallet not connected');
      } else {
        throw new Error('Missing initWeb3');
      }
    }

    // Ensure contracts initialized
    if (
      !window.libraryBookContract ||
      !window.lendingManagerContract ||
      !window.membershipNFTContract
    ) {
      if (typeof window.initContracts === 'function') {
        await window.initContracts();
      } else {
        throw new Error('Missing initContracts');
      }
    }
  } catch (e) {
    console.error('⚠️ Web3 setup failed:', e);
    displayToast('Web3 connection failed. Redirecting...');
    setTimeout(() => (window.location.href = 'index.html'), 2000);
  }
}

// ✅ Event listeners
function setupAdminEventListeners() {
  const ids = [
    ['addBookForm', addBookHandler],
    ['editBookForm', updateBookHandler],
  ];

  const btns = [
    ['loadBooksBtn', renderBooksTable],
    ['refreshBtn', loadAdminDashboard],
    ['mintMembershipBtn', mintMembershipHandler],
    ['revokeMembershipBtn', revokeMembershipHandler],
    ['setFineBtn', setFineHandler],
  ];

  ids.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('submit', fn);
  });

  btns.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  });

  const closeBtn = document.querySelector('.modal-close');
  if (closeBtn)
    closeBtn.addEventListener(
      'click',
      () => (document.getElementById('editBookModal').style.display = 'none')
    );
}

// ✅ Dashboard
async function loadAdminDashboard() {
  try {
    const [bookCount, recordCount, totalSupply] = await Promise.all([
      libraryBookContract.methods.bookCount().call(),
      lendingManagerContract.methods.recordCount().call(),
      membershipNFTContract.methods.totalSupply().call(),
    ]);

    document.getElementById('totalBooks').textContent = bookCount;
    document.getElementById('totalIssued').textContent = recordCount;
    document.getElementById('mintedNFTs').textContent = totalSupply;

    const uniqueUsers = new Set();
    let pending = 0;

    for (let i = 1; i <= recordCount; i++) {
      const r = await lendingManagerContract.methods.records(i).call();
      uniqueUsers.add(r.user);
      if (!r.returned) pending++;
    }

    document.getElementById('totalUsers').textContent = uniqueUsers.size;
    document.getElementById('pendingReturns').textContent = pending;
  } catch (e) {
    console.error(e);
    displayToast('Failed to load dashboard.');
  }
}

// ✅ Books Table
async function renderBooksTable() {
  const tbody = document.getElementById('booksTableBody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>`;

  try {
    const count = await libraryBookContract.methods.bookCount().call();
    if (count === '0') {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No books found</td></tr>`;
      return;
    }

    let html = '';
    for (let i = 1; i <= count; i++) {
      const b = await libraryBookContract.methods.books(i).call();
      if (b.id === '0') continue;

      const avail = b.isAvailable
        ? `<button class="btn-action btn-available" onclick="toggleAvailability(${b.id}, false)">Available</button>`
        : `<button class="btn-action btn-unavailable" onclick="toggleAvailability(${b.id}, true)">Unavailable</button>`;

      html += `
        <tr>
          <td>${b.id}</td>
          <td>${b.title}</td>
          <td>${b.author}</td>
          <td>${b.isbn}</td>
          <td>${avail}</td>
          <td>
            <button class="btn-edit" onclick="openEditModal(${b.id})">Edit</button>
            <button class="btn-delete" onclick="deleteBook(${b.id})">Delete</button>
            <button class="btn-track" onclick="trackBook(${b.id})">Track</button>
          </td>
        </tr>`;
    }

    tbody.innerHTML = html;
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Error</td></tr>`;
    displayToast('Error loading books.');
  }
}

// ✅ Add Book
async function addBookHandler(e) {
  e.preventDefault();
  const t = bookTitle.value, a = bookAuthor.value, g = bookGenre.value, q = bookQr.value;
  try {
    await libraryBookContract.methods.addBook(t, a, g, q).send({ from: account });
    displayToast('Book added successfully!');
    await Promise.all([loadAdminDashboard(), renderBooksTable()]);
  } catch (e) {
    console.error(e);
    displayToast('Error adding book.');
  }
}

// ✅ Other functions unchanged (toggleAvailability, edit, delete, membership, fine)
// Toggle availability
async function toggleAvailability(id, avail) {
  try {
    await libraryBookContract.methods.setAvailability(id, avail).send({ from: account });
    displayToast('Availability updated.');
    await renderBooksTable();
  } catch (e) {
    console.error(e);
    displayToast('Error updating availability.');
  }
}

// Edit modal
async function openEditModal(id) {
  try {
    const b = await libraryBookContract.methods.getBook(id).call();
    document.getElementById('editBookId').value = b.id;
    document.getElementById('editTitle').value = b.title;
    document.getElementById('editAuthor').value = b.author;
    document.getElementById('editGenre').value = b.isbn;
    document.getElementById('editBookModal').style.display = 'block';
  } catch (e) {
    console.error(e);
    displayToast('Error loading book details.');
  }
}

// Update book
async function updateBookHandler(e) {
  e.preventDefault();
  const id = document.getElementById('editBookId').value;
  const t = document.getElementById('editTitle').value;
  const a = document.getElementById('editAuthor').value;
  const g = document.getElementById('editGenre').value;

  try {
    await libraryBookContract.methods.editBook(id, t, a, g).send({ from: account });
    displayToast('Book updated!');
    document.getElementById('editBookModal').style.display = 'none';
    await renderBooksTable();
  } catch (e) {
    console.error(e);
    displayToast('Error updating book.');
  }
}

// Delete book
async function deleteBook(id) {
  if (!confirm('Confirm delete?')) return;
  try {
    await libraryBookContract.methods.removeBook(id).send({ from: account });
    displayToast('Book deleted.');
    await renderBooksTable();
  } catch (e) {
    console.error(e);
    displayToast('Error deleting book.');
  }
}

// Membership controls
async function mintMembershipHandler() {
  const addr = document.getElementById('userAddress').value;
  if (!web3.utils.isAddress(addr)) return displayToast('Invalid address');
  try {
    await membershipNFTContract.methods.mintMembership(addr).send({ from: account });
    displayToast('Membership minted!');
  } catch (e) {
    console.error(e);
    displayToast('Error minting.');
  }
}

async function revokeMembershipHandler() {
  const addr = document.getElementById('userAddress').value;
  if (!web3.utils.isAddress(addr)) return displayToast('Invalid address');
  try {
    const bal = await membershipNFTContract.methods.balanceOf(addr).call();
    if (bal === '0') return displayToast('No membership found.');
    const token = await membershipNFTContract.methods.tokenOfOwnerByIndex(addr, 0).call();
    await membershipNFTContract.methods.revokeMembership(token).send({ from: account });
    displayToast('Membership revoked.');
  } catch (e) {
    console.error(e);
    displayToast('Error revoking.');
  }
}

// Set fine
async function setFineHandler() {
  const fine = document.getElementById('finePerDay').value;
  if (!fine || fine <= 0) return displayToast('Invalid fine.');
  try {
    await lendingManagerContract.methods.setFinePerDay(fine).send({ from: account });
    displayToast('Fine updated!');
  } catch (e) {
    console.error(e);
    displayToast('Error setting fine.');
  }
}

// Toast
function displayToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = msg;
  t.style.display = 'block';
  setTimeout(() => (t.style.display = 'none'), 3000);
}
