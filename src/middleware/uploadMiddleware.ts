import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("coverImage"); 
export default upload;
