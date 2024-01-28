import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import brcypt from "bcrypt";

const userSchema = new Schema({
   username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,
        required: true,
    },
    coverImage: {
        type: String,
        
    },
    password:{
        type: String,
        required: [true,"Password is required"],
    },
    refreshToken:{
        type:String
    },
    watchHistory:{
        type: Schema.Types.ObjectId,
        ref:"Video"
    }
},{timestamps:true});


// mongoose middlware function to hash passowrd
userSchema.pre("save", async function(next){

    // to avoid unnecessary password hashing when a user updates
    // his details
    if(!this.isModified("password"))return next();
    
    this. password = await brcypt.hash(this.password,10);
    next();
});


userSchema.methods.isPasswordCorrect = async function(password){
    return await brcypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User = mongoose.model("User",userSchema);