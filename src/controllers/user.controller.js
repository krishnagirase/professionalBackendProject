import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import validator from "validator"
import jwt from "jsonwebtoken"
import { upload } from "../middlewares/multer.middleware.js"
import mongoose from "mongoose"

const generateAccessandrefreshTokens = async(userId) => {
    try{
 
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshTokens()
        const accessToken = user.generateAccessTokens()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    }
    catch(error){
        console.log("EXACT ERROR : ", error.message) 
        console.log("FULL ERROR : ", error)     
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
} 


const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response 
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body
    console.log("email : ", email);
    // console.log(req.body);
    // console.log("req files : ", req.files)
    //check for all the fields (empty or space filled)
    if(
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    if(!validator.isEmail(email)){
        throw new ApiError(400, "Invalid email format")
    }

    if(password.length < 8){
        throw new ApiError(400, "Password must be 8 characters")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required1")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered Successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    //req body -> data extraction
    //username or email 
    //find the user
    //password check
    //access and refresh token generation  
    // send cookies
    //send response

    const {email, username, password} = req.body

    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "user does not exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessandrefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select('-password -refreshToken')

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken   
            },
            "User logged In Successfully"
        )
    )
})


const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})


const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid Refresh Token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const {accessToken, newRefreshToken} = await user.generateAccessandrefreshTokens(user._id)
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
    status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {accessToken, refreshToken: newRefreshToken},
            "Access Token refresh Successfully"
        )
    )   
})


const changeCurrentPassword =  asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body

    if(!(newPassword === confirmPassword)){
        throw new ApiError(400, "confirmPasswword doesn't matches newPassword")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await User.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Password Changed Successfully"))
})


const getCurrentUser  = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        req.user,
        "User fetched successfully"
    ))
})


const updateAccountdetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new : true}
    ).select("-Password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "user details updated successfully"))
})


const updateUseravatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file.path

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is missing")
    }

    // get the old avatar public id from db before updating
    const existingUSer = await User.findById(req?.user._id)
    const oldAvatarUrl = existingUSer?.avatar.url

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading file on Cloudinary")
    }

    // delete the oldAvatarfile from db
    if (oldAvatarUrl) {
        const publicId = oldAvatarUrl.split("/").pop().split(".")[0]  // extract public_id from URL
        await cloudinary.uploader.destroy(publicId)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-Password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"))
})  


const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.avatar?.[0]?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "CoverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading file on Cloudinary")
    }

    //extract the existing user oldcoverImageurl from db
    const existingUSer = await User.findById(req?.user._id)
    const oldcoverImageurl = existingUSer?.coverImage.url

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new : true}
    ).select("-Password")

    //delete oldcoverImage from db
    if (oldcoverImageurl) {
        const publicId = oldcoverImageurl.split("/").pop().split(".")[0]  // extract public_id from URL
        await cloudinary.uploader.destroy(publicId)
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"))
})  


const getUserChannelProfile = asyncHandler(async(req, res) => {
    
    //extract username from http url
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    //aggregate the stages
    const channel = await User.aggregate([
        // stage 1: find the user whose channel is being visited. 
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        // stage 2 : get subscribers
        {
            $lookup: {
                from: "subscriptions",      // go into subscriptions collection
                localField: "_id",          // user _id
                foreignField: "channel",    // matches where channel = user _id
                as: "subscribers"           //store the result 
            }
        },
        // stage 3 :  get subscribedTo
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        // stage 4 : add the extra info inside the user model.
        {
            $addFields: {
                // Count subscribers array length
                subscribersCount : {
                    $size: "$subscribers"
                }, 
                recentSubscribers: {
                    //filters out the subscribers subscribed after certin date.
                    $filter: {
                        input: "subscribers",
                        as: "sub",
                        cond: {$gt: ["$$sub.createdAt", new Date("2026-01-01")]}
                    }
                },
                // Count subscribedTo array length
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                // Check if (logged in user) has subscribed the visited channel
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user._id, "$subscribers.subscriber"]},
                        // "$subscribers.subscriber" extracts all id's from subscriber array
                        // checks is user's id in that list
                        then: true,     // show Subscribed Button
                        else: false     // show Subscribe Button
                    }
                }
            }
        },
        // stage 5 : Final Output ✅
        {
            $project: {
                fullName: 1,
                username: 1,
                email : 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    // 🚀 TODO — console.log(channel)
    // ⭐ good to know

    // 📝 aggregate() always returns an array
    // 📝 $match first — always reduces data early
    // 📝 $lookup joins another collection — always returns array field
    // 📝 $addFields adds computed fields without removing existing ones
    // 📝 $project decides final shape — drop heavy arrays here
    // 📝 channel[0] used because $match on unique usernames( can be multiple ) always gives one result
    // ⚠️ always convert string id to ObjectId inside aggregate
    // ⚠️ $in inside $cond is MongoDB operator — not JavaScript includes()
    // 🔥 same subscriptions collection used twice — once as channel, once as subscriber
    // 💡 $size counts array length — no need to manually loop and count


    if(!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user fetched successfully")
    )

    // channel[0] — unwrap from array, send only visited object
    // frontend receives clean single object — not an array
})

const getUserWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localfield: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localfield: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipleine: [
                                {
                                    $project: {
                                        fullName: 1,
                                        avatar: 1,
                                        coverImage: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            //access first val in owner array
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        user[0].watchHistory,
        "user watchHistory fecthed successfully")
    )
})


//.....=========NOTE==========.....

// const user = await User.findOne({...})
// // user.refreshToken = ""  ← empty

// await generateAccessandrefreshTokens(user._id)
// // DB updated with refreshToken ✅
// // but user variable in memory still = ""  ❌

// const loggedInUser = await User.findById(user._id)
// // fresh fetch from DB
// // loggedInUser.refreshToken = "eyJhbG..."  ✅




export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountdetails,
    updateUseravatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}  