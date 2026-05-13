import express from "express";
import { getAccessibleCustomers, getGoogleAuthUrl,googleAuthCallback,} from "../googleAdsLead/googleLead.Controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = express.Router();

router.get("/auth", authenticate, getGoogleAuthUrl);

router.get("/auth/callback", googleAuthCallback);

router.get("/customers", authenticate, getAccessibleCustomers);

export default router;