import { Request, Response } from "express";
import { readUsersFromFile, writeUsersToFile } from "../utils/db";
import { User } from "../models/user";

// Get user profile
export const getUserProfile = (req: Request, res: Response): void => {
  const userId = req.header("x-user-id"); // Expecting Auth0's user ID
  const users = readUsersFromFile();
  const user = users.find((u) => u.userId === userId);

  if (user) {
    res.json(user);
  } else {
    res.status(404).send("User not found");
  }
};

// Create or update user profile
export const createOrUpdateUser = (req: Request, res: Response): void => {
  const userId = req.header("x-user-id");
  const users = readUsersFromFile();
  const existingUserIndex = users.findIndex((u) => u.userId === userId);

  if (existingUserIndex !== -1) {
    // Update existing user
    users[existingUserIndex] = { ...users[existingUserIndex], ...req.body };
    writeUsersToFile(users);
    res.status(200).json(users[existingUserIndex]); // Respond with the updated user
  } else {
    // Create new user
    const newUser: User = {
      userId: userId as string, // Auth0 user ID
      ...req.body,
      createdAt: new Date().toISOString(),
      role: "customer",
    };
    users.push(newUser);
    writeUsersToFile(users);
    res.status(201).json(newUser); // Respond with the newly created user
  }
};

// Update user role
export const updateUserRole = (req: Request, res: Response): void => {
  const userId = req.params.id;
  const { role } = req.body;
  const users = readUsersFromFile();

  const user = users.find((u) => u.userId === userId);
  if (!user) {
    res.status(404).send("User not found");
    return;
  }

  user.role = role;
  writeUsersToFile(users);
  res.json(user);
};

// Update user profile details
export const updateUserProfile = (req: Request, res: Response): void => {
  const userId = req.params.id;
  const users = readUsersFromFile();

  const user = users.find((u) => u.userId === userId);
  if (!user) {
    res.status(404).send("User not found");
    return;
  }

  Object.assign(user, req.body); // Update fields as provided in the request body
  writeUsersToFile(users);
  res.json(user);
};
