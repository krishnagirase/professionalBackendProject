import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id

    if(!userId){
        throw new ApiError(404, "user not found")
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id

    if(!userId){
        throw new ApiError(404, "user not found")
    }

    const videos = await Video.find({owner: userId})

    if(videos.length == 0){
        throw new ApiError(404, "no video found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }