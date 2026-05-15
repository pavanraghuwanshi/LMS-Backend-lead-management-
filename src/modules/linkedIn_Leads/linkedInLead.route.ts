import express from "express";

import {
  getLinkedInAuthUrl,
  linkedInAuthCallback,
  getLinkedInAdAccounts,
  linkedInLeadWebhook,
} from "./linkedInLead.controller";

import { authenticate } from "../../middlewares/auth.middleware";

const router = express.Router();

// ==========================================
// LINKEDIN AUTH
// ==========================================

router.get("/auth",authenticate,getLinkedInAuthUrl);

// ==========================================
// LINKEDIN CALLBACK
// ==========================================

router.get("/auth/callback",linkedInAuthCallback);

// ==========================================
// LINKEDIN AD ACCOUNTS
// ==========================================

router.get( "/accounts",authenticate,getLinkedInAdAccounts);

// ==========================================
// LINKEDIN WEBHOOK
// ==========================================

router.post("/webhook",linkedInLeadWebhook);

export default router;