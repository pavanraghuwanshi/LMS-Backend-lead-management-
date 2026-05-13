import express from "express";
import { getGoogleAuthUrl,googleAuthCallback,} from "../googleAdsLead/googleLead.Controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = express.Router();

router.get("/auth", getGoogleAuthUrl);

router.get("/auth/callback",authenticate, googleAuthCallback);

export default router;