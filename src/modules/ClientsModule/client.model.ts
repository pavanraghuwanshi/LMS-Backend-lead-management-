import mongoose, { Document, Schema } from "mongoose";
import dbConnections from "../../config/db";

export interface IClient extends Document {
  clientName: string;
  email?: string;
  phone?: string;
  address?: string;
  
  companyId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId;
  salesmanId?: mongoose.Types.ObjectId;

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
    supervisorId:{ type:mongoose.Schema.Types.ObjectId, ref:"Supervisor"},
    salesmanId:{ type:mongoose.Schema.Types.ObjectId, ref:"Salesman"},

  },
  { timestamps: true }
);
const Client =  dbConnections.db1!.models.Client ||  dbConnections.db2!.model<IClient>("Client", ClientSchema);

export default Client;