import mongoose, { Document, Schema, Types } from "mongoose";
import { encrypt, decrypt } from "../utils/cryptoUtils";
import dbConnections from "../config/db"; // ✅ correct import

// 🔹 Interface
export interface ISupervisor extends Document {
  supervisorName?: string;
  supervisorEmail?: string;
  supervisorPhone?: string;

  salesmansIds: Types.ObjectId[];

  username: string;
  password: string;
  role: number;

  companyId?: Types.ObjectId;
  branchId?: Types.ObjectId;

  firebaseToken: string[];

  createdAt: Date;
  updatedAt: Date;

  comparePassword(password: string): Promise<boolean>;
}

// 🔹 Schema
const supervisorSchema = new Schema<ISupervisor>(
  {
    supervisorName: String,
    supervisorEmail: String,
    supervisorPhone: String,

    salesmansIds: [
      { type: Schema.Types.ObjectId, ref: "Salesman" },
    ],

    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: { type: Number, default: 0 },

    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },

    firebaseToken: [{ type: String }],
  },
  { timestamps: true }
);

// 🔐 encrypt
supervisorSchema.pre<ISupervisor>("save", function (next) {
  if (this.isModified("password")) {
    this.password = encrypt(this.password);
  }
});

// 🔑 compare
supervisorSchema.methods.comparePassword = function (
  password: string
): boolean {
  const decryptedPassword = decrypt(this.password);
  return password === decryptedPassword;
};

// 🔥 Model (safe fallback)
const Supervisor =
  dbConnections.db1?.model<ISupervisor>("Supervisor", supervisorSchema) ||
  mongoose.model<ISupervisor>("Supervisor", supervisorSchema);

export default Supervisor;