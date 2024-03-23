import mongoose ,{isValidObjectId} from "mongoose";
import  {Like} from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async(req,res) =>{
    const {videoId} = req.params;
    const {userId} = req.user._id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video ID is invalid")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"Unable to find Video");
    }

    const isVideoLiked = await Like.findOne({video: videoId, likedBy: userId});

    // Video is not liked
    if(!isVideoLiked){
      const liked =   await Like.create({
            video: videoId,
            likedBy: userId
        })

        return res.status(200).json(new ApiResponse(200,liked,"Video Liked successfully"));
    }
    // Video is liked
    const disliked = await Like.findOneAndDelete({video: videoId});
    
    return res.status(200)
    .json(new ApiResponse(200,disliked,"Video disliked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {userId} = req.user._id

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400,"Comment Id is invalid");
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400,"Comment not found");
    }

    const isCommentLiked = await Like.findOne({comment: commentId});

    if(!isCommentLiked){
       const commentLiked =  await Like.create({
            comment: commentId,
            likedBy: userId
       });

       return res.status(200).json(new ApiResponse(200,commentLiked,"Comment Liked successfully"));
    }

    const commentDisliked = await Like.findOneAndDelete({comment: commentId});

    return res.status(200).json(new ApiResponse(200,commentDisliked,"Comment disliked successfully"));
    
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {userId} = req.user._id

    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"Tweet Id is invalid");
    }

    const comment = await Tweet.findById(tweetId);

    if(!comment){
        throw new ApiError(400,"Tweet not found");
    }

    const isTweetLiked = await Like.findOne({tweet: tweetId});

    if(!isTweetLiked){
       const tweetLiked =  await Like.create({
            tweet: tweetId,
            likedBy: userId
       });

       return res.status(200).json(new ApiResponse(200,tweetLiked,"Tweet Liked successfully"));
    }

    const tweetDisliked = await Like.findOneAndDelete({tweet: tweetId});

    return res.status(200).json(new ApiResponse(200,tweetDisliked,"Tweet disliked successfully"));
    
});

const getLikedVideos = asyncHandler(async (req, res) => {
    
})



export {
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getLikedVideos
}