import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: CLOUDINARY_CLOUD_NAME, 
    api_key: CLOUDINARY_API_KEY, 
    api_secret: CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localfilepath) => {
    try{
        if(!localfilepath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully.
        console.log("file is uploaded on cloudinary", 
        response.url);
        return response;
    } catch(error){
        fs.unlinkSync(localfilepath) //remove the 
        // locally saved temporary file as the upload 
        // operation got failed
        return null;
    }
}
