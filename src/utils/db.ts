import fs from "fs";
import path from "path";
import { Book } from "../models/book";
import { CartItem } from "../models/cart";
import { Order } from "../models/order";
import { User } from "../models/user";

const BOOKS_PATH = path.join(__dirname, "..", "data", "books.json");
const CART_PATH = path.join(__dirname, "..", "data", "cart.json");
const ORDERS_Path = path.join(__dirname, "..", "data", "orders.json");
const USERS_PATH = path.join(__dirname, "..", "data", "users.json");
// const USERS_PATH = path.join(__dirname, "../data/users.json");

const PENDING_BOOKS_PATH = path.join(
  __dirname,
  "..",
  "data",
  "pendingBooks.json"
);

// const pendingBooksFilePath = path.join(__dirname, "../data/pendingBooks.json");

export const readUsersFromFile = (): User[] => {
  const data = fs.readFileSync(USERS_PATH, "utf-8");
  return JSON.parse(data) as User[];
};

export const writeUsersToFile = (users: User[]): void => {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), "utf-8");
};

export const readBooksFromFile = (): Book[] => {
  const data = fs.readFileSync(BOOKS_PATH, "utf8");
  return JSON.parse(data);
};

export const writeBooksToFile = (books: Book[]) => {
  fs.writeFileSync(BOOKS_PATH, JSON.stringify(books, null, 2));
};

export const readCartFromFile = (): CartItem[] => {
  const data = fs.existsSync(CART_PATH)
    ? fs.readFileSync(CART_PATH, "utf8")
    : "[]";
  return JSON.parse(data);
};

export const writeCartToFile = (cart: CartItem[]) => {
  fs.writeFileSync(CART_PATH, JSON.stringify(cart, null, 2));
};

export const readOrdersFromFile = (): Order[] => {
  const data = fs.readFileSync(ORDERS_Path, "utf-8");
  return JSON.parse(data);
};

export const writeOrdersToFile = (orders: Order[]) => {
  fs.writeFileSync(ORDERS_Path, JSON.stringify(orders, null, 2));
};

// Read pending books from file
export const readPendingBooksFromFile = (): Book[] => {
  const data = fs.readFileSync(PENDING_BOOKS_PATH, "utf-8");
  return JSON.parse(data) as Book[];
};

// Write pending books to file
export const writePendingBooksToFile = (pendingBooks: Book[]): void => {
  fs.writeFileSync(
    PENDING_BOOKS_PATH,
    JSON.stringify(pendingBooks, null, 2),
    "utf-8"
  );
};
