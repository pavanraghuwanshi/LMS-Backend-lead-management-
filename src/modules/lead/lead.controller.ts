import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../../middlewares/auth.middleware";
import Lead from "./lead.model";
import Company from "../../RocketsalesModels/Company";
import Branch from "../../RocketsalesModels/Branch";
import SuperAdmin from "../../RocketsalesModels/spradmin";
import Supervisor from "../../RocketsalesModels/Supervisor";
import Salesman from "../../RocketsalesModels/Salesman";

import { buildLeadFilter, buildHierarchyData } from "../../utils/hierarchy.util";
import Client from "../ClientsModule/client.model";


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
export const getLeads = async (
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

    let { page = 1, limit = 10, search = "", leadFrom } =
      req.query as any;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const rawFilter: any = buildLeadFilter(
      user,
      req.query
    );

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
          "createdById",
        ].includes(key)
      ) {
        filter[key] = mongoose.Types.ObjectId.isValid(value)
          ? new mongoose.Types.ObjectId(value)
          : value;
      } else {
        filter[key] = value;
      }
    });

    if (leadFrom) {
      filter.leadFrom = leadFrom;
    };
    
    if (search && search.trim() !== "") {
      filter.$or = [
        {
          leadTitle: {
            $regex: search,
            $options: "i",
          },
        },
        {
          shopName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const total = await Lead.countDocuments(filter);

    const leads: any[] = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const companyIds = [
      ...new Set(
        leads
          .filter((x: any) => x.companyId)
          .map((x: any) => x.companyId.toString())
      ),
    ];

    const branchIds = [
      ...new Set(
        leads
          .filter((x: any) => x.branchId)
          .map((x: any) => x.branchId.toString())
      ),
    ];

    const supervisorIds = [
      ...new Set(
        leads
          .filter((x: any) => x.supervisorId)
          .map((x: any) =>
            x.supervisorId.toString()
          )
      ),
    ];

    const salesmanIds = [
      ...new Set(
        leads
          .filter((x: any) => x.salesmanId)
          .map((x: any) =>
            x.salesmanId.toString()
          )
      ),
    ];

    const clientIds = [
      ...new Set(
        leads
          .filter((x: any) => x.clientId)
          .map((x: any) => x.clientId.toString())
      ),
    ];

    const companies: any[] = await Company.find(
      {
        _id: { $in: companyIds },
      },
      {
        companyName: 1,
      }
    ).lean();

    const branches: any[] = await Branch.find(
      {
        _id: { $in: branchIds },
      },
      {
        branchName: 1,
      }
    ).lean();

    const supervisors: any[] =
      await Supervisor.find(
        {
          _id: { $in: supervisorIds },
        },
        {
          supervisorName: 1,
        }
      ).lean();

    const salesmen: any[] = await Salesman.find(
      {
        _id: { $in: salesmanIds },
      },
      {
        salesmanName: 1,
      }
    ).lean();

    const clients: any[] = await Client.find(
      {
        _id: { $in: clientIds },
      },
      {
        clientName: 1,
        email: 1,
        phone: 1,
        address: 1,

        companyId: 1,
        branchId: 1,
        supervisorId: 1,
        salesmanId: 1,

        createdAt: 1,
        updatedAt: 1,
        __v: 1,
      }
    ).lean();

    const companyMap = new Map(
      companies.map((x: any) => [
        x._id.toString(),
        x.companyName,
      ])
    );

    const branchMap = new Map(
      branches.map((x: any) => [
        x._id.toString(),
        x.branchName,
      ])
    );

    const supervisorMap = new Map(
      supervisors.map((x: any) => [
        x._id.toString(),
        x.supervisorName,
      ])
    );

    const salesmanMap = new Map(
      salesmen.map((x: any) => [
        x._id.toString(),
        x.salesmanName,
      ])
    );

    const clientMap = new Map(
      clients.map((x: any) => [
        x._id.toString(),
        {
          _id: x._id,
          clientName: x.clientName,
          email: x.email,
          phone: x.phone,
          address: x.address,

          companyId: x.companyId
            ? {
              _id: x.companyId,
              companyName:
                companyMap.get(
                  x.companyId.toString()
                ) || "",
            }
            : null,

          branchId: x.branchId
            ? {
              _id: x.branchId,
              branchName:
                branchMap.get(
                  x.branchId.toString()
                ) || "",
            }
            : null,

          supervisorId: x.supervisorId
            ? {
              _id: x.supervisorId,
              supervisorName:
                supervisorMap.get(
                  x.supervisorId.toString()
                ) || "",
            }
            : null,

          salesmanId: x.salesmanId
            ? {
              _id: x.salesmanId,
              salesmanName:
                salesmanMap.get(
                  x.salesmanId.toString()
                ) || "",
            }
            : null,

          createdAt: x.createdAt,
          updatedAt: x.updatedAt,
          __v: x.__v,
        },
      ])
    );

    const finalLeads = leads.map((lead: any) => {
      return {
        _id: lead._id,

        leadTitle: lead.leadTitle,
        shopName: lead.shopName,

        status: lead.status,
        notes: lead.notes,
        leadFrom: lead.leadFrom,

        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,

        clientId: lead.clientId
          ? clientMap.get(
            lead.clientId.toString()
          ) || null
          : null,

        companyId: lead.companyId
          ? {
            _id: lead.companyId,
            companyName:
              companyMap.get(
                lead.companyId.toString()
              ) || "",
          }
          : null,

        branchId: lead.branchId
          ? {
            _id: lead.branchId,
            branchName:
              branchMap.get(
                lead.branchId.toString()
              ) || "",
          }
          : null,

        supervisorId: lead.supervisorId
          ? {
            _id: lead.supervisorId,
            supervisorName:
              supervisorMap.get(
                lead.supervisorId.toString()
              ) || "",
          }
          : null,

        salesmanId: lead.salesmanId
          ? {
            _id: lead.salesmanId,
            salesmanName:
              salesmanMap.get(
                lead.salesmanId.toString()
              ) || "",
          }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Leads fetched successfully",
      data: finalLeads,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
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


