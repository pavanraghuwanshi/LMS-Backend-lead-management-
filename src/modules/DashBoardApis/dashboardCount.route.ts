import express from "express";
import { getLeadDashboardStats, getLeadGrowthMonthWise } from "./dashboardCount.Controller";
import { authenticate } from "../../middlewares/auth.middleware";


const router = express.Router();

router.get("/lead-dashboard-stats",authenticate, getLeadDashboardStats);
router.get("/lead-dashboard-stats-month-wise",authenticate, getLeadGrowthMonthWise);

export default router;