import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

  const uploadCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath)return null;
        // Upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        })
        // File upload successfull
        console.log("File uploaded successfully on cloudinary",response.url);
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove locally saved temporary file as the upload was unsuccessfull
        return null;
    }
  }

  export {uploadCloudinary}