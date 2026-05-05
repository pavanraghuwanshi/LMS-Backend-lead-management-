import { Router } from "express";
import {
  getNotAssignedLeadGen,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  createClientFeedback,
} from "./Appointment.controller";

import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

// 🔐 All routes protected
router.use(authenticate);

// 📌 Get Pending Leads (for assignment)
router.get("/pending-leads", getNotAssignedLeadGen);

// 📄 Get All Appointments (filters + pagination + search)
router.get("/", getAppointments);

// ➕ Create Appointment
router.post("/", createAppointment);

// ✏️ Update Appointment
router.put("/:id", updateAppointment);

// ❌ Delete Appointment
router.delete("/:id", deleteAppointment);

// 💬 Client Feedback
router.post("/client-feedback", createClientFeedback);

export default router;
