import express from "express";
import {
  createFollowUp,
  getFollowUps,
  getFollowUpById,
  updateFollowUp,
  deleteFollowUp,
  getFollowUpsByLead,
} from "./clientFollowUp.controller";

import { authenticate } from "../../middlewares/auth.middleware";

const router = express.Router();

// ✅ Create
router.post("/", authenticate, createFollowUp);

// ✅ Get all (with filters, pagination)
router.get("/", authenticate, getFollowUps);

// ✅ Get by ID
router.get("/:id", authenticate, getFollowUpById);

// ✅ Update
router.put("/:id", authenticate, updateFollowUp);

// ✅ Delete
router.delete("/:id", authenticate, deleteFollowUp);

// ✅ Timeline (Lead wise follow-ups)
// ⚠️ IMPORTANT: always keep this BEFORE /:id if conflict ho sakta hai
router.get("/lead/:leadId", authenticate, getFollowUpsByLead);

export default router;