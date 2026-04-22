import mongoose, { Document, Schema } from "mongoose";

export interface ILead extends Document {
  leadTitle?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAdd?: string;
  shopName: string;

  status: "new" | "contacted" | "interested" | "closed" | "rejected";

  // 🔥 Hierarchy
  companyId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId;
  salesmanId?: mongoose.Types.ObjectId;

  // 🔐 Created info
  createdById: mongoose.Types.ObjectId;
  createdByRole: string;

  // 📊 Extra
  notes?: string;
}

const leadSchema = new Schema<ILead>(
  {
    leadTitle: { type: String },

    clientName: { type: String, required: true },
    clientEmail: { type: String },
    clientPhone: { type: String },
    clientAdd: { type: String },

    shopName: { type: String, required: true },

    status: {
      type: String,
      enum: ["new", "contacted", "interested", "closed", "rejected"],
      default: "new",
    },

    // 🔥 Hierarchy (IMPORTANT)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
    },
    salesmanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salesman",
    },

    // 🔐 Creator
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    createdByRole: {
      type: String,
      required: true,
    },

    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ILead>("Lead", leadSchema);




