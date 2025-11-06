// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// LibraryBook contract stores metadata for each book in the library
contract LibraryBook {
    // Book details structure to store book metadata
    struct Book {
        uint id;                   // Unique identifier for the book
        string title;              // Book title
        string author;             // Author name
        string isbn;               // International Standard Book Number
        string qr;                 // QR code data for the book
        bool isAvailable;          // Availability status of the book
    }

    // Mapping from id to Book details
    mapping(uint => Book) public books;
    
    // Total number of books in the library
    uint public bookCount;

    // Address of the library admin
    address public admin;

    // Event emitted when a new book is added
    event BookAdded(uint indexed id, string title, string author, string isbn);

    // Event emitted when a book is edited
    event BookEdited(uint indexed id, string title, string author);

    // Event emitted when a book is removed
    event BookRemoved(uint indexed id);

    // Event emitted when book availability changes
    event AvailabilityChanged(uint indexed id, bool isAvailable);

    // Constructor sets the contract admin
    constructor() {
        admin = msg.sender;  // Deployer becomes the admin
    }

    // Modifier to restrict functions to admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    // Add a new book to the library
    function addBook(string memory title, string memory author, string memory isbn, string memory qr) public onlyAdmin {
        bookCount++;  // Increment book count
        books[bookCount] = Book({
            id: bookCount,
            title: title,
            author: author,
            isbn: isbn,
            qr: qr,
            isAvailable: true  // New books are available by default
        });
        emit BookAdded(bookCount, title, author, isbn);  // Emit event for book addition
    }

    // Edit book details by ID
    function editBook(uint id, string memory title, string memory author, string memory isbn) public onlyAdmin {
        require(books[id].id != 0, "Book does not exist");  // Check if book exists
        books[id].title = title;  // Update title
        books[id].author = author;  // Update author
        books[id].isbn = isbn;  // Update ISBN
        emit BookEdited(id, title, author);  // Emit event for book edit
    }

    // Remove a book from the library
    function removeBook(uint id) public onlyAdmin {
        require(books[id].id != 0, "Book does not exist");  // Check if book exists
        delete books[id];  // Delete book from mapping
        emit BookRemoved(id);  // Emit event for book removal
    }

    // Set book availability status
    function setAvailability(uint id, bool available) public onlyAdmin {
        require(books[id].id != 0, "Book does not exist");  // Check if book exists
        books[id].isAvailable = available;  // Update availability status
        emit AvailabilityChanged(id, available);  // Emit event for availability change
    }

    // Get book details by ID
    function getBook(uint id) public view returns (Book memory) {
        require(books[id].id != 0, "Book does not exist");  // Check if book exists
        return books[id];  // Return book structure
    }
}
