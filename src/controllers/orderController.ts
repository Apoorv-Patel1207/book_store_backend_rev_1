import { Request, Response } from "express";
const pool = require("../postgre_db/db");

export const createOrder = async (req: Request, res: Response) => {
  const { items, orderDate, status, total_amount, userProfile } = req.body;
  const userId = req.header("x-user-id");

  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Check stock availability
      const insufficientStockBooks: any[] = [];
      for (const item of items) {
        const bookResult = await client.query(
          "SELECT stock_quantity FROM books WHERE id = $1",
          [item.id]
        );

        if (
          bookResult.rows.length === 0 ||
          bookResult.rows[0].stock_quantity < item.quantity
        ) {
          insufficientStockBooks.push(item);
        }
      }

      if (insufficientStockBooks.length > 0) {
        await client.query("ROLLBACK");
        res.status(400).json({
          message: "Insufficient stock for some items",
          insufficientStockBooks,
        });
        return;
      }

      // Deduct stock quantities and create the order
      for (const item of items) {
        await client.query(
          "UPDATE books SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.id]
        );
      }

      const newOrderResult = await client.query(
        `INSERT INTO orders (order_id, user_id, total_amount, order_date, status, user_name, user_email, user_phone, user_address, items) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          Date.now(),
          userId,
          total_amount,
          new Date().toISOString().split("T")[0],
          "Processing",
          userProfile.name,
          userProfile.email,
          userProfile.phone,
          userProfile.address,
          JSON.stringify(items),
        ]
      );

      await client.query("COMMIT");
      res.status(201).json(newOrderResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");

  try {
    const result = await pool.query("SELECT * FROM orders WHERE user_id = $1", [
      userId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const orderId = parseInt(req.params.id);

  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 AND order_id = $2",
      [userId, orderId]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send("Order not found");
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const orderId = parseInt(req.params.id);

  try {
    const result = await pool.query(
      "DELETE FROM orders WHERE user_id = $1 AND order_id = $2 RETURNING *",
      [userId, orderId]
    );

    if (result.rows.length > 0) {
      res.status(204).send();
    } else {
      res.status(404).send("Order not found");
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const orderId = parseInt(req.params.id);
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE user_id = $2 AND order_id = $3 RETURNING *`,
      [status, userId, orderId]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send("Order not found");
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
