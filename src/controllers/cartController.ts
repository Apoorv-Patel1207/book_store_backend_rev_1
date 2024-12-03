// import { Request, Response } from "express";
// import { readCartFromFile, writeCartToFile } from "../utils/pool";
// import { CartItem } from "../models/cart";

// // Get cart items for a specific user
// export const getCartItems = (req: Request, res: Response) => {
//   const userId = req.header("x-user-id");
//   if (!userId) {
//     res.status(400).send("User ID is required");
//   }

//   const cart = readCartFromFile();
//   const userCart = cart.filter((item) => item.userId === userId);
//   res.json(userCart);
// };

// // Add an item to the user's cart
// export const addToCart = (req: Request, res: Response) => {
//   const userId = req.header("x-user-id") || "0";
//   if (!userId) {
//     res.status(400).send("User ID is required");
//   }

//   const cart = readCartFromFile();
//   const newItem: CartItem = req.body;
//   newItem.userId = userId; // Associate item with user
//   newItem.quantity = newItem.quantity || 1;

//   const existingItem = cart.find(
//     (item) => item.userId === userId && item.id === newItem.id
//   );
//   if (existingItem) {
//     existingItem.quantity += newItem.quantity;
//   } else {
//     cart.push(newItem);
//   }

//   writeCartToFile(cart);
//   res.status(201).json(cart.filter((item) => item.userId === userId));
// };

// // Remove an item from the user's cart
// export const removeFromCart = (req: Request, res: Response) => {
//   const userId = req.header("x-user-id");
//   const itemId = req.params.id;

//   const cart = readCartFromFile();
//   const itemIndex = cart.findIndex(
//     (item) => item.userId === userId && item.id === itemId
//   );

//   if (itemIndex !== -1) {
//     const removedItem = cart.splice(itemIndex, 1);
//     writeCartToFile(cart);
//     res.json(removedItem);
//   } else {
//     res.status(404).send("Item not found in cart");
//   }
// };

// // Clear the cart for a specific user
// export const clearCart = (req: Request, res: Response) => {
//   const userId = req.header("x-user-id");
//   const cart = readCartFromFile();
//   const updatedCart = cart.filter((item) => item.userId !== userId); // Remove all items for user

//   writeCartToFile(updatedCart);
//   res.sendStatus(204);
// };

// // Update the quantity of a specific item in the user's cart
// export const updateCartQuantity = (req: Request, res: Response): void => {
//   const userId = req.header("x-user-id");
//   const itemId = req.params.id;
//   const { quantity } = req.body;

//   if (quantity <= 0) {
//     res.status(400).send("Quantity must be greater than zero");
//     return;
//   }

//   const cart = readCartFromFile();
//   const item = cart.find(
//     (item) => item.userId === userId && item.id === itemId
//   );

//   if (item) {
//     item.quantity = quantity;
//     writeCartToFile(cart);
//     res.json(item);
//   } else {
//     res.status(404).send("Item not found in cart");
//   }
// };

import { Request, Response } from "express";
const pool = require("../postgre_db/db");

// Get cart items for a specific user
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
    // Check if the item already exists in the cart using user_id and book_id
    const checkResult = await pool.query(
      `SELECT * FROM cart WHERE book_id = $1 AND user_id = $2`,
      [book_id, userId]
    );

    if (checkResult.rows.length > 0) {
      // Update the existing item
      const result = await pool.query(
        `UPDATE cart 
         SET quantity = quantity + $1
         WHERE book_id = $2 AND user_id = $3 
         RETURNING *`,
        [quantity || 1, book_id, userId]
      );
      res.status(200).json(result.rows[0]);
    } else {
      // Insert a new item into the cart
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
