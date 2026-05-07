import express from "express";
import { getLeadDashboardStats } from "./dashboardCount.Controller";
import { authenticate } from "../../middlewares/auth.middleware";


const router = express.Router();

router.get("/lead-dashboard-stats",authenticate, getLeadDashboardStats);

export default router;