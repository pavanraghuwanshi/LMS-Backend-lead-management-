import { Response } from "express";
import Lead from "../lead/lead.model";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { buildLeadFilter } from "../../utils/hierarchy.util";

export const getLeadDashboardStats = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ hierarchy based filter
    const filter = buildLeadFilter(user, req.query);

    // ✅ total leads
    const totalLeadsPromise = Lead.countDocuments(filter);

    // ✅ converted leads
    const convertedLeadsPromise = Lead.countDocuments({
      ...filter,
      status: "completed",
    });

    // ✅ today's leads
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysLeadsPromise = Lead.countDocuments({
      ...filter,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // ✅ parallel execution
    const [totalLeads, convertedLeads, todaysLeads] =
      await Promise.all([
        totalLeadsPromise,
        convertedLeadsPromise,
        todaysLeadsPromise,
      ]);

    // ✅ conversion rate
    const conversionRate =
      totalLeads > 0
        ? ((convertedLeads / totalLeads) * 100).toFixed(2)
        : "0";

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: {
        totalLeads,
        convertedLeads,
        todaysLeads,
        conversionRate: `${conversionRate}%`,
      },
    });
  } catch (error: any) {
    console.error("Lead Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};