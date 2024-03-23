//import {Subscription} from "../models/subscription.model.js"
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { isValidObjectId } from "mongoose";


const toggleSubscription = asyncHandler(async(req,res) =>{
    const {channelId} = req.params;
    const {userId} = req.user._id;

    if(!isValidObjectId(channelId)){
        throw new ApiError(500,"Invalid channel ID");
    }

    const channelName = await User.findById(channelId);
    
    if(!channelName){
        throw new ApiError(400,"No user with given channel Id exists");
    }

   const isSubscribed =  await Subscription.findOneAndDelete({
        channel: channelName, subscriber: userId
    });

    if(isSubscribed){
        return res.status(200).json(new ApiResponse(200,{},"Unsubscribed successfully"));
    }

    const subscribed =  await Subscription.create({
        channel: channelName, subscriber: userId
    });

    return res.status(200).json(new ApiResponse(200,subscribed,"Subscribed successfully"));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(500,"Invalid channel ID");
    }

    const channelName = await User.findById(channelId);

    if(!channelName){
        throw new ApiError(400,"No User with given channel ID exists.")
    }

    const subscribers = await Subscription.find(channelName._id);

    return res.status(200).json(new ApiResponse(200, subscribers,"Subscribers fetched successfully"))

});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid subscriber ID");
    }

    const subscriber = await User.findById(subscriberId);

    if(!subscriber){
        throw new ApiError(404,"User with given subscriber not found");
    }

    const subscribedTo = await Subscription.find(subscriber._id);

    if(!subscribedTo){
        throw new ApiError(400,"Unable to fetch subscribers");
    }

    return res.status(200).json(new ApiResponse(200,subscribedTo,"Subscribers fetched successfully"));
});

export  {toggleSubscription,
        getUserChannelSubscribers,
        getSubscribedChannels
    }