import { Request, Response } from "express";
import { uploadImageToS3 } from "../services/s3-service";
const pool = require("../postgre_db/db");

export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.header("x-user-id");
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

export const createOrUpdateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.header("x-user-id");

  const { name, email, profileImage } = req.body;

  try {
    const existingUserResult = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (existingUserResult.rows.length > 0) {
      const updatedUser = await pool.query(
        `UPDATE users SET name = $1, email = $2, updated_at = NOW()
         WHERE user_id = $3 RETURNING *`,
        [name, email, userId]
      );
      res.status(200).json(updatedUser.rows[0]);
    } else {
      const newUser = await pool.query(
        `INSERT INTO users (user_id, name, email, profile_image, role, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
        [userId, name, email, profileImage, "customer"]
      );
      res.status(201).json(newUser.rows[0]);
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;
  const { name, email, address, dob, gender, phone } = req.body;

  try {
    const profileImage = req.file;

    const currentUser = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (currentUser.rows.length === 0) {
      res.status(404).send("User not found");
      return;
    }

    let query = `UPDATE users SET name = $1, email = $2, address = $3, dob = $4, gender = $5, phone = $6, updated_at = NOW() WHERE user_id = $7 RETURNING *`;
    let params = [name, email, address, dob, gender, phone, userId];

    if (profileImage) {
      const profileImageUrl = await uploadImageToS3(
        profileImage,
        "user_profile_img"
      );

      await pool.query(
        `UPDATE user_profile_images SET isCurrentProfile = false 
         WHERE user_id = $1 AND isCurrentProfile = true`,
        [userId]
      );

      await pool.query(
        `INSERT INTO user_profile_images (user_id, profile_image, isCurrentProfile, uploaded_at)
         VALUES ($1, $2, true, NOW())`,
        [userId, profileImageUrl]
      );

      query = `UPDATE users SET name = $1, email = $2, address = $3, dob = $4, gender = $5, phone = $6, profile_image = $7, updated_at = NOW() WHERE user_id = $8 RETURNING *`;
      params = [
        name,
        email,
        address,
        dob,
        gender,
        phone,
        profileImageUrl,
        userId,
      ];
    }

    const updatedUser = await pool.query(query, params);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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
