import mongoose, { Schema, Document } from "mongoose";
import dbConnections from "../../config/db";

export interface IFollowUp extends Document {
  leadId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId;
  salesmanId?: mongoose.Types.ObjectId;

  remark: string;
  nextFollowUpDate?: Date;
  status: string;

  createdBy: mongoose.Types.ObjectId;
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },

    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    supervisorId: { type: Schema.Types.ObjectId, ref: "User" },
    salesmanId: { type: Schema.Types.ObjectId, ref: "User" },

    remark: { type: String, required: true },
    nextFollowUpDate: Date,
    status: { type: String, default: "pending" },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const FollowUp =  dbConnections.db2!.models.FollowUp ||  dbConnections.db2!.model<IFollowUp>("FollowUp", FollowUpSchema);
export default FollowUp;