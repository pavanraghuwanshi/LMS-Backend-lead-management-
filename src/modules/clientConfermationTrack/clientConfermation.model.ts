import mongoose, { Schema, Document, Types } from "mongoose";
import dbConnections from "../../config/db";

// ✅ Interface
export interface IClientConfermation extends Document {
  clientFeedback?: string;
  clientConfrmation?: "YES" | "NO" | "MAYBE";
  installationDate?: Date;
  followUpDate?: Date;
  deliveryAddress?: string;

  clientName?: string;

  contact: {
    phone?: string;
    email?: string;
    address?: string;
  };

  superAdminId?: Types.ObjectId;
  companyId?: Types.ObjectId;
  branchId?: Types.ObjectId;
  supervisorId?: Types.ObjectId;
  salesmanId?: Types.ObjectId;

  appointmentId: Types.ObjectId;
  leadId: Types.ObjectId;

  createdByRole?: "superadmin" | "company" | "branch" | "supervisor" | "salesman";
  createdById?: Types.ObjectId;

  createdAt: Date;

  // virtual
  createdByModel?: string;
}

// ✅ Schema
const clientConfermationSchema = new Schema<IClientConfermation>({
  clientFeedback: String,

  clientConfrmation: {
    type: String,
    enum: ["YES", "NO", "MAYBE"],
  },

  installationDate: Date,
  followUpDate: Date,
  deliveryAddress: String,

  // 🔹 Client Details
  clientName: {
    type: String,
    // required: true,
    // index: true,
  },

  contact: {
    phone: { type: String, index: true },
    email: { type: String, index: true },
    address: String,
  },

  // 🔹 Hierarchy
  superAdminId: { type: Schema.Types.ObjectId, ref: "SuperAdmin" },
  companyId: { type: Schema.Types.ObjectId, ref: "Company" },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  supervisorId: { type: Schema.Types.ObjectId, ref: "Supervisor" },
  salesmanId: { type: Schema.Types.ObjectId, ref: "Salesman" },

  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
  },

  leadId: {
    type: Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
  },

  createdByRole: {
    type: String,
    enum: ["superadmin", "company", "branch", "supervisor", "salesman"],
  },

  createdById: {
    type: Schema.Types.ObjectId,
    refPath: "createdByModel",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});


// ✅ Virtual for dynamic model mapping
clientConfermationSchema.virtual("createdByModel").get(function (this: IClientConfermation) {
  const roleToModel: Record<string, string> = {
    superadmin: "SuperAdmin",
    company: "Company",
    branch: "Branch",
    supervisor: "Supervisor",
    salesman: "Salesman",
  };

  return roleToModel[this.createdByRole || ""] || null;
});


// // ⚠️ FIXED: You had wrong field "name"
// clientConfermationSchema.index({
//   clientName: "text",
//   "contact.phone": 1,
//   "contact.email": 1,
// });

const ClientConfermation =  dbConnections.db2!.models.ClientConfermation ||  dbConnections.db2!.model<IClientConfermation>("ClientConfermation", clientConfermationSchema);
export default ClientConfermation;