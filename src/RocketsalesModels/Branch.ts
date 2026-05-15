import mongoose, { Schema } from "mongoose";
import dbConnections from "../config/db";
import { encrypt, decrypt } from "../utils/cryptoUtils";

const branchSchema = new Schema(
  {
    branchName: String,
    branchLocation: String,
    branchEmail: String,
    branchPhone: String,

    supervisorsIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Supervisor" },
    ],

    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: { type: Number, default: 0 },

    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },

    firebaseToken: [{ type: String }],

    GSTIN: String,

    taskCompletionConfig: {
      requireImage: { type: Boolean, default: false },
      requireAudio: { type: Boolean, default: false },
    },
    googleAds: {
      accessToken: String,
      refreshToken: String,
      expiryDate: Number,
      scope: String,
      tokenType: String,
      customerId:String,
      isConnected:String,
      webhookKey: String,
    },
    linkedInAds: {
      accessToken: String,
    
      refreshToken: String,
    
      expiryDate: Number,
    
      scope: String,
    
      tokenType: String,
    
      accountId: String,
    
      isConnected: {
        type: Boolean,
        default: false,
      },
    
      webhookKey: String,
    },
  },
  { timestamps: true }
);

// 🔐 encrypt
branchSchema.pre("save", function () {
  if (this.isModified("password")) {
    this.password = encrypt(this.password);
  }
});

// 🔑 compare
branchSchema.methods.comparePassword = function (password: string) {
  const decryptedPassword = decrypt(this.password);
  return password === decryptedPassword;
};

// ⚠️ IMPORTANT (null check)
const Branch = dbConnections.db1?.model("Branch", branchSchema) ||
  mongoose.model("Branch", branchSchema);

export default Branch;