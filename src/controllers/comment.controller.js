import mongoose from "mongoose";
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async(req,res) =>{
    const {videoId} = req.params;
    const {page=1,limit = 10} = req.query

    if(!videoId){
        throw new ApiError(400,"VideoId is invalid!!");
    }
    
    const skip = (page-1)*limit;

    const comments = await Comment.find(videoId)
                                  .skip(skip)
                                  .limit(limit);

    if(!comments){
        throw new ApiError(400,"No comments for this video");
    }

    res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async(req,res) =>{
    const {videoId} = req.params;
    const userId = req.user._id;
    const content = req.body;

    if(!content){
        throw new ApiError(400,"Cannot create empty comment")
    }
    if(!userId){
        throw new ApiError(404,"User not found. Please Log In");
    }

    if(!videoId){
        throw new ApiError(404,"Video doesn't exist.")
    }

    const comment = await Comment.create({
        content,
        videoId,
        userId
    });

    await comment.save();

    return res
           .status(200)
           .json(new ApiResponse(200,comment,"Comment created successfully"));
})

const updateComment = asyncHandler(async(req,res) =>{
    const {content} = req.body;
    const {commentId} = req.params

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Comment not found");
    }

    comment.content = content;

    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(200,comment,"Comment updated successfully"))

})

const deleteComment = asyncHandler(async(req,res) =>{
    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(404,"Comment not found")
    }

    await Comment.deleteOne(commentId);

    return res
    .status(200)
    .json(new ApiResponse(200,"","Comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}