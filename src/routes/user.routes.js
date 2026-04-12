import { Router } from "express";
import { 
    changeCurrentPassword,
            getCurrentUser,
            getUserChannelProfile,
            getUserWatchHistory,
            loginUser,
            logoutUser,
            refreshAccessToken,
            registerUser,
            updateAccountdetails,
            updateUseravatar,
            updateUserCoverImage
        } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post( 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },   
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),   
    registerUser
) 

router.route("/login").post(
    loginUser
)

router.route("/logout").post(verifyJWT, 
    logoutUser
)

router.route("/refresh-token").post(
    refreshAccessToken
)

router.route("/change-password").patch(verifyJWT,
    changeCurrentPassword
)

router.route("/current-user").get(verifyJWT,
    getCurrentUser
)

//patch used to update, if post use then it will create the new
router.route("/update-accountdetails").patch(verifyJWT,
    updateAccountdetails
)

router.route("/avatar").patch(verifyJWT,
    upload.single("avatar"), 
    updateUseravatar
)

router.route("/coverimage").patch(verifyJWT,
    upload.single("coverImage"), 
    updateUserCoverImage
)

router.route("/c/:username").get(verifyJWT, 
    getUserChannelProfile
)

router.route("/history").get(verifyJWT, 
    getUserWatchHistory
)

export default router