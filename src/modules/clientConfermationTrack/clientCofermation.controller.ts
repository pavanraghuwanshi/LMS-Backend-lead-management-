import { Request, Response } from "express";
import mongoose from "mongoose";

import ClientConfermation from "./clientConfermation.model";
import Client from "../ClientsModule/client.model";
import Appointment from "../AppointmentModule/Appointment.model";
import Company from "../../RocketsalesModels/Company";
import Branch from "../../RocketsalesModels/Branch";
import Supervisor from "../../RocketsalesModels/Supervisor";
import Salesman from "../../RocketsalesModels/Salesman";
import { buildLeadFilter } from "../../utils/hierarchy.util";

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
      search = "",
      installationDateFrom,
      installationDateTo,
      clientFeedback,
      clientConfirmation,
      createdByRole,
    } = req.query as any;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    const filter: any = buildLeadFilter(
      user,
      req.query
    );

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

    if (clientFeedback) {
      filter.clientFeedback = {
        $regex: clientFeedback,
        $options: "i",
      };
    }

    if (clientConfirmation) {
      filter.clientConfirmation =
        clientConfirmation;
    }

    if (createdByRole) {
      filter.createdByRole = createdByRole;
    }

    if (
      installationDateFrom ||
      installationDateTo
    ) {
      filter.installationDate = {};

      if (installationDateFrom) {
        filter.installationDate.$gte =
          new Date(
            installationDateFrom
          );
      }

      if (installationDateTo) {
        filter.installationDate.$lte =
          new Date(
            installationDateTo
          );
      }
    }

    const pipeline: any[] = [
      {
        $match: filter,
      },

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

      {
        $lookup: {
          from: "appointments",
          localField: "appointmentId",
          foreignField: "_id",
          as: "appointmentId",
        },
      },

      {
        $unwind: {
          path: "$appointmentId",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (
      search &&
      search.trim() !== ""
    ) {
      const searchWords = search
        .trim()
        .split(" ")
        .filter(Boolean);

      pipeline.push({
        $match: {
          $or: [
            {
              $and: searchWords.map(
                (word: string) => ({
                  "leadId.leadTitle": {
                    $regex: word,
                    $options: "i",
                  },
                })
              ),
            },

            {
              $and: searchWords.map(
                (word: string) => ({
                  "clientData.clientName":
                    {
                      $regex: word,
                      $options: "i",
                    },
                })
              ),
            },
          ],
        },
      });
    }

    pipeline.push(
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
          ],

          total: [
            {
              $count: "count",
            },
          ],
        },
      }
    );

    const result =
      await ClientConfermation.aggregate(
        pipeline
      );

    const confirmations: any[] =
      result[0]?.data || [];

    const total =
      result[0]?.total?.[0]?.count || 0;

    const companyIds = [
      ...new Set(
        confirmations
          .filter(
            (x: any) => x.companyId
          )
          .map((x: any) =>
            x.companyId.toString()
          )
      ),
    ].map(
      (id: string) =>
        new mongoose.Types.ObjectId(id)
    );

    const branchIds = [
      ...new Set(
        confirmations
          .filter(
            (x: any) => x.branchId
          )
          .map((x: any) =>
            x.branchId.toString()
          )
      ),
    ].map(
      (id: string) =>
        new mongoose.Types.ObjectId(id)
    );

    const supervisorIds = [
      ...new Set(
        confirmations
          .filter(
            (x: any) =>
              x.supervisorId
          )
          .map((x: any) =>
            x.supervisorId.toString()
          )
      ),
    ].map(
      (id: string) =>
        new mongoose.Types.ObjectId(id)
    );

    const salesmanIds = [
      ...new Set(
        confirmations
          .filter(
            (x: any) => x.salesmanId
          )
          .map((x: any) =>
            x.salesmanId.toString()
          )
      ),
    ].map(
      (id: string) =>
        new mongoose.Types.ObjectId(id)
    );

    const companies: any[] =
      await Company.find(
        {
          _id: { $in: companyIds },
        },
        {
          companyName: 1,
        }
      ).lean();

    const branches: any[] =
      await Branch.find(
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

    const salesmen: any[] =
      await Salesman.find(
        {
          _id: { $in: salesmanIds },
        },
        {
          salesmanName: 1,
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

    const finalData =
      confirmations.map(
        (confirmation: any) => {
          return {
            ...confirmation,

            leadId: confirmation.leadId
              ? {
                  _id:
                    confirmation.leadId
                      ._id,

                  leadTitle:
                    confirmation.leadId
                      .leadTitle,

                  clientId:
                    confirmation.clientData
                      ? {
                          _id:
                            confirmation
                              .clientData
                              ._id,

                          clientName:
                            confirmation
                              .clientData
                              .clientName,
                        }
                      : null,
                }
              : null,

            companyId:
              confirmation.companyId
                ? {
                    _id:
                      confirmation.companyId,

                    companyName:
                      companyMap.get(
                        confirmation.companyId.toString()
                      ) || "",
                  }
                : null,

            branchId:
              confirmation.branchId
                ? {
                    _id:
                      confirmation.branchId,

                    branchName:
                      branchMap.get(
                        confirmation.branchId.toString()
                      ) || "",
                  }
                : null,

            supervisorId:
              confirmation.supervisorId
                ? {
                    _id:
                      confirmation.supervisorId,

                    supervisorName:
                      supervisorMap.get(
                        confirmation.supervisorId.toString()
                      ) || "",
                  }
                : null,

            salesmanId:
              confirmation.salesmanId
                ? {
                    _id:
                      confirmation.salesmanId,

                    salesmanName:
                      salesmanMap.get(
                        confirmation.salesmanId.toString()
                      ) || "",
                  }
                : null,
          };
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Client confirmations fetched successfully",

      data: finalData,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(
          total / limit
        ),
      },
    });
  } catch (error: any) {
    console.log(
      "❌ ERROR GET CLIENT CONFIRMATION:",
      error
    );

    return res.status(400).json({
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
      clientConfirmation: req.body.clientConfirmation,
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