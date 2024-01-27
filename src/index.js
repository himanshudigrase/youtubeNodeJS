import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

//  for storing env variables into process.env
dotenv.config({
    path:'./env'
});

connectDB().then(
    ()=>{
        app.listen(process.env.PORT || 5000,()=>{
            console.log(`Server running at PORT: ${process.env.PORT}`);
        })
    })
    .catch((err) =>{
        console.log("MONGODB connection failed !!",err);
    });


