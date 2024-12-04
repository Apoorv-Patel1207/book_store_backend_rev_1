import { Request, Response } from "express";
const pool = require("../postgre_db/db");

// Get user profile
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.header("x-user-id"); // Expecting Auth0's user ID
    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      userId,
    ]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create or update user profile
export const createOrUpdateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.header("x-user-id");

  const { name, email } = req.body;

  try {
    const existingUserResult = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (existingUserResult.rows.length > 0) {
      // Update existing user
      const updatedUser = await pool.query(
        `UPDATE users SET name = $1, email = $2, updated_at = NOW()
         WHERE user_id = $3 RETURNING *`,
        [name, email, userId]
      );
      res.status(200).json(updatedUser.rows[0]);
    } else {
      // Create new user
      const newUser = await pool.query(
        `INSERT INTO users (user_id, name, email, role, created_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [userId, name, email, "customer"]
      );
      res.status(201).json(newUser.rows[0]);
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update user profile details
export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;
  const { name, email, address, dob, gender, phone, profileImage } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      userId,
    ]);

    if (result.rows.length > 0) {
      const updatedUser = await pool.query(
        `UPDATE users SET name = $1, email = $2, address = $3, dob = $4, gender = $5, phone = $6, profile_image = $7, updated_at = NOW()
         WHERE user_id = $8 RETURNING *`,
        [name, email, address, dob, gender, phone, profileImage, userId]
      );
      res.json(updatedUser.rows[0]);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update user role
export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;
  const { role } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      userId,
    ]);

    if (result.rows.length > 0) {
      const updatedUser = await pool.query(
        "UPDATE users SET role = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *",
        [role, userId]
      );
      res.json(updatedUser.rows[0]);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
