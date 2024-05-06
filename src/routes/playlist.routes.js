import { Router } from "express";
import { createPlaylist,
     getUserPlaylists,
     getPlaylistById, 
     addVideoToPlaylist, 
     deletePlaylist, 
     removeVideoFromPlaylist, 
     updatePlaylist } from "../controllers/playlist.cotroller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist);
router.route("/:playlistId")
      .get(getPlaylistById)
     .patch(updatePlaylist)
     .delete(deletePlaylist)

router.route("/add/:videId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);


export default router;
