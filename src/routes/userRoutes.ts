import express from "express";
import {
  getUserProfile,
  createOrUpdateUser,
  updateUserRole,
  updateUserProfile,
} from "../controllers/userController";
import { uploadUser } from "../middleware/uploadMiddleware";

const userRouter = express.Router();

userRouter.get("/profile", getUserProfile);
userRouter.post("/profile", createOrUpdateUser);
userRouter.put("/profile/role/:id", updateUserRole);
userRouter.put("/profile/:id", uploadUser, updateUserProfile);

export default userRouter;
