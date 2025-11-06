# Changelog - Library DApp

## Stage 4 - Connect Wallet Logic (Completed)

### Changes to index.html:
- ✅ Added big "Connect Wallet" button with id="connectWallet"
- ✅ Simplified UI to show only connect button and connected address
- ✅ Added toast notification for error messages
- ✅ Removed navigation buttons (redirects handle this now)

### Changes to script.js:
- ✅ Added `initWeb3()` function to detect MetaMask and instantiate Web3
- ✅ Added `checkRole()` function comparing account with ADMIN_ADDRESS
- ✅ Implemented automatic redirect to admin.html or user.html
- ✅ Added `formatAddress()` helper function
- ✅ Added `displayToast()` helper function
- ✅ Added ADMIN_ADDRESS placeholder that must be configured after deployment

### Changes to style.css:
- ✅ Added `.btn-big` class for large connect button (full width, bigger padding)
- ✅ Added `.connected-address` style for displaying connected wallet
- ✅ Added `.toast` style for toast notifications with slide-in animation

### Changes to README.md:
- ✅ Added "Step 1: Configure Admin Address" section
- ✅ Updated testing instructions to reflect new "Connect Wallet" button
- ✅ Added explanation that users are auto-redirected based on role

### Important Configuration:
The `ADMIN_ADDRESS` constant in `script.js` (line 8) must be set to the deployer address after deploying LibraryBook contract. This is used to redirect users to admin.html or user.html.

```javascript
const ADMIN_ADDRESS = '';  // Set this after deployment
```

---

## Stage 2 - Smart Contracts (Completed)

### LibraryBook.sol
- ✅ Struct updated: `uint id`, added `string qr` field
- ✅ Functions: `addBook`, `editBook`, `removeBook`, `getBook`, `setAvailability`
- ✅ Events: `BookAdded`, `BookEdited`, `BookRemoved`, `AvailabilityChanged`
- ✅ Uses `onlyAdmin` modifier

### MembershipNFT.sol
- ✅ Based on OpenZeppelin ERC721
- ✅ Added `revokeMembership()` function
- ✅ Added `tokenOfOwnerByIndex()` compatibility
- ✅ Uses `onlyAdmin` modifier
- ✅ Events: `MembershipMinted`, `MembershipRevoked`

### LendingManager.sol
- ✅ Record struct with `issueDate`, `dueDate`, `returnDate`
- ✅ Added `finePerDay` variable
- ✅ `issueBook(uint bookId, uint _days)` function
- ✅ `returnBook(uint recordId)` payable function with fine calculation
- ✅ `calculateFine(uint recordId)` function
- ✅ `getUserRecords(address user)` returns uint[] array
- ✅ Constructor takes `libraryBook` address and `finePerDay`
- ✅ Events: `Issued`, `Returned`, `FinePaid`

### Bug Fixes Applied:
- ✅ MembershipNFT.sol: Added `override` to `_exists()` function
- ✅ LendingManager.sol: Renamed `days` parameter to `_days` to avoid reserved keyword conflict

---

## Stage 5 - Admin Portal (Completed)

### Changes to admin.html:
- ✅ Added dashboard summary cards (Total Books, Books Issued, Unique Users, Minted NFTs, Pending Returns)
- ✅ Updated add book form with title, author, genre/ISBN, and QR fields
- ✅ Added books table with inline actions (Edit, Delete, Track, Set Availability)
- ✅ Added user management panel with mint/revoke membership functionality
- ✅ Added settings panel for setting finePerDay
- ✅ Added edit book modal
- ✅ Improved layout with form rows for side-by-side inputs

### Changes to admin-script.js:
- ✅ Implemented `loadAdminDashboard()` - fetches counts from contracts
  - Reads bookCount from LibraryBook
  - Reads recordCount from LendingManager
  - Reads totalSupply from MembershipNFT
  - Calculates unique users and pending returns
- ✅ Implemented `renderBooksTable()` - loops through all books and displays in table
- ✅ Implemented `addBookHandler()` - calls LibraryBook.addBook() with form data
- ✅ Added `toggleAvailability()` - calls LibraryBook.setAvailability()
- ✅ Added `openEditModal()` - opens modal with book details
- ✅ Added `updateBookHandler()` - calls LibraryBook.editBook()
- ✅ Added `deleteBook()` - calls LibraryBook.removeBook()
- ✅ Added `trackBook()` - placeholder for transaction tracking
- ✅ Added `mintMembershipHandler()` - calls MembershipNFT.mintMembership()
- ✅ Added `revokeMembershipHandler()` - calls MembershipNFT.revokeMembership()
- ✅ Added `setFineHandler()` - calls LendingManager.setFinePerDay()
- ✅ All functions show success/failure toasts with transaction hash
- ✅ Added explorer link to transactions
- ✅ Proper error handling with try-catch blocks
- ✅ Transaction hash notifications using `.on('transactionHash', ...)`

### Changes to admin-styles.css:
- ✅ Added `.dashboard-summary` grid layout for summary cards
- ✅ Added `.summary-card` styles with gradient background
- ✅ Added `.form-row` for side-by-side form inputs
- ✅ Added `.table-container` for responsive table
- ✅ Added `.btn-action` styles for Edit, Delete, Track buttons
- ✅ Added `.btn-available` and `.btn-unavailable` for availability toggles
- ✅ Added `.modal` styles for edit book modal
- ✅ Added `.modal-content` and `.modal-close` styles
- ✅ Added `.users-container` for user management panel

### Features Implemented:
- ✅ Dashboard loads counts automatically on page load
- ✅ Books table refreshes automatically after add/edit/delete operations
- ✅ All contract interactions require admin approval via MetaMask
- ✅ Transaction hashes displayed with explorer links
- ✅ Toast notifications for all user actions
- ✅ Modal for editing book details
- ✅ Confirmation dialog for delete operations
- ✅ Address validation for membership operations
- ✅ Full error handling and user feedback

---

## Stage 6 - User Portal (Completed)

### Changes to user.html:
- ✅ Added user profile block with name/email/address placeholders
- ✅ Added "Show My NFT" button that displays NFT and generates QR
- ✅ Added borrow book form with book ID and days input
- ✅ Added borrowed books table showing all user records
- ✅ Added fine payment modal for overdue returns
- ✅ Removed old section layouts, simplified to focus on core functionality

### Changes to user-script.js:
- ✅ Implemented `initContracts()` - initializes all contract instances
- ✅ Implemented `displayUserInfo()` - displays user address
- ✅ Implemented `checkMembership()` - checks if user has membership
- ✅ Implemented `showNFT()` - finds NFT token for user, displays tokenId and generates QR using QRious
- ✅ Implemented `loadUserBooks()` - calls LendingManager.getUserRecords(account) and displays in table
  - Fetches record details with issue/due dates
  - Gets book details using LibraryBook.getBook()
  - Shows status badges (Active/Returned)
  - Adds return button for active books
- ✅ Implemented `borrowBookHandler()` - calls LendingManager.issueBook() via .send({from: account})
  - Takes bookId and days as parameters
  - Shows transaction hash with explorer link
  - Refreshes table on success
- ✅ Implemented `returnBookFromTable()` - handles return flow
  - Calculates fine before returning
  - Shows fine payment modal if fine > 0
  - Processes return after payment
- ✅ Implemented `payFineHandler()` - pays fine and returns book with msg.value
- ✅ Implemented `processReturn()` - returns book without fine
- ✅ Added grace message: "Contact admin to mint membership" if no NFT
- ✅ All functions show transaction hash with explorer links
- ✅ Proper error handling and toast notifications

### Changes to user-styles.css:
- ✅ Added `.user-profile` for profile block layout
- ✅ Added `.nft-display` for NFT display area
- ✅ Added `.form-row` for side-by-side form inputs
- ✅ Added `.table-container` for responsive table
- ✅ Added `.status-active` and `.status-returned` badge styles
- ✅ Added `.btn-action` for return buttons
- ✅ Added `.modal` styles for fine payment modal
- ✅ Added `.modal-content` and `.modal-close` styles
- ✅ Improved mobile responsiveness for tables and modals

### Features Implemented:
- ✅ User profile with address display
- ✅ Show NFT button displays token ID and generates QR code
- ✅ Borrow books by book ID and days
- ✅ View all borrowed books in table format
- ✅ Return books with fine calculation
- ✅ Fine payment modal for overdue returns
- ✅ Graceful handling when user has no membership
- ✅ Transaction hashes with explorer links
- ✅ Toast notifications for all actions
- ✅ Loading states and error messages
- ✅ Mobile responsive design
