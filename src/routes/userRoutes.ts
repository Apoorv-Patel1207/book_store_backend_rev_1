import express from "express";
import {
  getUserProfile,
  createOrUpdateUser,
  updateUserRole,
  updateUserProfile,
} from "../controllers/userController";

const userRouter = express.Router();

userRouter.get("/profile", getUserProfile);
userRouter.post("/profile", createOrUpdateUser);
userRouter.put("/profile/role/:id", updateUserRole);
userRouter.put("/profile/:id", updateUserProfile);

export default userRouter;
