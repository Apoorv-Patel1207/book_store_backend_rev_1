import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid"; // Optional, for generating unique filenames
import path from "path";

import dotenv from "dotenv";
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadImageToS3 = async (
  file: Express.Multer.File,
  folder?: string
) => {
  try {
    const fileName = `${folder ? `${folder}/` : ""}${uuidv4()}${path.extname(
      file.originalname
    )}`;

    const uploadParams: PutObjectCommandInput = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Error uploading file to S3");
  }
};

export const deleteImageFromS3 = async (imageKey: string, folder: string) => {
  try {
    const deleteParams: DeleteObjectCommandInput = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `${folder ? `${folder}/` : ""}${imageKey}`,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3.send(command);

    console.log("Image deleted from S3:", imageKey);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Error deleting file from S3");
  }
};
