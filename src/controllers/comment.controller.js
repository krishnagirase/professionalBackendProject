import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comments.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const comments = await Comment.find({video: videoId})
    .sort({createdAt : -1})
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)

    if(comments.length == 0){
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "No comments found for this video"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const {content} = req.body

    if(!content || content.trim() === ""){
        throw new ApiError(400, "required content field")
    }

    const comment = await Comment.create(
        {
            content,
            video: videoId,
            owner : req.user?._id
        }
    )

    if(!comment){
        throw new ApiError(500, "Something went wrong while adding the comment")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, comment, "comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "comment not found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "user Not Allowed")
    }

    const {content} = req.body

    if(!content || content.trim() === ""){
        throw new ApiError(400, "content field required")
    }

    comment.content = content
    await comment.save()

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "comment not found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "user Not Allowed")
    }

    await comment.deleteOne()

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }