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

    // =========================
    // DATE RANGES
    // =========================

    const now = new Date();

    // today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // yesterday
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const endOfYesterday = new Date(endOfToday);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);

    // current month
    const startOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // previous month
    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const endOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    // =========================
    // QUERIES
    // =========================

    const totalLeadsPromise = Lead.countDocuments(filter);

    const convertedLeadsPromise = Lead.countDocuments({
      ...filter,
      status: "completed",
    });

    const todaysLeadsPromise = Lead.countDocuments({
      ...filter,
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    // previous month total leads
    const previousMonthLeadsPromise = Lead.countDocuments({
      ...filter,
      createdAt: {
        $gte: startOfPreviousMonth,
        $lte: endOfPreviousMonth,
      },
    });

    // current month total leads
    const currentMonthLeadsPromise = Lead.countDocuments({
      ...filter,
      createdAt: {
        $gte: startOfCurrentMonth,
        $lte: endOfCurrentMonth,
      },
    });

    // previous month converted leads
    const previousMonthConvertedPromise = Lead.countDocuments({
      ...filter,
      status: "completed",
      createdAt: {
        $gte: startOfPreviousMonth,
        $lte: endOfPreviousMonth,
      },
    });

    // current month converted leads
    const currentMonthConvertedPromise = Lead.countDocuments({
      ...filter,
      status: "completed",
      createdAt: {
        $gte: startOfCurrentMonth,
        $lte: endOfCurrentMonth,
      },
    });

    // yesterday leads
    const yesterdayLeadsPromise = Lead.countDocuments({
      ...filter,
      createdAt: {
        $gte: startOfYesterday,
        $lte: endOfYesterday,
      },
    });

    // =========================
    // PARALLEL EXECUTION
    // =========================

    const [
      totalLeads,
      convertedLeads,
      todaysLeads,
      previousMonthLeads,
      currentMonthLeads,
      previousMonthConverted,
      currentMonthConverted,
      yesterdayLeads,
    ] = await Promise.all([
      totalLeadsPromise,
      convertedLeadsPromise,
      todaysLeadsPromise,
      previousMonthLeadsPromise,
      currentMonthLeadsPromise,
      previousMonthConvertedPromise,
      currentMonthConvertedPromise,
      yesterdayLeadsPromise,
    ]);

    // =========================
    // HELPERS
    // =========================

    const calculateGrowth = (
      current: number,
      previous: number
    ) => {
      if (previous === 0 && current > 0) {
        return 100;
      }

      if (previous === 0) {
        return 0;
      }

      return Number(
        (((current - previous) / previous) * 100).toFixed(2)
      );
    };

    // =========================
    // CALCULATIONS
    // =========================

    // conversion rate
    const conversionRate =
      totalLeads > 0
        ? ((convertedLeads / totalLeads) * 100).toFixed(2)
        : "0";

    // total lead growth
    const totalLeadGrowth = calculateGrowth(
      currentMonthLeads,
      previousMonthLeads
    );

    // converted lead growth
    const convertedLeadGrowth = calculateGrowth(
      currentMonthConverted,
      previousMonthConverted
    );

    // today lead growth vs yesterday
    const todaysLeadGrowth = calculateGrowth(
      todaysLeads,
      yesterdayLeads
    );

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: {
        totalLeads,
        convertedLeads,
        todaysLeads,

        conversionRate: `${conversionRate}%`,

        growth: {
          totalLeads: {
            currentMonth: currentMonthLeads,
            previousMonth: previousMonthLeads,
            percentage: `${totalLeadGrowth}%`,
            trend:
              totalLeadGrowth >= 0 ? "increase" : "decrease",
          },

          convertedLeads: {
            currentMonth: currentMonthConverted,
            previousMonth: previousMonthConverted,
            percentage: `${convertedLeadGrowth}%`,
            trend:
              convertedLeadGrowth >= 0
                ? "increase"
                : "decrease",
          },

          todaysLeads: {
            today: todaysLeads,
            yesterday: yesterdayLeads,
            percentage: `${todaysLeadGrowth}%`,
            trend:
              todaysLeadGrowth >= 0
                ? "increase"
                : "decrease",
          },
        },
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