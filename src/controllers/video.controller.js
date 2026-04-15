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

    if(sortBy){
        pipeline.push({
            $sort: { [sortBy] : sortType === "asc" ? 1 : -1}
        })
    }

    // parseInt(): string -> int
    const options = {
        page: parseInt(page),
        limit : parseInt(limit)
    }

    const videos = await Video.aggregatePaginate(
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
    const videofile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videofile || !thumbnail) {
        throw new ApiError(500, `${!videofile ? "Video" : "Thumbnail"} upload failed`)
    }

    const newvideo = await Video.create({
        videofile: videofile?.url || "",
        thumbnail: thumbnail?.url || "",
        title,
        description,
        duration: videofile.duration,   // from cloudinary
        owner: req.user._id,
        isPublished: true
    })

    if(!newvideo){
        throw (new ApiError(500, "Something went wrong while publishing the video"))
    }

    return res
    .status(201)
    .json(new ApiResponse(201, newvideo, "Video published Successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const { title, description } = req.body
    const thumbnailLocalPath = req.files?.path

    if(!title && !description && !thumbnailLocalPath){
        throw new ApiError(400, "Atleast one field required")
    }

    let thumbnail

    if(thumbnailLocalPath){
        const existingVideo = await Video.findById(videoId)
        const oldthumbnailUrl = existingVideo?.thumbnail

        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if(!thumbnail?.url){
            throw new ApiError(500, "failed cloudinary upload new thumbnail")
        }

        if (oldthumbnailUrl) {
            const publicId = oldthumbnailUrl.split("/").pop().split(".")[0]  // extract public_id from URL
            await cloudinary.uploader.destroy(publicId)
        }
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                ...(title && {title : title}),
                ...(description && {description : description}),
                ...(thumbnail && { thumbnail: thumbnail.url })
            }
        },
        {new : true}
    )

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        video,
    "video  details updated successfully"
    ))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findByIdAndDelete(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    video.isPublished = !video.isPublished
    await video.save()

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        { isPublished: video.isPublished },
        `Video ${video.isPublished ? "published" : "unpublished"} successfully`
    ))
})

//  videoId = "invalidstring123"
//  so if(!videoId) catches invalid objectIds requires is isValidObjectId
 
export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}