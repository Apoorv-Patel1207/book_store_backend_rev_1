import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
const pool = require("../postgre_db/db");
import { deleteImageFromS3, uploadImageToS3 } from "../services/s3-service"; // Updated to .ts

export const getBooks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchQuery = (req.query.searchQuery as string) || "";
    const filterGenre = (req.query.filterGenre as string) || "all";
    const priceMin = parseFloat(req.query.priceMin as string) || 0;
    const priceMax = parseFloat(req.query.priceMax as string) || 1000;

    let query = `SELECT * FROM books WHERE price BETWEEN $1 AND $2`;
    const queryParams: any[] = [priceMin, priceMax];

    if (filterGenre !== "all") {
      query += ` AND genre = $3`;
      queryParams.push(filterGenre);
    }

    if (searchQuery) {
      query += ` AND (LOWER(title) LIKE $${
        queryParams.length + 1
      } OR LOWER(author) LIKE $${queryParams.length + 1})`;
      queryParams.push(`%${searchQuery.toLowerCase()}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_books`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);

    const currentPage = Math.min(page, totalPages) || 1;

    query += ` LIMIT $${queryParams.length + 1} OFFSET $${
      queryParams.length + 2
    }`;
    queryParams.push(limit, (currentPage - 1) * limit);

    const result = await pool.query(query, queryParams);

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

// export const createBook = async (req: Request, res: Response) => {
//   const userId = req.header("x-user-id");

//   const {
//     ISBN,
//     author,
//     description,
//     genre,
//     language,
//     pages,
//     price,
//     publicationDate,
//     publisher,
//     stockQuantity,
//     title,
//   } = req.body;

//   const coverImagePath = req.file?.path;
//   console.log("req.file:", req.file);

//   try {
//     const newBook = await pool.query(
//       `INSERT INTO books (book_id, title, author, genre, price, cover_image, description, publication_date, isbn, language, pages, publisher, stock_quantity, user_id)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
//       [
//         uuidv4(),
//         title,
//         author,
//         genre,
//         price,
//         coverImagePath,
//         description,
//         publicationDate,
//         ISBN,
//         language,
//         pages,
//         publisher,
//         stockQuantity,
//         userId,
//       ]
//     );

//     res.status(201).json(newBook.rows[0]);
//   } catch (error) {
//     console.error("Error creating book:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

export const createBook = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id"); // Retrieve user ID from the header

  const {
    ISBN,
    author,
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
    const coverImage = req.file;
    let coverImageUrl = "";

    if (coverImage) {
      coverImageUrl = await uploadImageToS3(coverImage);
    }

    const newBook = await pool.query(
      `INSERT INTO books (book_id, title, author, genre, price, cover_image, description, publication_date, isbn, language, pages, publisher, stock_quantity, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        uuidv4(),
        title,
        author,
        genre,
        price,
        coverImageUrl,
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

// export const deleteBook = async (req: Request, res: Response) => {
//   try {
//     const deletedBook = await pool.query(
//       "DELETE FROM books WHERE book_id = $1 RETURNING *",
//       [req.params.id]
//     );
//     if (deletedBook.rows.length > 0) {
//       res.json(deletedBook.rows[0]);
//     } else {
//       res.status(404).send("Book not found");
//     }
//   } catch (error) {
//     console.error("Error deleting book:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const bookQuery = await pool.query(
      "SELECT * FROM books WHERE book_id = $1",
      [req.params.id]
    );

    if (bookQuery.rows.length === 0) {
      res.status(404).send("Book not found");
      return;
    }

    const coverImageUrl = bookQuery.rows[0].cover_image;
    const imageKey = coverImageUrl.split("/").pop();

    if (imageKey) {
      await deleteImageFromS3(imageKey);
    }

    const deletedBook = await pool.query(
      "DELETE FROM books WHERE book_id = $1 RETURNING *",
      [req.params.id]
    );

    res.json(deletedBook.rows[0]);
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
