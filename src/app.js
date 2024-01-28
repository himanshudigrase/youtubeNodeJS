// This file explains our app which is configured using express which is a 
// middleware basically setting up our app with necessary configs

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app= express();


// origin tells us to accept requests only from CORS_ORIGIN
// In our case it is set to allow from anywhere, while in prod it might be 
// set to a particular url

// credentials tells to send the header along with req
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}));

// Tells to accept json responses upto 16kb
//express.json() is a method inbuilt in express to 
//recognize the incoming Request Object as a JSON Object. 
app.use(express.json({limit:"16kb"}));

//express.urlencoded() is a method inbuilt in express 
//to recognize the incoming Request Object as strings or arrays.
app.use(express.urlencoded({extended:true,limit:"16kb"}));

//To serve static files such as images, CSS files, and JavaScript files
app.use(express.static("public"));

app.use(cookieParser());

// import routes
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users",userRouter)


export {app};