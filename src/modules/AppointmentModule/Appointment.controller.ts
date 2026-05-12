import { Response } from "express";
import Appointment from "./Appointment.model";
import Lead from "../lead/lead.model";
import Client from "../ClientsModule/client.model";
import ClientConfermation from "../clientConfermationTrack/clientConfermation.model";

import { AuthRequest } from "../../middlewares/auth.middleware";
import { buildHierarchyData, buildLeadFilter } from "../../utils/hierarchy.util";
import Company from "../../RocketsalesModels/Company";
import Branch from "../../RocketsalesModels/Branch";
import Supervisor from "../../RocketsalesModels/Supervisor";
import Salesman from "../../RocketsalesModels/Salesman";
import mongoose from "mongoose";











// ✅ Get Pending Leads
export const getNotAssignedLeadGen = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const filter = buildLeadFilter(user, { status: "Pending" });

    const leads = await Lead.find(filter).select(
      "leadTitle _id companyId branchId supervisorId salesmanId clientName"
    );

    if (!leads.length) {
      return res.status(404).json({
        success: false,
        message: "No accessible pending leads found",
      });
    }

    return res.json({
      success: true,
      data: leads,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};



// ✅ Get Appointments
export const getAppointments = async (
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
      search = "",
      startDate,
      endDate,
    } = req.query as any;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    const filter: any = buildLeadFilter(
      user,
      req.query
    );

    if (filter.companyId) {
      filter.companyId = new mongoose.Types.ObjectId(
        filter.companyId
      );
    }

    if (filter.branchId) {
      filter.branchId = new mongoose.Types.ObjectId(
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

    if (startDate || endDate) {
      filter.meetingDate = {};

      if (startDate) {
        filter.meetingDate.$gte = new Date(
          startDate
        );
      }

      if (endDate) {
        filter.meetingDate.$lte = new Date(
          endDate
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
                  $eq: ["$_id", "$$leadId"],
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
          let: { clientId: "$leadId.clientId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$clientId"],
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
    ];

    if (search && search.trim() !== "") {
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
                  "clientData.clientName": {
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
          meetingDate: -1,
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

    const result = await Appointment.aggregate(
      pipeline
    );

    const appointments: any[] =
      result[0]?.data || [];

    const total =
      result[0]?.total?.[0]?.count || 0;

    const companyIds = [
      ...new Set(
        appointments
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
        appointments
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
        appointments
          .filter(
            (x: any) => x.supervisorId
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
        appointments
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

    const finalAppointments =
      appointments.map((appointment: any) => {
        return {
          ...appointment,

          leadId: appointment.leadId
            ? {
                _id: appointment.leadId._id,

                leadTitle:
                  appointment.leadId
                    .leadTitle,

                clientId:
                  appointment.clientData
                    ? {
                        _id:
                          appointment
                            .clientData
                            ._id,

                        clientName:
                          appointment
                            .clientData
                            .clientName,
                      }
                    : null,
              }
            : null,

          companyId: appointment.companyId
            ? {
                _id:
                  appointment.companyId,

                companyName:
                  companyMap.get(
                    appointment.companyId.toString()
                  ) || "",
              }
            : null,

          branchId: appointment.branchId
            ? {
                _id:
                  appointment.branchId,

                branchName:
                  branchMap.get(
                    appointment.branchId.toString()
                  ) || "",
              }
            : null,

          supervisorId:
            appointment.supervisorId
              ? {
                  _id:
                    appointment.supervisorId,

                  supervisorName:
                    supervisorMap.get(
                      appointment.supervisorId.toString()
                    ) || "",
                }
              : null,

          salesmanId:
            appointment.salesmanId
              ? {
                  _id:
                    appointment.salesmanId,

                  salesmanName:
                    salesmanMap.get(
                      appointment.salesmanId.toString()
                    ) || "",
                }
              : null,
        };
      });

    return res.status(200).json({
      success: true,
      data: finalAppointments,

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
      message: error.message,
    });
  }
};



// ✅ Create Appointment (UPDATED WITH HIERARCHY)
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { leadId } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const hierarchy = buildHierarchyData(user);

    const appointment = await Appointment.create({
      ...req.body,
      ...hierarchy,

      createdById: user.id,
      createdByRole: user.role,
    });

    // 🔥 Update Lead
    await Lead.findByIdAndUpdate(leadId, {
      status: "In-progress",
      ...hierarchy,
    });

    return res.status(201).json({
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};



// ✅ Update Appointment
export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (!["Scheduled", "Rescheduled"].includes(appointment.status)) {
      return res.status(403).json({
        message: "Only Scheduled or Rescheduled can be edited",
      });
    }

    Object.assign(appointment, req.body);
    await appointment.save();

    if (req.body.status) {
      await Lead.findByIdAndUpdate(appointment.leadId, {
        status: req.body.status,
      });
    }

    return res.json({
      message: "Updated successfully",
      data: appointment,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};



// ✅ Delete Appointment (Hierarchy NOT needed here)
export const deleteAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appt = await Appointment.findById(id);
    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });

    await appt.deleteOne();

    return res.json({
      message: "Deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};



// ✅ Create Client Feedback
export const createClientFeedback = async (
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

    const {
      appointmentId,
      leadId,
      clientConfirmation,
      installationDate,
    } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate({
      path: "leadId",
      select: "clientId status",
      populate: {
        path: "clientId",
        select: "clientName",
      },
    });

    if (
      !appointment ||
      !appointment?.leadId ||
      !appointment?.leadId?.clientId
    ) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // ✅ SAVE FEEDBACK
    const feedback = await ClientConfermation.create({
      ...req.body,
      appointmentId,
      leadId,

      ...buildHierarchyData(user),

      createdById: user.id,
      createdByRole: user.role,
    });

    // ✅ IF CLIENT CONFIRMATION YES
    if (clientConfirmation === "YES") {
      await Client.create({
        clientName: appointment?.leadId?.clientId?.clientName,
        contact: {
          phone: appointment.clientPhone,
          email: appointment.clientEmail,
        },
        installationDate,
        appointmentId,
        leadId,
      });

      // Appointment Completed
      appointment.status = "Completed";
      await appointment.save();
      await Lead.findByIdAndUpdate(leadId, {
        status: "Completed",
      });
    }

    // ✅ IF CLIENT CONFIRMATION NO
    if (clientConfirmation === "NO") {
      // Appointment Completed
      appointment.status = "Completed";
      await appointment.save();

      // Lead Cancel
      await Lead.findByIdAndUpdate(leadId, {
        status: "Cancelled",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Feedback saved successfully",
      data: feedback,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};