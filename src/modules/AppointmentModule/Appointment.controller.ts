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
export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    let { page = 1, limit = 10, search = "", startDate, endDate } = req.query as any;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let filter: any = buildLeadFilter(user, req.query);

    // DATE FILTER
    if (startDate || endDate) {
      filter.meetingDate = {};
      if (startDate) filter.meetingDate.$gte = new Date(startDate);
      if (endDate) filter.meetingDate.$lte = new Date(endDate);
    }

    // SEARCH
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { clientName: regex },
        { clientEmail: regex },
        { shopName: regex },
        { meetingType: regex },
        { status: regex },
      ];
    }
const [appointments, total] = await Promise.all([
  Appointment.find(filter)
    .sort({ meetingDate: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "leadId",
      select: "leadTitle clientId",
      populate: {
        path: "clientId",
        select: "clientName" 
      }
    })
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
  Appointment.countDocuments(filter),
]);

    return res.json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
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
export const createClientFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { appointmentId, leadId, clientConfrmation,installationDate } = req.body;

    console.log("gggggggggggg")

    const appointment = await Appointment.findById(appointmentId)
                            .populate({
                              path: "leadId",
                              select: "clientId -_id",
                              populate: {
                                path: "clientId",
                                select: "clientName -_id",
                              },
                            });

    if (!appointment && !appointment?.leadId.clientId.clientName)
      return res.status(404).json({ message: "Appointment not found" });

    const feedback = await ClientConfermation.create({
      ...req.body,
      appointmentId,
      leadId,

      ...buildHierarchyData(user),

      createdById: user.id,
      createdByRole: user.role,
    });

    // AUTO CLIENT CREATE
    if (clientConfrmation === "YES") {

      await Client.create({
        clientName: appointment?.leadId.clientId.clientName,
        contact: {
          phone: appointment.clientPhone,
          email: appointment.clientEmail,
        },
        installationDate,
        appointmentId,
        leadId,
      });

      appointment.status = "Completed";
      await appointment.save();
    }

    return res.status(201).json({
      message: "Feedback saved",
      data: feedback,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};