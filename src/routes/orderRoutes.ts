import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  deleteOrder,
  updateOrderStatus,
} from "../controllers/orderController";

const router = express.Router();

router.post("/", createOrder); 
router.get("/", getOrders); 
router.get("/:id", getOrderById); 
router.delete("/:id", deleteOrder); 
router.put("/:id", updateOrderStatus);

export default router;
