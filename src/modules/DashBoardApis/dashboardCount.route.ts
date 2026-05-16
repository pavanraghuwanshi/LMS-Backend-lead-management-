import express from "express";
import { getAppointmentReminders, getLeadDashboardStats, getLeadGrowthMonthWise, getLeadSourceContribution } from "./dashboardCount.Controller";
import { authenticate } from "../../middlewares/auth.middleware";


const router = express.Router();

router.get("/lead-dashboard-stats",authenticate, getLeadDashboardStats);
router.get("/lead-dashboard-stats-month-wise",authenticate, getLeadGrowthMonthWise);
router.get("/lead-dashboard-reminder",authenticate, getAppointmentReminders);
router.get("/lead-dashboard-source-contribution",authenticate, getLeadSourceContribution);

export default router;