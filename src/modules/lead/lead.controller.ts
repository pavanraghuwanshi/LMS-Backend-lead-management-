import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../../middlewares/auth.middleware";
import Lead from "./lead.model";
import Company from "../../RocketsalesModels/Company";
import Branch from "../../RocketsalesModels/Branch";
import SuperAdmin from "../../RocketsalesModels/spradmin";
import Supervisor from "../../RocketsalesModels/Supervisor";
import Salesman from "../../RocketsalesModels/Salesman";

import {buildLeadFilter, buildHierarchyData } from "../../utils/hierarchy.util";


export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔥 Get hierarchy from logged-in user
    const hierarchy = buildHierarchyData(user);

    const lead = await Lead.create({
      ...req.body,
      ...hierarchy,

      createdById: user.id,
      createdByRole: user.role,
    });

    return res.status(201).json({
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error creating lead",
      error: error.message,
    });
  }
};



//  Get All Leads With Pagination
export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // =========================
    // Pagination
    // =========================
    let { page = 1, limit = 10, search = "" } = req.query as any;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // =========================
    // Base Filter (NO CHANGE IN HIERARCHY)
    // =========================
    let rawFilter: any = buildLeadFilter(user, req.query);

    // =========================
    // ObjectId SAFE FILTER FIX
    // =========================
    const filter: any = {};

    Object.keys(rawFilter).forEach((key) => {
      const value = rawFilter[key];

      if (
        [
          "companyId",
          "branchId",
          "supervisorId",
          "salesmanId",
          "clientId",
        ].includes(key)
      ) {
        filter[key] = mongoose.Types.ObjectId.isValid(value)
          ? new mongoose.Types.ObjectId(value)
          : value;
      } else {
        filter[key] = value;
      }
    });

    // =========================
    // Aggregation Pipeline
    // =========================
    const pipeline: any[] = [
      { $match: filter },

      // CLIENT
      {
        $lookup: {
          from: "clients",
          localField: "clientId",
          foreignField: "_id",
          as: "clientId",
        },
      },
      { $unwind: { path: "$clientId", preserveNullAndEmptyArrays: true } },

      // COMPANY
      {
        $lookup: {
          from: "companies",
          localField: "companyId",
          foreignField: "_id",
          as: "companyId",
        },
      },
      { $unwind: { path: "$companyId", preserveNullAndEmptyArrays: true } },

      // BRANCH
      {
        $lookup: {
          from: "branches",
          localField: "branchId",
          foreignField: "_id",
          as: "branchId",
        },
      },
      { $unwind: { path: "$branchId", preserveNullAndEmptyArrays: true } },

      // SUPERVISOR
      {
        $lookup: {
          from: "supervisors",
          localField: "supervisorId",
          foreignField: "_id",
          as: "supervisorId",
        },
      },
      { $unwind: { path: "$supervisorId", preserveNullAndEmptyArrays: true } },

      // SALESMAN
      {
        $lookup: {
          from: "salesmen",
          localField: "salesmanId",
          foreignField: "_id",
          as: "salesmanId",
        },
      },
      { $unwind: { path: "$salesmanId", preserveNullAndEmptyArrays: true } },
    ];

    // =========================
    // SEARCH (leadTitle + clientName)
    // =========================
    if (search && search.trim() !== "") {
      pipeline.push({
        $match: {
          $or: [
            {
              leadTitle: {
                $regex: search,
                $options: "i",
              },
            },
            {
              "clientId.clientName": {
                $regex: search,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    // =========================
    // TOTAL COUNT
    // =========================
    const totalData = await Lead.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);

    const total = totalData[0]?.total || 0;

    // =========================
    // DATA
    // =========================
    const leads = await Lead.aggregate([
      ...pipeline,

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $project: {
          leadTitle: 1,
          clientName: 1,
          clientEmail: 1,
          clientPhone: 1,
          shopName: 1,
          status: 1,
          createdAt: 1,

          clientId: {
            _id: "$clientId._id",
            clientName: "$clientId.clientName",
            email: "$clientId.email",
            phone: "$clientId.phone",
            address: "$clientId.address",
          },

          companyId: {
            _id: "$companyId._id",
            companyName: "$companyId.companyName",
          },

          branchId: {
            _id: "$branchId._id",
            branchName: "$branchId.branchName",
          },

          supervisorId: {
            _id: "$supervisorId._id",
            supervisorName: "$supervisorId.supervisorName",
          },

          salesmanId: {
            _id: "$salesmanId._id",
            salesmanName: "$salesmanId.salesmanName",
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Leads fetched successfully",
      data: leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: "Error fetching leads",
      error: error.message,
    });
  }
};

//  Leads DropDown Api

export const getLeadDropdown = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    let { page = 1, limit = 10, search = "" } = req.query as any;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // ✅ role based filter
    const filter: any = buildLeadFilter(user, req.query);

    // ✅ aggregation needs ObjectId manually
    const objectIdFields = [
      "companyId",
      "branchId",
      "supervisorId",
      "salesmanId",
      "createdById",
    ];

    objectIdFields.forEach((field) => {
      if (
        filter[field] &&
        mongoose.Types.ObjectId.isValid(filter[field])
      ) {
        filter[field] = new mongoose.Types.ObjectId(filter[field]);
      }
    });

    // ✅ status filter
    filter.status = "new";

    const aggregationPipeline: any[] = [
      {
        $match: filter,
      },

      // ✅ join client collection
      {
        $lookup: {
          from: "clients", // 👈 check collection name once
          localField: "clientId",
          foreignField: "_id",
          as: "clientId",
        },
      },

      {
        $unwind: {
          path: "$clientId",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ search on leadTitle + clientName
      ...(search
        ? [
            {
              $match: {
                $or: [
                  {
                    leadTitle: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "clientId.clientName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                ],
              },
            },
          ]
        : []),

      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $facet: {
          data: [
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
            {
              $project: {
                _id: 1,
                leadTitle: 1,
                clientId: {
                  _id: "$clientId._id",
                  clientName: "$clientId.clientName",
                },
              },
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

    console.log("aggregationPipeline", aggregationPipeline);

    const result = await Lead.aggregate(aggregationPipeline);

    const leads = result[0]?.data || [];
    const total = result[0]?.total?.[0]?.count || 0;

    return res.status(200).json({
      message: "Lead dropdown fetched successfully",
      data: leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      message: "Error fetching lead dropdown",
      error: error.message,
    });
  }
};

// Get Single leads by id
export const getLeadById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.status(200).json({
      data: lead,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error fetching lead",
      error: error.message,
    });
  }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.status(200).json({
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error updating lead",
      error: error.message,
    });
  }
};

export const deleteLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.status(200).json({
      message: "Lead deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error deleting lead",
      error: error.message,
    });
  }
};


