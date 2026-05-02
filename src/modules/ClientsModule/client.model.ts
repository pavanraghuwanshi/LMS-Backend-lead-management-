import mongoose, { Document, Schema } from "mongoose";
import dbConnections from "../../config/db";

export interface IClient extends Document {
  clientName: string;
  email?: string;
  phone?: string;
  address?: string;

  companyId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;

  createdAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    clientName: { type: String, required: true },
    email: String,
    phone: String,
    address: String,

    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },

  },
  { timestamps: true }
);
const Client =  dbConnections.db2!.models.Client ||  dbConnections.db2!.model<IClient>("Client", ClientSchema);

export default Client;