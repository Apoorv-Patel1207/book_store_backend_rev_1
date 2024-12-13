import multer from "multer";

const storage = multer.memoryStorage();

const uploadBook = multer({
  storage,
}).single("coverImage");

const uploadUser = multer({
  storage,
}).single("profileImage");

export { uploadBook, uploadUser };
