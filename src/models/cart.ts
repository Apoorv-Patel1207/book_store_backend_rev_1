import { Book } from "./book";

export interface CartItem extends Book {
  userId: string;
  quantity: number;
}
