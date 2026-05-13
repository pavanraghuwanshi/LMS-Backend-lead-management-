import express from "express";
import { getAccessibleCustomers, getCampaigns, getGoogleAuthUrl,googleAuthCallback, googleLeadWebhook,} from "../googleAdsLead/googleLead.Controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = express.Router();

router.get("/auth", authenticate, getGoogleAuthUrl);

router.get("/auth/callback", googleAuthCallback);

router.get("/customers", authenticate, getAccessibleCustomers);

router.get("/campaigns", authenticate, getCampaigns);

router.post("/webhook",googleLeadWebhook);
  
export default router;