import { Router } from "express";
import {
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  getLeadDropdown,
} from "./lead.controller";

import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

// 🔐 All routes protected
router.use(authenticate);

// ➕ Create Lead
router.post("/", createLead);

// 📄 Get All Leads (with filters, pagination, search)
router.get("/", getLeads);

// 📄 Get Lead DropDown Api
router.get("/dropdown", getLeadDropdown);

// ✏️ Update Lead
router.put("/:id", updateLead);

// ❌ Delete Lead
router.delete("/:id", deleteLead);

export default router;