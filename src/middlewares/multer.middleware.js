import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

//user uploads the file
//multer calls destination function
//req = request info
//file = file(json data) to upload 
//cb = use to define storage location and fileName.

export const upload = multer({ storage })