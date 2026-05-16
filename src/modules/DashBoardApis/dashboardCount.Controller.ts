import { Response } from "express";
import Lead from "../lead/lead.model";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { buildLeadFilter } from "../../utils/hierarchy.util";
import mongoose from "mongoose";
import Appointment from "../AppointmentModule/Appointment.model";

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


export const getLeadGrowthMonthWise = async (
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
    const filter: any = buildLeadFilter(
      user,
      req.query
    );

    // =========================
    // CONVERT TO OBJECT IDS
    // =========================

    const objectIdFields = [
      "companyId",
      "branchId",
      "supervisorId",
      "salesmanId",
      "clientId",
      "createdById",
    ];

    objectIdFields.forEach((field) => {
      if (
        filter[field] &&
        mongoose.Types.ObjectId.isValid(
          filter[field]
        )
      ) {
        filter[field] =
          new mongoose.Types.ObjectId(
            filter[field]
          );
      }
    });

    const now = new Date();

    // last 12 months
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - 11,
      1
    );

    // =========================
    // FINAL FILTER
    // =========================

    const finalFilter = {
      ...filter,
      createdAt: {
        $gte: startDate,
      },
    };


    // =========================
    // MONTH WISE LEADS
    // =========================

    const monthlyLeads = await Lead.aggregate([
      {
        $match: finalFilter,
      },

      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },

          totalLeads: {
            $sum: 1,
          },

          convertedLeads: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "completed",
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);


    // =========================
    // FORMAT RESPONSE
    // =========================

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedData = monthlyLeads.map(
      (item) => {
        const totalLeads =
          item.totalLeads;

        const convertedLeads =
          item.convertedLeads;

        const conversionRate =
          totalLeads > 0
            ? (
                (convertedLeads /
                  totalLeads) *
                100
              ).toFixed(2)
            : "0";

        return {
          year: item._id.year,
          month: item._id.month,

          monthName:
            monthNames[
              item._id.month - 1
            ],

          totalLeads,
          convertedLeads,

          conversionRate: `${conversionRate}%`,
        };
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Month wise lead growth fetched successfully",

      data: formattedData,
    });
  } catch (error: any) {
    console.error(
      "Month Wise Lead Growth Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


// ✅ Get Appointment Reminders
export const getAppointmentReminders = async (
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

    let {
      page = 1,
      limit = 10,
      type = "today", // today | upcoming | missed
    } = req.query as any;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    const now = new Date();

    // ✅ today start
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // ✅ today end
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // ✅ next 1 hour
    const nextHour = new Date(
      now.getTime() + 60 * 60 * 1000
    );

    // ✅ hierarchy filter
    const filter: any = buildLeadFilter(
      user,
      req.query
    );

    // ✅ convert object ids
    if (filter.companyId) {
      filter.companyId =
        new mongoose.Types.ObjectId(
          filter.companyId
        );
    }

    if (filter.branchId) {
      filter.branchId =
        new mongoose.Types.ObjectId(
          filter.branchId
        );
    }

    if (filter.supervisorId) {
      filter.supervisorId =
        new mongoose.Types.ObjectId(
          filter.supervisorId
        );
    }

    if (filter.salesmanId) {
      filter.salesmanId =
        new mongoose.Types.ObjectId(
          filter.salesmanId
        );
    }

    // =====================================================
    // ✅ TYPE BASED FILTER
    // =====================================================

    let dateFilter: any = {};

    let reminderType = "today";

    let shortInfoText =
      "Today's appointment with ";

    let sortOrder: any = {
      meetingDate: 1,
    };

    if (type === "upcoming") {
      reminderType = "upcoming";

      shortInfoText =
        "Upcoming meeting with ";

      dateFilter = {
        meetingDate: {
          $gte: now,
          $lte: nextHour,
        },
      };

      sortOrder = {
        meetingDate: 1,
      };
    }

    else if (type === "missed") {
      reminderType = "missed";

      shortInfoText =
        "Missed appointment with ";

      dateFilter = {
        meetingDate: {
          $lt: now,
        },
      };

      sortOrder = {
        meetingDate: -1,
      };
    }

    else {
      reminderType = "today";

      shortInfoText =
        "Today's appointment with ";

      dateFilter = {
        meetingDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      };

      sortOrder = {
        meetingDate: 1,
      };
    }

    // =====================================================
    // ✅ PIPELINE
    // =====================================================

    const pipeline: any[] = [
      {
        $match: {
          ...filter,

          ...dateFilter,

          status: {
            $nin: [
              "completed",
              "cancelled",
            ],
          },
        },
      },

      // ✅ Lead
      {
        $lookup: {
          from: "leads",
          let: { leadId: "$leadId" },

          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    "$$leadId",
                  ],
                },
              },
            },

            {
              $project: {
                _id: 1,
                leadTitle: 1,
                clientId: 1,
              },
            },
          ],

          as: "leadId",
        },
      },

      {
        $unwind: {
          path: "$leadId",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Client
      {
        $lookup: {
          from: "clients",

          let: {
            clientId:
              "$leadId.clientId",
          },

          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    "$$clientId",
                  ],
                },
              },
            },

            {
              $project: {
                _id: 1,
                clientName: 1,
                mobileNumber: 1,
              },
            },
          ],

          as: "clientData",
        },
      },

      {
        $unwind: {
          path: "$clientData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Company
      {
        $lookup: {
          from: "companies",

          localField: "companyId",

          foreignField: "_id",

          pipeline: [
            {
              $project: {
                _id: 1,
                companyName: 1,
              },
            },
          ],

          as: "companyId",
        },
      },

      {
        $unwind: {
          path: "$companyId",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Branch
      {
        $lookup: {
          from: "branches",

          localField: "branchId",

          foreignField: "_id",

          pipeline: [
            {
              $project: {
                _id: 1,
                branchName: 1,
              },
            },
          ],

          as: "branchId",
        },
      },

      {
        $unwind: {
          path: "$branchId",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Supervisor
      {
        $lookup: {
          from: "supervisors",

          localField:
            "supervisorId",

          foreignField: "_id",

          pipeline: [
            {
              $project: {
                _id: 1,
                supervisorName: 1,
              },
            },
          ],

          as: "supervisorId",
        },
      },

      {
        $unwind: {
          path: "$supervisorId",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Salesman
      {
        $lookup: {
          from: "salesmen",

          localField: "salesmanId",

          foreignField: "_id",

          pipeline: [
            {
              $project: {
                _id: 1,
                salesmanName: 1,
              },
            },
          ],

          as: "salesmanId",
        },
      },

      {
        $unwind: {
          path: "$salesmanId",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Reminder fields
      {
        $addFields: {
          reminderType,

          shortInfo: {
            $concat: [
              shortInfoText,

              {
                $ifNull: [
                  "$clientData.clientName",
                  "Client",
                ],
              },
            ],
          },
        },
      },

      // ✅ Sort
      {
        $sort: sortOrder,
      },

      // ✅ Pagination
      {
        $facet: {
          data: [
            {
              $skip: skip,
            },

            {
              $limit: limit,
            },
          ],

          total: [
            {
              $count: "count",
            },
          ],
        },
      },
    ];

    const result =
      await Appointment.aggregate(
        pipeline
      );

    const reminders =
      result[0]?.data || [];

    const total =
      result[0]?.total?.[0]?.count ||
      0;

    // =====================================================
    // ✅ RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      type: reminderType,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(
          total / limit
        ),
      },

      data: reminders,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};