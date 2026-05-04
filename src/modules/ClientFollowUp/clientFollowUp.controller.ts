import { AuthRequest } from "../../middlewares/auth.middleware";
import { Response } from "express";
import { buildHierarchyData } from "../../utils/hierarchy.util";
import FollowUp from "./clientFollowUp.model";





export const createFollowUp = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({ message: "leadId is required" });
    }

    // 🔥 Same hierarchy logic
    const hierarchy = buildHierarchyData(user);

    const followUp = await FollowUp.create({
      ...req.body,
      ...hierarchy,

      createdById: user.id,
      createdByRole: user.role,
    });

    return res.status(201).json({
      message: "Follow-up created successfully",
      data: followUp,
    });

  } catch (error: any) {
    return res.status(500).json({
      message: "Error creating follow-up",
      error: error.message,
    });
  }
};



export const getFollowUps = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    let { page = 1, limit = 10, search = "", status, leadId } = req.query as any;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    let filter: any = {};

    if (status) filter.status = status;
    if (leadId) filter.leadId = leadId;

    if (search) {
      filter.remark = { $regex: search, $options: "i" };
    }

    // 🔥 Role-based filtering (optional)
    if (user?.role === "salesman") {
      filter.salesmanId = user.id;
    }

    const [data, total] = await Promise.all([
      FollowUp.find(filter)
        .populate("leadId")
        .populate("companyId", "companyName")
        .populate("branchId", "branchName")
        .populate("supervisorId", "name")
        .populate("salesmanId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      FollowUp.countDocuments(filter),
    ]);

    return res.json({
      total,
      page,
      limit,
      data,
    });

  } catch (error: any) {
    return res.status(500).json({
      message: "Error fetching follow-ups",
      error: error.message,
    });
  }
};




export const getFollowUpById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const data = await FollowUp.findById(id)
      .populate("leadId")
      .populate("companyId", "companyName")
      .populate("branchId", "branchName")
      .populate("supervisorId", "name")
      .populate("salesmanId", "name");

    if (!data) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    return res.json({ data });

  } catch (error: any) {
    return res.status(500).json({
      message: "Error fetching follow-up",
      error: error.message,
    });
  }
};


export const updateFollowUp = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await FollowUp.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    return res.json({
      message: "Follow-up updated",
      data: updated,
    });

  } catch (error: any) {
    return res.status(500).json({
      message: "Error updating follow-up",
      error: error.message,
    });
  }
};



export const deleteFollowUp = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await FollowUp.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    return res.json({
      message: "Follow-up deleted successfully",
    });

  } catch (error: any) {
    return res.status(500).json({
      message: "Error deleting follow-up",
      error: error.message,
    });
  }
};



export const getFollowUpsByLead = async (req: AuthRequest, res: Response) => {
  try {
    const { leadId } = req.params;

    const data = await FollowUp.find({ leadId })
      .sort({ createdAt: -1 });

    return res.json({ data });

  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};