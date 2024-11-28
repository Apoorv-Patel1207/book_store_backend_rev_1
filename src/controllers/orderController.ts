import { Request, Response } from "express";
import {
  readBooksFromFile,
  readOrdersFromFile,
  writeBooksToFile,
  writeOrdersToFile,
} from "../utils/db";
import { Order } from "../models/order";
import { Book } from "../models/book";

export const createOrder = (req: Request, res: Response) => {
  const orders: Order[] = readOrdersFromFile();
  const books: Book[] = readBooksFromFile();
  const newOrder: Order = req.body;

  newOrder.userId = req.header("x-user-id") || "0";
  newOrder.orderId = Date.now();
  newOrder.orderDate = new Date().toISOString().split("T")[0];
  newOrder.status = "Processing";

  // Check stock availability and update stock quantities
  const insufficientStockBooks = newOrder.items.filter((orderItem) => {
    const book = books.find((b) => b.id === orderItem.id);
    return book && book.stockQuantity < orderItem.quantity;
  });

  if (insufficientStockBooks.length > 0) {
    // If any books have insufficient stock, return an error response
    res.status(400).json({
      message: "Insufficient stock for some items",
      insufficientStockBooks,
    });
    return;
  }

  // Deduct stock quantities for each book in the order
  newOrder.items.forEach((orderItem) => {
    const book = books.find((b) => b.id === orderItem.id);
    if (book) {
      book.stockQuantity -= orderItem.quantity;
    }
  });

  // Save the updated books and orders
  writeBooksToFile(books);
  orders.push(newOrder);
  writeOrdersToFile(orders);

  res.status(201).json(newOrder);
};

export const getOrders = (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).send("User ID is required");
  }

  const orders = readOrdersFromFile();

  const userOrders = orders.filter((order) => order.userId === userId);

  res.json(userOrders);
};

export const getOrderById = (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const orderId = parseInt(req.params.id);
  const orders = readOrdersFromFile();

  // const order = orders.find((o) => o.orderId === parseInt(req.params.id));
  const order = orders.find(
    (o) => o.userId === userId && o.orderId === orderId
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404).send("Order not found");
  }
};

export const deleteOrder = (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const orderId = parseInt(req.params.id);
  const orders = readOrdersFromFile();

  const orderIndex = orders.findIndex(
    (o) => o.userId === userId && o.orderId === orderId
  );

  if (orderIndex !== -1) {
    orders.splice(orderIndex, 1);
    writeOrdersToFile(orders);
    res.status(204).send();
  } else {
    res.status(404).send("Order not found");
  }
};

// Update the status of an order
export const updateOrderStatus = (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const orders: Order[] = readOrdersFromFile();
  const orderId = parseInt(req.params.id);
  const { status } = req.body;

  const order = orders.find(
    (o) => o.userId === userId && o.orderId === orderId
  );

  if (order) {
    order.status = status;
    writeOrdersToFile(orders);
    res.json(order);
  } else {
    res.status(404).send("Order not found");
  }
};
