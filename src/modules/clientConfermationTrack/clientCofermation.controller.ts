import { Request, Response } from "express";
import mongoose from "mongoose";

import ClientConfermation from "./clientConfermation.model";
import Client from "../ClientsModule/client.model";
import Appointment from "../AppointmentModule/Appointment.model";
import Company from "../../RocketsalesModels/Company";
import Branch from "../../RocketsalesModels/Branch";
import Supervisor from "../../RocketsalesModels/Supervisor";
import Salesman from "../../RocketsalesModels/Salesman";

interface AuthRequest extends Request {
  user?: any;
}

// ==============================
// GET CLIENT CONFIRMATION
// ==============================
export const getClientConfermation = async (
  req: AuthRequest,
  res: Response
): Promise<Response | void> => {
  try {
    const {
      role,
      id,
      companyId,
      branchId,
    } = req.user;

    const {
      clientFeedback,
      clientConfrmation,
      installationDateFrom,
      installationDateTo,
      createdByRole,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let query: any = {};

    // =======================================
    // ROLE BASED FILTER
    // =======================================
    switch (role) {
      case "superadmin":
        break;

      case "company":
        query.companyId = id;
        break;

      case "branch":
        query.branchId = id;
        break;

      case "supervisor":
      case "salesman":
        query.branchId = branchId;
        break;

      default:
        return res.status(403).json({
          success: false,
          message: "Role not allowed",
        });
    }

    // =======================================
    // FIELD FILTERS
    // =======================================
    if (clientFeedback) {
      query.clientFeedback = {
        $regex: clientFeedback,
        $options: "i",
      };
    }

    if (clientConfrmation) {
      query.clientConfrmation = clientConfrmation;
    }

    if (createdByRole) {
      query.createdByRole = createdByRole;
    }

    // =======================================
    // DATE FILTER
    // =======================================
    if (installationDateFrom || installationDateTo) {
      query.installationDate = {};

      if (installationDateFrom) {
        query.installationDate.$gte = new Date(
          installationDateFrom as string
        );
      }

      if (installationDateTo) {
        query.installationDate.$lte = new Date(
          installationDateTo as string
        );
      }
    }

    // =======================================
    // SEARCH FILTER
    // =======================================
    if (search && String(search).trim()) {
      const regex = new RegExp(
        String(search).trim(),
        "i"
      );

      query.$or = [
        { clientFeedback: regex },
        { clientConfrmation: regex },
        { createdByRole: regex },
      ];
    }

    // =======================================
    // FETCH DATA
    // =======================================
    const [confirmations, total] = await Promise.all([
      ClientConfermation.find(query)

        .sort({ createdAt: -1 })

        .skip(skip)

        .limit(limitNumber)

        // =======================================
        // LEAD + CLIENT
        // =======================================
        .populate({
            path: "leadId",
            select: "leadTitle clientId",
            populate: {
                path: "clientId",
                select: "clientName" 
            }
            })

        // =======================================
        // COMPANY
        // =======================================
        .populate({
          path: "companyId",
          model: Company,
          select: "companyName",
        })

        // =======================================
        // BRANCH
        // =======================================
        .populate({
          path: "branchId",
          model: Branch,
          select: "branchName",
        })

        // =======================================
        // SUPERVISOR
        // =======================================
        .populate({
          path: "supervisorId",
          model: Supervisor,
          select: "supervisorName",
        })

        // =======================================
        // SALESMAN
        // =======================================
        .populate({
          path: "salesmanId",
          model: Salesman,
          select: "salesmanName",
        })

        // =======================================
        // APPOINTMENT
        // =======================================
        .populate("appointmentId","status date",),
      ClientConfermation.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Client confirmations fetched successfully",
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(
        total / limitNumber
      ),
      data: confirmations,
    });
  } catch (error: any) {
    console.error(
      "❌ Error fetching client confirmations:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// CREATE CLIENT CONFIRMATION
// ==============================
export const createClientConfermation = async (
  req: AuthRequest,
  res: Response
): Promise<Response | void> => {
  try {
    const {
      role,
      id,
      companyId,
      branchId,
    } = req.user;

    // ROLE CHECK
    if (
      !["company", "branch", "supervisor", "salesman"].includes(
        role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Not allowed to create client confermation",
      });
    }

    let payload: any = {
      clientFeedback: req.body.clientFeedback,
      clientConfrmation: req.body.clientConfrmation,
      installationDate: req.body.installationDate,
      followUpDate: req.body.followUpDate,
      clientName: req.body.clientName,
      type: req.body.type,
      contact: req.body.contact,
      appointmentId: req.body.appointmentId,
      leadId: req.body.leadId,
      createdByRole: role,
      createdById: id,
    };

    // ==============================
    // ROLE BASED ASSIGNMENT
    // ==============================
    if (role === "company") {
      payload.companyId = id;
      payload.branchId = req.body.branchId || null;
      payload.supervisorId =
        req.body.supervisorId || null;
      payload.salesmanId = req.body.salesmanId || null;
    }

    if (role === "branch") {
      payload.companyId = companyId;
      payload.branchId = id;
      payload.supervisorId =
        req.body.supervisorId || null;
      payload.salesmanId = req.body.salesmanId || null;
    }

    if (role === "supervisor") {
      payload.companyId = companyId;
      payload.branchId = branchId;
      payload.supervisorId = id;
      payload.salesmanId = req.body.salesmanId || null;
    }

    if (role === "salesman") {
      payload.companyId = companyId;
      payload.branchId = branchId;
      payload.salesmanId = id;
    }

    const confirmation =
      await ClientConfermation.create(payload);

    return res.status(201).json({
      success: true,
      message:
        "Client confirmation created successfully",
      data: confirmation,
    });
  } catch (error: any) {
    console.error(
      "❌ Create client confirmation error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET CLIENT BY ID
// ==============================
export const getClientById = async (
  req: AuthRequest,
  res: Response
): Promise<Response | void> => {
  try {
    const client = await Client.findById(req.params.id)

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
      })

      .populate({
        path: "leadId",
        select: "leadTitle clientId",
        populate: {
          path: "clientId",
          select: "clientName",
        },
      })

      .populate("confirmationId")
      .populate("appointmentId");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// UPDATE CLIENT CONFIRMATION
// ==============================
export const updateClientConfermation = async (
  req: AuthRequest,
  res: Response
): Promise<Response | void> => {
  try {
    const {
      role,
      id,
      companyId,
      branchId,
    } = req.user;

    if (
      !["company", "branch", "supervisor"].includes(
        role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Not allowed to update client confirmation",
      });
    }

    let filter: any = {
      _id: req.params.id,
    };

    // ROLE FILTER
    if (role === "company") {
      filter.companyId = id;
    }

    if (role === "branch") {
      filter.companyId = companyId;
      filter.branchId = id;
    }

    if (role === "supervisor") {
      filter.companyId = companyId;
      filter.branchId = branchId;
      filter.supervisorId = id;
    }

    const confirmation =
      await ClientConfermation.findOneAndUpdate(
        filter,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!confirmation) {
      return res.status(404).json({
        success: false,
        message:
          "Client confirmation not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Client confirmation updated successfully",
      data: confirmation,
    });
  } catch (error: any) {
    console.error(
      "❌ Update confirmation error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// DELETE CLIENT CONFIRMATION
// ==============================
export const deleteClientConfermation = async (
  req: AuthRequest,
  res: Response
): Promise<Response | void> => {
  try {
    const {
      role,
      id,
      companyId,
      branchId,
    } = req.user;

    if (
      !["company", "branch", "supervisor"].includes(
        role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Not allowed to delete client confirmation",
      });
    }

    let filter: any = {
      _id: req.params.id,
    };

    // ROLE FILTER
    if (role === "company") {
      filter.companyId = id;
    }

    if (role === "branch") {
      filter.companyId = companyId;
      filter.branchId = id;
    }

    if (role === "supervisor") {
      filter.companyId = companyId;
      filter.branchId = branchId;
      filter.supervisorId = id;
    }

    const confirmation =
      await ClientConfermation.findOneAndDelete(filter);

    if (!confirmation) {
      return res.status(404).json({
        success: false,
        message:
          "Client confirmation not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Client confirmation deleted successfully",
    });
  } catch (error: any) {
    console.error(
      "❌ Delete confirmation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};