import { Router } from "express";
import { toggleSubscription,  
        getUserChannelSubscribers, 
        getSubscribedChannels } from "../controllers/subscription.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/toggle/s/:channelId").post(toggleSubscription);
router.route("/subscribers/:channelId").get(getUserChannelSubscribers)
router.route("/subscribedTo/:subscriberId").get(getSubscribedChannels)

export default router;