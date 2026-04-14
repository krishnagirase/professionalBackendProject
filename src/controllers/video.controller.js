import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middleware.js"


const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //  req.query always returns strings

    const pipeline = [];
    
    // query = what to search
    // i = tells mongoDb how to apply the regex pattern

    if(query){
        pipeline.push({
            $match: {
                $or: [
                    {title : {$regex: query, $options: "i"}},
                    {description: {$regex: query, $options: "i"}}
                ]
            }
        })
    }

    // parseInt(): string -> int
    const options = {
        page: parseInt(page),
        limit : paseInt(limit)
    }

    const videos = Video.aggregatePaginate(
        Video.aggregate(pipeline),  // arg1 -> what to paginate
        options                     // arg2 -> how to paginate
    )

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || !description){
        throw new ApiError(400, "Title and description are required")
    }

    // extract the video and thumbnail from multer uploaded files
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if(!videoLocalPath || !thumbnailLocalPath){
        throw newApiError(400, '${!videoLocalPath ? "Video File" : "Thumbnail} is required')
    }

    //upload on Cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile || !thumbnail) {
        throw new ApiError(500, `${!videoFile ? "Video" : "Thumbnail"} upload failed`)
    }

    const newvideo = await Video.create({
        videoFile: videoFile?.url || "",
        thumbnail: thumbnail?.url || "",
        title,
        description,
        duration: videoFile.duration,   // from cloudinary
        owner: req.user._id,
        isPublished: true
    })

    if(!newvideo){
        throw (new ApiError(500, "Something went wrong while uploading the video"))
    }

    return res
    .status(201)
    .json(new ApiResponse(201, newvideo, "Video published Successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}