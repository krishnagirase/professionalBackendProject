import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => { 
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "required content field")
    }

    const user = req.user?._id

    if(!user){
        throw new ApiError(401, "Unauthorized request")
    }

    const tweet = await Tweet.create(
        {
            content,
            owner : user
        }
    )

    if(!tweet){
        throw new ApiError(500, "Something went wrong while creating the Tweet")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const {page = 1, limit= 10} = req.query
    
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const tweets = await Tweet.find({owner : userId})
    .sort({createdAt : -1})
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)

    if(tweets.length === 0){
        return res
        .status(200)
        .json(new ApiResponse(200, [], "No tweets found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "user tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "user Not Allowed")
    }

    const {content} = req.body

    if(!content || content.trim() === ""){
        throw new ApiError(400, "content field required")
    }

    tweet.content = content
    await tweet.save()

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "user Not Allowed")
    }

    await tweet.deleteOne()

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet deleted successfully"))
}) 

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}