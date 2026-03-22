import { setServers } from 'dns';
setServers(['8.8.8.8', '1.1.1.1']);

import "dotenv/config";  
import connectDB from "./db/index.js";
import { app } from "./app.js";   


connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port: ${process.env.PORT}`);
    });

    app.on("error", (error) => {
      console.error("Server error:", error);
      throw error;
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed error:", error);
    process.exit(1);
  });



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