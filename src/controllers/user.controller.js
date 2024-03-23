import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens");
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    
    const {fullName,email,username,password} = req.body;

    // validation for blank values
    if([fullName,email,username,password].some((field)=> field?.trim() ==="")){
        throw new ApiError(400,"All fields are required");
    }

    // validation if user already existed or not
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    });

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists");
    }

    // Images upload on local
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    // Image upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required here");
    }

    // user registration on mongo
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    // returning response to user w/o pass and token fields
    const createdUser = await User.findById(user._id).select(
        "-passowrd -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser,"User registered successfully")
    )
});

const loginUser = asyncHandler(async(req,res) =>{
    const {username, email, password} = req.body;
   
    if(!(username || email)){
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    });

    if(!user){
        throw new ApiError(404,"User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw  new ApiError(401,"Invalid credentials")
    }

    // generating access and refresh tokens
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {httpOnly: true, secure: true}

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken // Why sending tokens again? As user might require them to store in localStorage
            },
            "User Logged In successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res) =>{
    // How to get user info for logout?
    // For this we create a auth middleware which stores user info 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {httpOnly: true, secure: true}

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Loged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
            )

            const user = await User.findById(decodedToken._id);

            if(!user){
                throw new ApiError(401,"Invalid refresh token");
            }

            if(incomingRefreshToken!== user?.refreshToken){
                throw new ApiError(401,"Refresh token is expired or invalid");
            }

            const options = {
                httpOnly: true,
                secure: true
            }

            const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

            return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken, refreshToken: refreshToken},
                    "Access Token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")        
    }
})

const changePassword = asyncHandler(async(req,res) =>{
    
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Old Password");
    }

    user.password = newPassword
    await User.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req,res) =>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current user details fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullName, email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400,"All details are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            },
            
        },
        {new: true} // returns new user object
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
})

const updateUserAvatar = asyncHandler(async(req,res) =>{
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }

    // TODO: delete from mongo and cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar image updated successfully"));
})

const updateUserCoverImage = asyncHandler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover image updated successfully"));
})


// Complex stuff ahead
const getUserChannelProfile = asyncHandler(async(req,res) =>{
    
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400,"Username is missing");
    }


    // Aggregation piplelines helps us to perform join operations in MongoDB
    // To achieve this we use aggregation pipelines which has stages

    const channel = await User.aggregate([
        // Stage 1: match stage is used to filter out docs from User model
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        // Stage 2: For the particular user we lookup in subscription model to get 
        // count of number of subscribers that user has and number of channels he has subcribed to
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id", // ref : User
                foreignField:"channel", // ref: Subscription
                as:"Subscribers"
            }
        },

        // Stage 3:
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },

        // Stage 4: Adding count fields
        // both lookups return array
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"subscribedTo"
                },
                isSubscribed: {
                    $cond:{
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },

        // Stage 5: Determines which fields to pass along to the next stage
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])

    if(!channel.length){
        throw new ApiError(404,"Channel does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
});

const getWatchHistory = asyncHandler(async(req,res) =>{
    const user = await User.aggregate([
        {
            // Aggreagtion piplines does not explicitly support mongoose. Hence we have to explicitly convert
            // our user id to ObjectId which is supported by mongoose
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    // WHy this subpipeline?
                    // Bcoz when watch history is displayed, it cnotains channel/ user's name which is not there in 
                    // our schema, hence to get that we are defining another pipeline
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            // This subpipeline is just for simplicity of data which needs to pass on
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully"))
})

export { 
    registerUser,
     loginUser,
      logoutUser,
      refreshAccessToken,
      changePassword,
      getCurrentUser,
      updateAccountDetails,
      updateUserAvatar,
      updateUserCoverImage,
      getUserChannelProfile,
      getWatchHistory
    };



// Register user Logic
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

// Login User Logic
 // Get user details
// Check whether the details are valid
 // Find the user in DB
 // Check whether password is correct or not
 // Assign access and refresh token
 // Send cookie in response

 // LogOut Logic
 // Create a new auth middleware as earlier we didn't have any user info for loggin out
 // Grab the user id from req.user and update it's necessary fields 
    // ie: refreshToken:  undefined
    // clear cookies