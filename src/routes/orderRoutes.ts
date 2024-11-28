import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  deleteOrder,
  updateOrderStatus,
} from "../controllers/orderController";

const router = express.Router();

router.post("/", createOrder); // Create a new order
router.get("/", getOrders); // Get all orders
router.get("/:id", getOrderById); // Get a specific order by ID
router.delete("/:id", deleteOrder); // Delete an order by ID
router.put("/:id", updateOrderStatus);

export default router;
