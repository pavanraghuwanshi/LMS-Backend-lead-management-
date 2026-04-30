import mongoose, { Document, Schema } from "mongoose";
import { encrypt, decrypt } from "../utils/cryptoUtils"; // ✅ use your crypto
import dbConnections from "../config/db";

// 🔹 Interface
export interface ISuperAdmin extends Document {
  username: string;
  email?: string;
  password: string;
  role: number;
  created_at: Date;

  comparePassword(password: string): boolean;
}

// 🔹 Schema
const superAdminSchema = new Schema<ISuperAdmin>({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

// 🔐 encrypt password
superAdminSchema.pre("save", function () {
  if (this.isModified("password")) {
    this.password = encrypt(this.password);
  }
});

// 🔑 compare password
superAdminSchema.methods.comparePassword = function (
  password: string
): boolean {
  const decryptedPassword = decrypt(this.password);
  return password === decryptedPassword;
};

// 🔥 Model (SAFE)
const SuperAdmin =
  dbConnections.db1?.model<ISuperAdmin>("Superadmin", superAdminSchema) ||
  mongoose.model<ISuperAdmin>("Superadmin", superAdminSchema);

export default SuperAdmin;