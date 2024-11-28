import express from "express";
import {
  getCartItems,
  addToCart,
  removeFromCart,
  clearCart,
  updateCartQuantity,
} from "../controllers/cartController";

const router = express.Router();

router.get("/", getCartItems);
router.post("/add", addToCart);
router.delete("/remove/:id", removeFromCart);
router.delete("/clear", clearCart);
router.put("/update/:id", updateCartQuantity); 

export default router;
