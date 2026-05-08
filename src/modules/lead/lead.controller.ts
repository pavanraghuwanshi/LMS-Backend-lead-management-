import { Response } from "express";
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
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔢 Pagination
    let { page = 1, limit = 10, search = "" } = req.query as any;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔥 Role-based filter
    let filter = buildLeadFilter(user, req.query);

    // 🔍 Search
    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { clientEmail: { $regex: search, $options: "i" } },
        { clientPhone: { $regex: search, $options: "i" } },
        { shopName: { $regex: search, $options: "i" } },
      ];
    }

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("clientId","clientName email phone address")
        .populate({
        path: "companyId",
        model: Company,
        select: "companyName",
      })
        .populate({
        path: "branchId",
        model: Branch,
        select: "branchName",
      })
      .populate({
        path: "supervisorId",
        model: Supervisor,
        select: "supervisorName",
      })
      .populate({
        path: "salesmanId",
        model: Salesman,
        select: "salesmanName",
      }),

      Lead.countDocuments(filter),
    ]);

    return res.status(200).json({
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
    return res.status(500).json({
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

    // ✅ pagination
    let { page = 1, limit = 10, search = "" } = req.query as any;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔥 role based filter
    const filter: any = buildLeadFilter(user, req.query);

    // 🔍 search only on leadTitle
    if (search) {
      filter.leadTitle = {
        $regex: search,
        $options: "i",
      };
    }

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .select("_id leadTitle")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Lead.countDocuments(filter),
    ]);

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


