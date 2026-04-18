import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/likes.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const existinglike = await Like.findOne({
        video : videoId,
        likedBy : req.user?._id
    })

    let isLiked

    if(existinglike){
        await existinglike.deleteOne()
        isLiked = false
    }
    else{
        await Like.create(
            {
                video: videoId,
                likedBy: req.user?._id
            }
        )
        isLiked = true
    }

    return res
    .status(200)
    .json(new ApiResponse(
            200,
            {isLiked},
            isLiked ? "Video liked successfully" : "Video unliked successfully"
        )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const existinglike = await Like.findOne({
        comment : commentId,
        likedBy : req.user?._id
    })

    let isLiked

    if(existinglike){
        await existinglike.deleteOne()
        isLiked = false
    }
    else{
        await Like.create(
            {
                comment: commentId,
                likedBy: req.user?._id
            }
        )
        isLiked = true
    }

    return res
    .status(200)
    .json(new ApiResponse(
            200,
            {isLiked},
            isLiked ? "Comment liked successfully" : "Comment unliked successfully"
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const existinglike = await Like.findOne({
        tweet : tweetId,
        likedBy : req.user?._id
    })

    let isLiked

    if(existinglike){
        await existinglike.deleteOne()
        isLiked = false
    }
    else{
        await Like.create(
            {
                tweet: tweetId,
                likedBy: req.user?._id
            }
        )
        isLiked = true
    }

    return res
    .status(200)
    .json(new ApiResponse(
            200,
            {isLiked},
            isLiked ? "tweet liked successfully" : "tweet unliked successfully"
        )
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    console.log("start1")
    const likedvideos = await Like.find(
        {
            likedBy: req.user?._id,
            video: {$ne: null} 
        }
    ).populate("video")
console.log("start2")
    if(likedvideos.length == 0){
        return res
        .status(200)
        .json(new ApiResponse(200, [], "No liked Videos found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200, likedvideos, "fetched all the liked Videos"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}