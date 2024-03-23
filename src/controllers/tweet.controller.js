import { ApiError } from "../utils/ApiError";
import {Tweet} from "../models/tweet.model"
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const createTweet = asyncHandler(async(req,res) =>{
    const {content} = req.body;
    const userId = req.user?._id;

    const newTweet = await Tweet.create({
        content,
        owner:userId
    });

    if(!newTweet){
        throw new ApiError(409,"Unable to create new tweet");
    }

    return res.status(200)
    .json(new ApiResponse(200, newTweet,"Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req?.user?._id;

    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner:userId
            }
        }
    ]);

    if(!tweets){
        throw new ApiError(400,"Unable to fetch tweets");
    }

    return res.status(200)
    .json(new ApiResponse(200,tweets,"Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;
    const {userId} = req?.user?._id;

    const tweet = await Tweet.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: content
            }
        },
        {new:true}
    );

    if(!tweet){
        throw new ApiError(400,"Unable to update tweet");
    }

    return res.status(200).json(new ApiResponse(200,tweet,"Tweet updated successfully"));

});

const deleteTweet = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    const tweet = await Tweet.findByIdAndDelete(commentId);

    if(!tweet){
        throw new ApiError(400,"Unable to delete tweet");
    }

    return res
           .status(200)
           .json(200,tweet,"Tweet deleted successfully");
});

export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
};
