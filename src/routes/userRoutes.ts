import express from "express";
import {
  getUserProfile,
  createOrUpdateUser,
  updateUserRole,
  updateUserProfile,
} from "../controllers/userController";

const userRouter = express.Router();

// Route for getting user profile
userRouter.get("/profile", getUserProfile);

// Route for creating or updating user profile
userRouter.post("/profile", createOrUpdateUser);

// Route for updating user role (admin only)
userRouter.put("/profile/role/:id", updateUserRole);

// Route for updating user profile details
userRouter.put("/profile/:id", updateUserProfile);

export default userRouter;
