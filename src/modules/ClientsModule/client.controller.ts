import { Request, Response } from "express";
import  Client  from "./client.model";
import { buildHierarchyData, buildLeadFilter } from "../../utils/hierarchy.util";
import { AuthRequest } from "../../middlewares/auth.middleware";

// ➕ Create Client
export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔥 Build hierarchy (same as Lead)
    const hierarchy = buildHierarchyData(user);

    const client = await Client.create({
      ...req.body,
      ...hierarchy,

      createdById: user.id,
      createdByRole: user.role,
    });

    return res.status(201).json({
      message: "Client created successfully",
      data: client,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error creating client",
      error: error.message,
    });
  }
};

// 📥 Get All Clients
export const getClients = async (req: AuthRequest, res: Response) => {
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

    // 🔥 SAME FILTER (no change)
    let filter = buildLeadFilter(user, req.query);

    // 🔍 Search
    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "companyId",
          select: "companyName",
        })
        .populate({
          path: "branchId",
          select: "branchName",
        })
        .populate({
          path: "supervisorId",
          select: "supervisorName",
        })
        .populate({
          path: "salesmanId",
          select: "salesmanName",
        }),

      Client.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Clients fetched successfully",
      data: clients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error fetching clients",
      error: error.message,
    });
  }
};

// 📄 Get Single Client
export const getClientById = async (req: any, res: Response) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Error fetching client", error });
  }
};

// ✏️ Update Client
export const updateClient = async (req: any, res: Response) => {
  try {
    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      req.body,
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Error updating client", error });
  }
};

// ❌ Delete Client
export const deleteClient = async (req: any, res: Response) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting client", error });
  }
};