import express from "express";
import {
  getBooks,
  getBookById,
  createBook,
  deleteBook,
  searchBooks,
  approveBook,
  getPendingBooks,
  rejectBook,
  addPendingBook,
  updateBook,
} from "../controllers/booksController";

const router = express.Router();

router.get("/search-books", searchBooks);

router.get("/pending-books", getPendingBooks);
router.post("/pending-books", addPendingBook);
router.post("/pending-books/:id/approve", approveBook);
router.delete("/pending-books/:id/reject", rejectBook);

router.get("/", getBooks);
router.get("/:id", getBookById);
router.post("/", createBook);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);

export default router;
