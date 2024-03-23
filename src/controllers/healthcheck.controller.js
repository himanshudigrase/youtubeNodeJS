import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const healthCheck = asyncHandler(async(req,res) =>{
    try {
        const user = await User.findOne(req?.user?._id);

        return res.status(200).json(new ApiResponse(200,user,"Everything is OK!"))
    } catch (error) {
        throw new ApiError(500,"Internal Server Error")
    }
})