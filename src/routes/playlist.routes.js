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

router.route("")