import dotenv from "dotenv"
import connectDB from "./db/index.js"
import express from "express"

dotenv.config()

const app = express()

connectDB()
console.log(`Server is running on port ${process.env.PORT}`)



/*

import express from "express"
const app = express()

(async () => {
    try {
       await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (err) => {
            console.error("ERROR: ", err)
            throw err
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is lstening on port ${process.env.PORT}`)
        })
    }
    catch(error){
        console.error("ERROR: ", error)
        throw error
    }
}) ()

*/