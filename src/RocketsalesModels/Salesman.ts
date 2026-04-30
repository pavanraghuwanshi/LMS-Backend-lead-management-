import mongoose, { Document, Schema, Types } from "mongoose";
import { encrypt, decrypt } from "../utils/cryptoUtils";
import dbConnections from "../config/db"; // ✅ fix import

// 🔹 Interface
export interface ISalesman extends Document {
  salesmanName?: string;
  profileImage?: string;
  salesmanEmail?: string;
  salesmanPhone?: string;

  username: string;
  password: string;
  role: number;

  isLoggedIn: boolean;
  isPayrollTrackCreated: boolean;

  companyId?: Types.ObjectId;
  branchId?: Types.ObjectId;
  supervisorId?: Types.ObjectId;

  tokenVersion: number;
  firebaseToken: string[];

  createdAt: Date;
  updatedAt: Date;

  comparePassword(password: string): boolean;
}

// 🔹 Schema
const salesmanSchema = new Schema<ISalesman>(
  {
    salesmanName: String,
    profileImage: String,
    salesmanEmail: String,
    salesmanPhone: String,

    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: { type: Number, default: 0 },

    isLoggedIn: { type: Boolean, default: false },
    isPayrollTrackCreated: { type: Boolean, default: false },

    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    supervisorId: { type: Schema.Types.ObjectId, ref: "Supervisor" },

    tokenVersion: { type: Number, default: 0 },
    firebaseToken: [{ type: String }],
  },
  { timestamps: true }
);

// 🔐 encrypt (FIXED)
salesmanSchema.pre("save", function () {
  if (this.isModified("password")) {
    this.password = encrypt(this.password);
  }
});

// 🔑 compare (FIXED)
salesmanSchema.methods.comparePassword = function (
  password: string
): boolean {
  const decryptedPassword = decrypt(this.password);
  return password === decryptedPassword;
};

// 🔥 Model (SAFE)
const Salesman =
  dbConnections.db1?.model<ISalesman>("Salesman", salesmanSchema) ||
  mongoose.model<ISalesman>("Salesman", salesmanSchema);

export default Salesman;