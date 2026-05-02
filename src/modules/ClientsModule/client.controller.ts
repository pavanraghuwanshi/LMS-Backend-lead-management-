import { Request, Response } from "express";
import  Client  from "./client.model";

// ➕ Create Client
export const createClient = async (req: any, res: Response) => {
  try {
    const { clientName, email, phone, address } = req.body;

    const client = await Client.create({
      clientName,
      email,
      phone,
      address,
      companyId: req.user.companyId,
      branchId: req.user.branchId,
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: "Error creating client", error });
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