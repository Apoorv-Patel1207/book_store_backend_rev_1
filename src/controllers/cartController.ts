import { Request, Response } from "express";
import { readCartFromFile, writeCartToFile } from "../utils/db";
import { CartItem } from "../models/cart";

// Get cart items for a specific user
export const getCartItems = (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).send("User ID is required");
  }

  const cart = readCartFromFile();
  const userCart = cart.filter((item) => item.userId === userId);
  res.json(userCart);
};

// Add an item to the user's cart
export const addToCart = (req: Request, res: Response) => {
  const userId = req.header("x-user-id") || "0";
  if (!userId) {
    res.status(400).send("User ID is required");
  }

  const cart = readCartFromFile();
  const newItem: CartItem = req.body;
  newItem.userId = userId; // Associate item with user
  newItem.quantity = newItem.quantity || 1;

  const existingItem = cart.find(
    (item) => item.userId === userId && item.id === newItem.id
  );
  if (existingItem) {
    existingItem.quantity += newItem.quantity;
  } else {
    cart.push(newItem);
  }

  writeCartToFile(cart);
  res.status(201).json(cart.filter((item) => item.userId === userId));
};

// Remove an item from the user's cart
export const removeFromCart = (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const itemId = req.params.id;

  const cart = readCartFromFile();
  const itemIndex = cart.findIndex(
    (item) => item.userId === userId && item.id === itemId
  );

  if (itemIndex !== -1) {
    const removedItem = cart.splice(itemIndex, 1);
    writeCartToFile(cart);
    res.json(removedItem);
  } else {
    res.status(404).send("Item not found in cart");
  }
};

// Clear the cart for a specific user
export const clearCart = (req: Request, res: Response) => {
  const userId = req.header("x-user-id");
  const cart = readCartFromFile();
  const updatedCart = cart.filter((item) => item.userId !== userId); // Remove all items for user

  writeCartToFile(updatedCart);
  res.sendStatus(204);
};

// Update the quantity of a specific item in the user's cart
export const updateCartQuantity = (req: Request, res: Response): void => {
  const userId = req.header("x-user-id");
  const itemId = req.params.id;
  const { quantity } = req.body;

  if (quantity <= 0) {
    res.status(400).send("Quantity must be greater than zero");
    return;
  }

  const cart = readCartFromFile();
  const item = cart.find(
    (item) => item.userId === userId && item.id === itemId
  );

  if (item) {
    item.quantity = quantity;
    writeCartToFile(cart);
    res.json(item);
  } else {
    res.status(404).send("Item not found in cart");
  }
};
