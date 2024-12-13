import express from "express";
import {
  getBookRequests,
  addBookRequest,
  approveBookRequest,
  rejectBookRequest,
} from "../controllers/bookRequestController";
import {
  searchBooks,
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/booksController";
import { uploadBook } from "../middleware/uploadMiddleware";

const router = express.Router();

router.get("/search-books", searchBooks);

router.get("/pending-books", getBookRequests);
router.post("/pending-books", uploadBook, addBookRequest);
router.post("/pending-books/:id/approve", approveBookRequest);
router.delete("/pending-books/:id/reject", rejectBookRequest);

router.get("/", getBooks);
router.get("/:id", getBookById);
router.post("/", uploadBook, createBook);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);

export default router;
