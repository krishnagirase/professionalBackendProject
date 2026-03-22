import multer from "multer";
import { randomUUID } from "crypto";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    const uniqueName = randomUUID() + "_" + file.originalname
    console.log("Saving file as:", uniqueName) // 👈 debug
    cb(null, uniqueName)
  }
})

//user uploads the file
//multer calls destination function
//req = request info
//file = file(json data) to upload 
//cb = use to define storage location and fileName.

export const upload = multer({ storage })