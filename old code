const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;
const DATA_PATH = path.join(__dirname, "data", "books.json");

app.use(cors());
app.use(bodyParser.json());

const readBooksFromFile = () => {
  const data = fs.readFileSync(DATA_PATH, "utf8");
  return JSON.parse(data);
};

const writeBooksToFile = (books) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(books, null, 2));
};

// app.get("/books", (req, res) => {
//   const books = readBooksFromFile();
//   res.json(books);
// });

app.get("/books", (req, res) => {
  const books = readBooksFromFile();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedBooks = books.slice(startIndex, endIndex);

  res.json(paginatedBooks);
});

app.get("/books/:id", (req, res) => {
  const books = readBooksFromFile();
  const book = books.find((b) => b.id === parseInt(req.params.id));
  if (book) {
    res.json(book);
  } else {
    res.status(404).send("Book not found");
  }
});

app.post("/books", (req, res) => {
  const books = readBooksFromFile();
  const newBook = {
    id: books.length ? books[books.length - 1].id + 1 : 1,
    ...req.body,
  };
  books.push(newBook);
  writeBooksToFile(books);
  res.status(201).json(newBook);
});

app.delete("/books/:id", (req, res) => {
  const books = readBooksFromFile();
  const bookIndex = books.findIndex((b) => b.id === parseInt(req.params.id));
  if (bookIndex !== -1) {
    const [deletedBook] = books.splice(bookIndex, 1);
    writeBooksToFile(books);
    res.json(deletedBook);
  } else {
    res.status(404).send("Book not found");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
