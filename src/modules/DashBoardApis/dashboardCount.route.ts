import express from "express";
import { getAppointmentReminders, getLeadDashboardStats, getLeadGrowthMonthWise } from "./dashboardCount.Controller";
import { authenticate } from "../../middlewares/auth.middleware";


const router = express.Router();

router.get("/lead-dashboard-stats",authenticate, getLeadDashboardStats);
router.get("/lead-dashboard-stats-month-wise",authenticate, getLeadGrowthMonthWise);
router.get("/lead-dashboard-reminder",authenticate, getAppointmentReminders);

export default router;