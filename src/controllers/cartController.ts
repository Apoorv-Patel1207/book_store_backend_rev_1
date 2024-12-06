import { Request, Response } from "express";
const pool = require("../postgre_db/db");

export const getCartItems = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).send("User ID is required");
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        *
      FROM cart 
      JOIN books ON cart.book_id = books.book_id 
      WHERE cart.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const { book_id, quantity } = req.body;

  if (!userId || !book_id) {
    res.status(400).send("User ID and Book ID are required");
    return;
  }

  try {
    const checkResult = await pool.query(
      `SELECT * FROM cart WHERE book_id = $1 AND user_id = $2`,
      [book_id, userId]
    );

    if (checkResult.rows.length > 0) {
      const result = await pool.query(
        `UPDATE cart 
         SET quantity = quantity + $1
         WHERE book_id = $2 AND user_id = $3 
         RETURNING *`,
        [quantity || 1, book_id, userId]
      );
      res.status(200).json(result.rows[0]);
    } else {
      const result = await pool.query(
        `INSERT INTO cart (book_id, user_id, quantity) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [book_id, userId, quantity || 1]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error("Error adding book to the cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const book_id = req.params.id;

  if (!userId || !book_id) {
    res.status(400).send("User ID and Book ID are required");
    return;
  }

  try {
    const result = await pool.query(
      `DELETE FROM cart WHERE book_id = $1 AND user_id = $2 RETURNING *`,
      [book_id, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).send("Item not found in cart");
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error removing book:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");

  if (!userId) {
    res.status(400).send("User ID is required");
    return;
  }

  try {
    await pool.query(`DELETE FROM cart WHERE user_id = $1`, [userId]);
    res.status(200).json({
      message: "Cart cleared successfully",
      userId: userId,
    });
  } catch (error) {
    console.error("Error clearing the cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateCartQuantity = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const book_id = req.params.id;
  const { quantity } = req.body;

  if (!userId || !book_id || quantity === undefined) {
    res.status(400).send("User ID, Book ID, and quantity are required");
    return;
  }

  if (quantity <= 0) {
    res.status(400).send("Quantity must be greater than zero");
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE cart 
       SET quantity = $1 
       WHERE book_id = $2 AND user_id = $3 
       RETURNING *`,
      [quantity, book_id, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).send("Item not found in cart");
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating book quantity:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
