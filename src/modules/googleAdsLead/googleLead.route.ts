import express from "express";
import { getGoogleAuthUrl,googleAuthCallback,} from "../googleAdsLead/googleLead.Controller";

const router = express.Router();

router.get("/auth", getGoogleAuthUrl);

router.get("/auth/callback", googleAuthCallback);

export default router;