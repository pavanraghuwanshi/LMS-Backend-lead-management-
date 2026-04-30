import mongoose, { Document, Schema, Types } from "mongoose";
import { encrypt, decrypt } from "../utils/cryptoUtils";
import dbConnections from "../config/db";

// 🔹 Interface
export interface ICompany extends Document {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;

  ownerName?: string;
  ownerEmail?: string;

  gstNo?: string;
  panNo?: string;
  businessType?: string;

  branchesIds: Types.ObjectId[];

  username: string;
  password: string;
  role: number;

  firebaseToken: string[];
  notificationAllow: boolean;
  logo?: string;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(password: string): Promise<boolean>;
}

// 🔹 Schema
const companySchema = new Schema<ICompany>(
  {
    companyName: String,
    companyEmail: String,
    companyPhone: String,
    companyAddress: String,

    ownerName: String,
    ownerEmail: String,

    gstNo: String,
    panNo: String,
    businessType: String,

    branchesIds: [
      { type: Schema.Types.ObjectId, ref: "Branch" },
    ],

    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: { type: Number, default: 0 },

    firebaseToken: [{ type: String }],
    notificationAllow: { type: Boolean, default: false },

    logo: String,
  },
  { timestamps: true }
);

// 🔐 encrypt (FIXED)
companySchema.pre("save", function () {
  if (this.isModified("password")) {
    this.password = encrypt(this.password);
  }
});

// 🔑 compare
companySchema.methods.comparePassword = function (
  password: string
): boolean {
  const decryptedPassword = decrypt(this.password);
  return password === decryptedPassword;
};

// 🔥 Model (SAFE)
const Company =
  dbConnections.db1?.model<ICompany>("Company", companySchema) ||
  mongoose.model<ICompany>("Company", companySchema);

export default Company;