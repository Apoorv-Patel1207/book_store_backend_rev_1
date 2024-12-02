export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  price: number;
  coverImage: string;
  description: string;
  publicationDate: string;
  ISBN: string;
  language: string;
  pages: number;
  publisher: string;
  stockQuantity: number;
  status?: "pending" | "approved" | "rejected";
}
