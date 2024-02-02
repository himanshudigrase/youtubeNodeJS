import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

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

    if(!username || !email){
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


export { registerUser, loginUser, logoutUser};


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