import { CartItem } from "./cart";

export interface ShippingAddress {
  recipientName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  orderId: number;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  orderDate: string;
  status: "Shipped" | "Delivered" | "Processing";
  shippingAddress: ShippingAddress;
}