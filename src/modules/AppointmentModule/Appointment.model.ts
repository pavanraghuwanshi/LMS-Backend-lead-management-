import mongoose, { Document, Schema, Types } from "mongoose";
import dbConnections from "../../config/db";

export interface IAppointment extends Document {
  leadId?: Types.ObjectId;

  leadTitle?: string;
  clientName?: string;
  clientPhone?: number;
  clientEmail?: string;
  clientAdd?: string;
  shopName?: string;
  Notes?: string;

  status: "Scheduled" | "Rescheduled" | "Cancelled" | "Completed";

  meetingType?: "In-Person" | "Virtual" | "Call";
  meetingLink?: string;
  meetingDate?: Date;

  appointmentDateTime?: Date;

  nextFollowUpDate?: Date;


  appointmentTime?: string;

  clientId?: Types.ObjectId;
  companyId?: Types.ObjectId;
  branchId?: Types.ObjectId;
  superAdminId?: Types.ObjectId;
  salesmanId?: Types.ObjectId;
  supervisorId?: Types.ObjectId;

  createdById?: Types.ObjectId;
  createdByRole?: "superadmin" | "company" | "branch" | "supervisor" | "salesman";

  createdAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  leadId: { type: Schema.Types.ObjectId, ref: "Lead" },

  leadTitle: String,
  clientName: String,
  clientPhone: Number,
  clientEmail: String,
  clientAdd: String,
  shopName: String,
  Notes: String,

  status: {
    type: String,
    enum: ["Scheduled", "Rescheduled", "Cancelled", "Completed"],
    default: "Scheduled",
  },

  meetingType: {
    type: String,
    enum: ["In-Person", "Virtual", "Call"],
    set: (value: string) => {
      if (!value) return value;
      const normalized = value.trim().toLowerCase();

      if (normalized === "in-person" || normalized === "inperson")
        return "In-Person";
      if (normalized === "virtual") return "Virtual";
      if (normalized === "call") return "Call";

      return value;
    },
  },

  meetingLink: String,
  meetingDate: Date,


  appointmentDateTime: { type: Date, index: true },

  nextFollowUpDate: Date,

  appointmentTime: String,

  clientId: { type: Schema.Types.ObjectId, ref: "ClientInformation" },
  companyId: { type: Schema.Types.ObjectId, ref: "Company" },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  superAdminId: { type: Schema.Types.ObjectId, ref: "SuperAdmin" },
  salesmanId: { type: Schema.Types.ObjectId, ref: "Salesman" },
  supervisorId: { type: Schema.Types.ObjectId, ref: "Supervisor" },

  createdById: { type: Schema.Types.ObjectId, refPath: "createdByRole" },
  createdByRole: {
    type: String,
    enum: ["superadmin", "company", "branch", "supervisor", "salesman"],
  },

  createdAt: { type: Date, default: Date.now },
});

const Appointment =  dbConnections.db2!.models.Appointment ||  dbConnections.db2!.model<IAppointment>("Appointment", appointmentSchema);
export default Appointment;