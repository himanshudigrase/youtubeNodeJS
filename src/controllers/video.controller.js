import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { User } from "../models/user.model";


// Incomplete
const getAllVideos = asyncHandler(async(req,res) =>{
    const {page=1,limit=10,query,sortBy,sortType, userId} = req.query;
    if(!userId) throw new ApiError(400,"User ID is mandatory");
    const skip = (page-1) * limit;

    const videos = await Video.aggregate([
        {
            $match: {}
        }
    ])

});


const publishVideo = asyncHandler(async(req,res) =>{
    const {title, description} = req.body;
    const videoLocalPath = req?.files?.videoFile[0].path;
    const thumbnailLocalPath = req?.files?.thumbnailFile[0].path;

    if(!title || !description){
        throw new ApiError(400,"Title and description both are required");
    }
    if(!videoLocalPath && !thumbnailLocalPath){
        throw new ApiError(400,"Invalid File path");
    }

    const videoCloudinaryPath = await uploadOnCloudinary(videoLocalPath);
    const thumbnailCloudinaryPath = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoCloudinaryPath && !thumbnailCloudinaryPath){
        throw new ApiError(400,"Error while uploading on cloudinary");
    }

   const video =  await Video.create({
        title,
        description,
        videoFile: videoCloudinaryPath?.url,
        owner: req?.user?._id,
        duration: videoCloudinaryPath?.duration,
        thumbnail: thumbnailCloudinaryPath?.url,
        isPublished: true
    });

    if(!video){
        throw new ApiError(500,"Failed to save video in database")
    }
    return res.status(200).json(new ApiResponse(200,video,"Video published successfully"));
});


const getVideoById = asyncHandler(async(req,res) =>{
    const {videoId} = req.params;

    if(!videoId || isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video ID");
    }

    await Video.findByIdAndUpdate( videoId,{
        $inc: {views : 1}
    });

    const video = Video.aggregate([
        {
            $match:{
                _id: videoId
            },
             // Processes multiple aggregation pipelines within a single stage on the same set of input documents.
            $facet:{
                getVideoId:[
                    {
                        $lookup:{
                            from: "users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullName:1,
                                        avatar:1,
                                        createdAt:1,
                                        updatedAt:1
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
                ],
                totalLikesCommentsandSubscriptions: [
                    {
                        $lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"video",
                            as:"totalLikesOnVideo"
                        }
                    },
                    {
                        $addFields:{
                            likedByUser:{
                                $in:[req.user?._id, "$totalLikesOnVideo.likedBy"]
                            }
                        }
                    },
                    {
                        $lookup:{
                            from:"comments",
                            localField:"_id",
                            foreignField:"video",
                            as:"totalComments"
                        }
                    },
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "owner",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            isSubscribedTo: {
                                $in: [req.user?._id, "$subscribers.subscriber"]
                            }
                        }
                    },
                    {
                        $group:{
                            _id:null,
                            TotalLikesOnVideo: {$sum : {$size:"$totalLikesOnVideo"}},
                            TotalComments: {$sum: {$size:"$totalComments"}},
                            TotalSubscribers:{$sum: {$size: "$subscribers"}},
                            isSubscribedTo: {$first: "$isSubscribedTo"},
                            likedByUser: {$first: "$likedByUser"}
                        }
                    }
                ],
            }
        }
    ]);

    if(!video[0].getAVideo.length){
        throw new ApiError(400,"Video does not exist");
    }

    const user = await User.findById(req.user?._id);
    const matchedVideo = user.watchHistory.find(video => video.equals(videoId));

    if(!matchedVideo){
        user.watchHistory.push(videoId)
        await user.save();
    }
    return res.status(200).json(new ApiResponse(200,video[0],"Video fetched successfully"))
});

const updateVideo = asyncHandler(async(req,res) =>{
    const {videoId} = req.params;
    const {title, description} = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video ID is invalid");
    }
    if(!title && !description){
        throw new ApiError(400,"All fields are required");
    }

    const thumbnailPath = req.files?.thumbnail[0]?.path;
    if(!thumbnailPath) throw new ApiError(503,"Thumbnail is required");

    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if(!thumbnail) throw new ApiError(503,"Failed to upload on cloudinary");

    const updatedVideo = await Video.findOneAndUpdate({_id:videoId, owner: req.user?._id},{
        title,
        description,
        thumbnail: thumbnail?.url
    },{new:true}).populate('owner','username email')

    if(!updatedVideo){
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, updateVideo,"Video updated successfully"));
});

const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id");
    }

    const video = await Video.findByIdAndDelete(videoId);

    if(!video){
        throw new ApiError(400,"Unable to delete video");
    }

    return res.status(200,video,"Video deleted successfully");
});

const togglePublishStatus =asyncHandler(async(req,res) =>{
    const {videoId} = req.params;
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id");
    }

    const video = await Video.findOne({_id: videoId, owner: req?.user?._id});

    if(!video) throw new ApiError(404,"Video not found");

    const updatedVideo = await Video.findByIdAndUpdate(videoId,{
        isPublished : !video.isPublished
    },{new: true}).populate('owner','username email')

    if(!updatedVideo){
        throw new ApiError(500,"Failed to update video status")
    }

    return res.status(200).json(new ApiResponse(200,updateVideo,"Videp status updated successfully"))
});


export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}