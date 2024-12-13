import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { uploadImageToS3 } from "../services/s3-service";
const pool = require("../postgre_db/db");

export const getBookRequests = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM book_requests");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching pending books:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addBookRequest = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const {
    title,
    author,
    genre,
    price,
    stockQuantity,
    ISBN,
    publisher,
    pages,
    language,
    publicationDate,
    description,
  } = req.body;

  try {
    const coverImage = req.file;
    let coverImageUrl = "";

    if (coverImage) {
      coverImageUrl = await uploadImageToS3(coverImage, "books_cover_img");
    }

    const result = await pool.query(
      `INSERT INTO book_requests 
      (book_id, title, author, genre, price, stock_quantity, ISBN, publisher, pages, language, publication_date, description, cover_image, status, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `,
      [
        uuidv4(),
        title,
        author,
        genre,
        price,
        stockQuantity,
        ISBN,
        publisher,
        pages,
        language,
        publicationDate,
        description,
        coverImageUrl,
        "pending",
        userId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding book request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const approveBookRequest = async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;

    const pendingBookQuery = `SELECT * FROM book_requests WHERE book_id = $1 AND status = $2`;
    const pendingBookResult = await pool.query(pendingBookQuery, [
      bookId,
      "pending",
    ]);

    if (pendingBookResult.rowCount === 0) {
      res
        .status(404)
        .json({ message: "Pending book not found or already processed" });

      return;
    }

    const pendingBook = pendingBookResult.rows[0];

    const insertBookQuery = `
      INSERT INTO books 
      (book_id, title, author, genre, price, stock_quantity, ISBN, publisher, pages, language, publication_date, description, cover_image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    await pool.query(insertBookQuery, [
      pendingBook.book_id,
      pendingBook.title,
      pendingBook.author,
      pendingBook.genre,
      pendingBook.price,
      pendingBook.stock_quantity,
      pendingBook.ISBN,
      pendingBook.publisher,
      pendingBook.pages,
      pendingBook.language,
      pendingBook.publication_date,
      pendingBook.description,
      pendingBook.cover_image,
    ]);

    const updatePendingBookQuery = `UPDATE book_requests SET status = $1 WHERE book_id = $2 RETURNING *`;
    const updateResult = await pool.query(updatePendingBookQuery, [
      "approved",
      bookId,
    ]);

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Error approving book:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const rejectBookRequest = async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;

    const query = `
      UPDATE book_requests
      SET status = $1
      WHERE book_id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, ["rejected", bookId]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Book request not found" });
    } else {
      res.json({ message: "Book request rejected", book: result.rows[0] });
    }
  } catch (error) {
    console.error("Error rejecting book request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
