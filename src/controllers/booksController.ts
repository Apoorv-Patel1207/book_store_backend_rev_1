import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
const pool = require("../postgre_db/db");

export const getBooks = async (req: Request, res: Response) => {
  try {
    // Extract query parameters for filtering and searching
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchQuery = (req.query.searchQuery as string) || "";
    const filterGenre = (req.query.filterGenre as string) || "all";
    const priceMin = parseFloat(req.query.priceMin as string) || 0;
    const priceMax = parseFloat(req.query.priceMax as string) || 1000;

    // Base query
    let query = `SELECT * FROM books WHERE price BETWEEN $1 AND $2`;
    const queryParams: any[] = [priceMin, priceMax];

    // Add genre filter if applicable
    if (filterGenre !== "all") {
      query += ` AND genre = $3`;
      queryParams.push(filterGenre);
    }

    // Add search filter for title or author
    if (searchQuery) {
      query += ` AND (LOWER(title) LIKE $${
        queryParams.length + 1
      } OR LOWER(author) LIKE $${queryParams.length + 1})`;
      queryParams.push(`%${searchQuery.toLowerCase()}%`);
    }

    // Count the total filtered books for pagination metadata
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_books`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);

    // Ensure the page is within valid bounds
    const currentPage = Math.min(page, totalPages) || 1; // Clamp to total pages

    // Apply pagination
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${
      queryParams.length + 2
    }`;
    queryParams.push(limit, (currentPage - 1) * limit);

    // Fetch paginated books
    const result = await pool.query(query, queryParams);

    // Send the response with books and pagination metadata
    res.json({
      books: result.rows,
      pagination: {
        totalCount,
        totalPages,
        currentPage,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getBookById = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM books WHERE book_id = $1", [
      req.params.id,
    ]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send("Book not found");
    }
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createBook = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");

  const {
    ISBN,
    author,
    coverImage,
    description,
    genre,
    language,
    pages,
    price,
    publicationDate,
    publisher,
    stockQuantity,
    title,
  } = req.body;
  try {
    const newBook = await pool.query(
      `INSERT INTO books (book_id, title, author, genre, price, cover_image, description, publication_date, isbn, language, pages,publisher, stock_quantity, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        uuidv4(),
        title,
        author,
        genre,
        price,
        coverImage,
        description,
        publicationDate,
        ISBN,
        language,
        pages,
        publisher,
        stockQuantity,
        userId,
      ]
    );
    res.status(201).json(newBook.rows[0]);
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  const { price, stock_quantity } = req.body;
  try {
    const updatedBook = await pool.query(
      `UPDATE books SET
       price = COALESCE($1, price),
       stock_quantity = COALESCE($2, stock_quantity)
       WHERE book_id = $3 RETURNING *`,
      [price, stock_quantity, req.params.id]
    );
    if (updatedBook.rows.length > 0) {
      res.json(updatedBook.rows[0]);
    } else {
      res.status(404).send("Book not found");
    }
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const deletedBook = await pool.query(
      "DELETE FROM books WHERE book_id = $1 RETURNING *",
      [req.params.id]
    );
    if (deletedBook.rows.length > 0) {
      res.json(deletedBook.rows[0]);
    } else {
      res.status(404).send("Book not found");
    }
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const searchBooks = async (req: Request, res: Response) => {
  const searchQuery = (req.query.searchQuery as string) || "";
  try {
    const result = await pool.query(
      `SELECT * FROM books 
       WHERE LOWER(title) LIKE $1 OR LOWER(author) LIKE $1`,
      [`%${searchQuery.toLowerCase()}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error searching books:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
