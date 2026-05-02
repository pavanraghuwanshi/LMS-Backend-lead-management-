import { Request, Response } from "express";
import  Client  from "./client.model";
import { buildHierarchyData } from "../../utils/hierarchy.util";
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
export const getClients = async (req: any, res: Response) => {
  try {
    const { search = "" } = req.query;

    const query: any = {
      companyId: req.user.companyId,
      clientName: { $regex: search, $options: "i" },
    };

    const clients = await Client.find(query)
      .populate("companyId", "companyName")
      .populate("branchId", "branchName")
      .sort({ createdAt: -1 });

    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: "Error fetching clients", error });
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