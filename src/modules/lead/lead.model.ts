import mongoose, { Document, Schema } from "mongoose";
import dbConnections from "../../config/db"; // ✅ important

export interface ILead extends Document {
  leadTitle?: string;
  shopName?: string;
  clientId?:string;

  status: "new"| "in-progress"| "interested" | "rejected" | "completed";

  companyId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId;
  salesmanId?: mongoose.Types.ObjectId;

  createdById: mongoose.Types.ObjectId;
  createdByRole: string;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    leadTitle: String,


    shopName: String,

    status: {
      type: String,
      enum: ["new", "in-progress", "interested", "completed", "rejected"],
      default: "new",
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
    },
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: "Supervisor",
    },
    salesmanId: {
      type: Schema.Types.ObjectId,
      ref: "Salesman",
    },
    clientId:{
      type:Schema.Types.ObjectId,
      ref:"Client"
    },
    createdById: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    createdByRole: {
      type: String,
      required: true,
    },

    notes: String,
  },
  { timestamps: true }
);

// 🔥 Model (db1 bind)
const Lead =  dbConnections.db2!.models.Lead ||  dbConnections.db2!.model<ILead>("Lead", leadSchema);
export default Lead;