import express from "express";

import {
  getMetaLoginUrl,
  metaCallback,
//   syncMetaLeads,
//   verifyMetaWebhook,
//   receiveMetaWebhook,
} from "./metaLeadAuth.Controller";

import {authenticate} from "../../../middlewares/auth.middleware";

const router = express.Router();


// ============================================
// META LOGIN URL
// ============================================

router.get("/login",authenticate,getMetaLoginUrl);


// ============================================
// META CALLBACK
// ============================================

router.get(
  "/callback",
  metaCallback
);


// ============================================
// MANUAL LEAD SYNC
// ============================================

// router.get(
//   "/sync-leads",
//   authenticate,
//   syncMetaLeads
// );


// ============================================
// WEBHOOK VERIFY
// ============================================

// router.get(
//   "/webhook",
//   verifyMetaWebhook
// );


// ============================================
// WEBHOOK RECEIVE
// ============================================

// router.post(
//   "/webhook",
//   receiveMetaWebhook
// );

export default router;