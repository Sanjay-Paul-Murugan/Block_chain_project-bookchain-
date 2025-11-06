// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import interfaces for LibraryBook and MembershipNFT
interface ILibraryBook {
    function getBook(uint id) external view returns (uint, string memory, string memory, string memory, string memory, bool);
    function setAvailability(uint id, bool available) external;
}

interface IMembershipNFT {
    function hasMembership(address member) external view returns (bool);
}

// LendingManager contract manages book lending and returns with fine calculation
contract LendingManager {
    // Reference to LibraryBook contract
    ILibraryBook public libraryBook;
    
    // Reference to MembershipNFT contract
    IMembershipNFT public membershipNFT;
    
    // Lending record structure
    struct Record {
        uint id;                 // Unique record ID
        address user;             // Borrower address
        uint bookId;              // Book ID being borrowed
        uint issueDate;           // Timestamp when book was issued
        uint dueDate;             // Timestamp when book is due
        bool returned;            // Return status flag
        uint returnDate;          // Timestamp when book was returned
    }

    // Mapping from record ID to lending record
    mapping(uint => Record) public records;
    
    // Total number of lending records
    uint public recordCount;
    
    // Fine per day for late returns (in wei)
    uint public finePerDay;
    
    // Contract admin address
    address public admin;

    // Event emitted when a book is issued
    event Issued(uint indexed recordId, uint indexed bookId, address indexed user, uint dueDate);

    // Event emitted when a book is returned
    event Returned(uint indexed recordId, uint indexed bookId, address indexed user);

    // Event emitted when fine is paid
    event FinePaid(uint indexed recordId, uint amount);

    // Constructor sets contract addresses and initial fine
    constructor(address _libraryBook, uint _finePerDay) {
        libraryBook = ILibraryBook(_libraryBook);  // Set LibraryBook address
        admin = msg.sender;  // Set deployer as admin
        finePerDay = _finePerDay;  // Set fine per day in wei
    }

    // Set the MembershipNFT contract address
    function setMembershipNFT(address _membershipNFT) public {
        require(msg.sender == admin, "Only admin can call this");
        membershipNFT = IMembershipNFT(_membershipNFT);  // Set MembershipNFT address
    }

    // Modifier to restrict functions to admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    // Set the fine per day amount
    function setFinePerDay(uint _finePerDay) public onlyAdmin {
        finePerDay = _finePerDay;  // Update fine per day
    }

    // Issue a book to a user for specified days
    function issueBook(uint bookId, uint _days) public returns (uint) {
        require(membershipNFT.hasMembership(msg.sender), "Membership required");  // Check membership
        (uint id,,,,, bool isAvailable) = libraryBook.getBook(bookId);  // Get book details
        require(id != 0, "Book does not exist");  // Check book exists
        require(isAvailable, "Book is not available");  // Check if book is available
        
        recordCount++;  // Increment record counter
        uint newRecordId = recordCount;  // Generate new record ID
        
        // Create lending record
        records[newRecordId] = Record({
            id: newRecordId,
            user: msg.sender,
            bookId: bookId,
            issueDate: block.timestamp,
            dueDate: block.timestamp + (_days * 1 days),  // Calculate due date
            returned: false,
            returnDate: 0
        });
        
        // Set book as unavailable
        libraryBook.setAvailability(bookId, false);
        
        emit Issued(newRecordId, bookId, msg.sender, records[newRecordId].dueDate);  // Emit issue event
        return newRecordId;  // Return record ID
    }

    // Return a book and pay fine if overdue (payable function)
    function returnBook(uint recordId) public payable {
        Record storage record = records[recordId];  // Get lending record
        require(record.id != 0, "Record does not exist");  // Check record exists
        require(!record.returned, "Already returned");  // Check not already returned
        require(record.user == msg.sender, "Not your record");  // Check ownership
        
        uint fine = calculateFine(recordId);  // Calculate fine for late return
        
        require(msg.value >= fine, "Insufficient fine payment");  // Verify fine payment
        
        if (fine > 0) {
            payable(admin).transfer(fine);  // Transfer fine to admin
            emit FinePaid(recordId, fine);  // Emit fine paid event
        }
        
        record.returned = true;  // Mark as returned
        record.returnDate = block.timestamp;  // Set return timestamp
        
        // Set book as available
        libraryBook.setAvailability(record.bookId, true);
        
        emit Returned(recordId, record.bookId, msg.sender);  // Emit return event
    }

    // Calculate fine for overdue book
    function calculateFine(uint recordId) public view returns (uint) {
        Record memory record = records[recordId];  // Get record
        if (record.returned || block.timestamp <= record.dueDate) {
            return 0;  // No fine if returned or not overdue
        }
        
        uint daysOverdue = (block.timestamp - record.dueDate) / 1 days;  // Calculate days overdue
        return daysOverdue * finePerDay;  // Return total fine amount
    }

    // Get all record IDs for a specific user
    function getUserRecords(address user) public view returns (uint[] memory) {
        uint count = 0;  // Count user records
        
        // First pass: count records
        for (uint i = 1; i <= recordCount; i++) {
            if (records[i].user == user) {
                count++;  // Increment count
            }
        }
        
        // Second pass: build return array
        uint[] memory userRecords = new uint[](count);
        uint index = 0;
        for (uint i = 1; i <= recordCount; i++) {
            if (records[i].user == user) {
                userRecords[index] = i;  // Add record ID
                index++;
            }
        }
        return userRecords;  // Return array of record IDs
    }

    // Get record details by ID
    function getRecord(uint recordId) public view returns (Record memory) {
        return records[recordId];  // Return record structure
    }

    // Check if book is available
    function isBookAvailable(uint bookId) public view returns (bool) {
        (uint id,,,,, bool isAvailable) = libraryBook.getBook(bookId);  // Get book details
        return id != 0 && isAvailable;  // Return availability status
    }
}
