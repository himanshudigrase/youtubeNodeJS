import connectDB from "./db/index.js";
import dotenv from "dotenv";

//  for storing env variables into process.env
dotenv.config({
    path:'./env'
});

connectDB();


