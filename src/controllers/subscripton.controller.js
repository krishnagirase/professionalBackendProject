import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel Id")
    }

    const channel = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id
    })

    let isSubscribed
    if(channel){
        await channel.deleteOne()
        isSubscribed = false
    }   
    else{
        await Subscription.create(
            {
                channel : channelId,
                subscriber : req.user?._id
            },
        )
        isSubscribed = true
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {isSubscribed},
        isSubscribed ? "Video Subscribed Successfully" : "Video UnSubscribed Successfully"
    ))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel Id")
    }

    const subscribers = await Subscription.find({channel : channelId})

    if(!subscribers){
        throw new ApiError(404, "No subsriber found")
    }
    console.log(subscribers)
    return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "fetched subscribers successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriber Id")
    }

    const subscribedChannels = await Subscription.find({subscriber : subscriberId})

    if(!subscribedChannels){
        throw new ApiError(404, "No channel found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "fetched subscribed Channels successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}