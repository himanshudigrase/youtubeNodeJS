import {Playlist} from "../models/playlist.model"
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const createPlaylist = asyncHandler(async(req,res) =>{
    const {name,description} = req.body;

    const userId = req.user?._id;

    const existedPlaylist = await Playlist.findOne(name);

    if(existedPlaylist){
        throw new ApiError(409,"Playlist name already in use. Choose a different name");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner:userId
    });

    if(!playlist){
        throw new ApiError(400,"Something went wrong while creating playlist");
    }

    return res.
    status(200)
    .json(new ApiResponse(200, playlist,"Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async(req,res) =>{
    const userId = req.user._id;

    const playlists = await Playlist.aggregate([
        {
            $match:{
                owner: userId
            }
        }
    ]);

    if(!playlists){
        throw new ApiError(400,"User doesn't have any playlist");
    }

    return res.status(200)
    .json(200,playlists,"Playlists fetched successfully");
});

const getPlaylistById = asyncHandler(async(req,res) =>{
    const {playlistId} = req.params;

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"Playlist doesn't exist anymore.")
    }

    return res.status(200).json(200,playlist,"Playlist fetched successfully");
});

const addVideoToPlaylist = asyncHandler(async(req,res) =>{
    const {playlistId, videoId} = req.params;

    const playlist = Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"Playlist doesn't exist");
    }

    const addVideo = await playlist.videos.push(videoId);

    if(!addVideo){
        throw new ApiError(400, "Unable to add video");
    }
    await playlist.save();

    return res.status(200).json(200,{},"Video added successfully");

});

const removeVideoFromPlaylist = asyncHandler(async(req,res) =>{
    const {playlistId, videoId} = req.params;

    const playlist = Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"Playlist doesn't exist");
    }

    const addVideo = await playlist.videos.pull(videoId);

    if(!addVideo){
        throw new ApiError(400, "Unable to remove video");
    }
    await playlist.save();

    return res.status(200).json(200,{},"Video removed successfully");

});

const deletePlaylist = asyncHandler(async(req,res) =>{
    const {playlistId} = req.params;

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);

    if(!deletePlaylist){
        throw new ApiError(400,"Unable to delete Playlist");
    }

    return res.status(200).json(200,{},"Playlist Deleted successfully");
});

const updatePlaylist = asyncHandler(async(req,res) =>{
    const {playlistId} = req.params;
    const {name,description} = req.body;

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description
            }
        },
        {new:true}
    );

    if(!playlist){
        throw new ApiError(400,"Unable to update playlist");
    }

    return res.status(200).json(new ApiResponse(200,playlist,"Playlist updated successfully"));
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}