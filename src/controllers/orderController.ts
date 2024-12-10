import { Request, Response } from "express";
const pool = require("../postgre_db/db");

export const createOrder = async (req: Request, res: Response) => {
  const {
    items,
    total_amount,
    recipient_name,
    recipient_phone,
    shipping_address,
  } = req.body;
  const userId = req.header("x-user-id");

  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const insufficientStockBooks: any[] = [];
      for (const item of items) {
        const bookResult = await client.query(
          "SELECT stock_quantity FROM books WHERE book_id = $1",
          [item.book_id]
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

      for (const item of items) {
        await client.query(
          "UPDATE books SET stock_quantity = stock_quantity - $1 WHERE book_id = $2",
          [item.quantity, item.book_id]
        );
      }

      const newOrderResult = await client.query(
        `INSERT INTO orders ( user_id, order_amount, order_date, status, recipient_name, recipient_phone, shipping_address) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING order_id`,
        [
          userId,
          total_amount,
          new Date().toISOString().split("T")[0],
          "Processing",
          recipient_name,
          recipient_phone,
          shipping_address,
        ]
      );

      const orderId = newOrderResult.rows[0].order_id;

      for (const item of items) {
        await client.query(
          `INSERT INTO purchase_items (order_id, book_id, title, author, price, cover_image,  
           quantity, user_id, amount) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            orderId,
            item.book_id,
            item.title,
            item.author,
            item.price,
            item.cover_image,
            item.quantity,
            userId,
            item.price * item.quantity,
          ]
        );
      }

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
    const ordersResult = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const orders = await Promise.all(
      ordersResult.rows.map(async (order: { order_id: string }) => {
        const itemsResult = await pool.query(
          "SELECT * FROM purchase_items WHERE order_id = $1",
          [order.order_id]
        );
        return { ...order, items: itemsResult.rows };
      })
    );

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const orderId = req.params.id;

  try {
    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 AND order_id = $2",
      [userId, orderId]
    );

    if (orderResult.rows.length > 0) {
      const itemsResult = await pool.query(
        "SELECT * FROM purchase_items WHERE order_id = $1",
        [orderId]
      );
      res.json({ ...orderResult.rows[0], items: itemsResult.rows });
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
  const orderId = req.params.id;

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
  const orderId = req.params.id;
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
