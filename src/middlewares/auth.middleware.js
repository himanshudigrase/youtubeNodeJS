import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

// Why is next being required here?
// Beacause when we pass middlware to route, it doesnt know what to call first and what to call next.
// Hence next helps to state what to call next

export const verifyJWT = asyncHandler(async(req,_,next) =>{
try {
    
        const token = req.cookies?.accessToken || 
        req.header("Authorization")?.replace("Bearer", ""); // This line is for mobile devices which doesn;t have cookie priviledge
    
        if(!token){
            throw new ApiError(401,"Unauthorized Request");
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token");
        }

        // setting the above user in req.user
        req.user = user;
        next();
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
}
})


// This auth middleware is being sent just before logout request as we are storing the user info 
// in req so to make the user info available to logout functionality