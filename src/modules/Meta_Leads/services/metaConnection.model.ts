import mongoose, { Schema, Document, Model } from "mongoose";
import dbConnections from "../../../config/db";

export interface IPage {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
}

export interface IMetaConnection extends Document {
  userId: mongoose.Types.ObjectId;

  metaUserId: string;

  name: string;

  email: string;

  accessToken: string;

  tokenExpiresAt: Date;

  pages: IPage[];

  createdAt: Date;

  updatedAt: Date;
}


const pageSchema = new Schema<IPage>(
  {
    pageId: {
      type: String,
      required: true,
    },

    pageName: {
      type: String,
      required: true,
    },

    pageAccessToken: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const metaConnectionSchema =
  new Schema<IMetaConnection>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },

      metaUserId: {
        type: String,
        required: true,
      },

      name: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },

      accessToken: {
        type: String,
        required: true,
      },

      tokenExpiresAt: {
        type: Date,
      },

      pages: [pageSchema],
    },
    {
      timestamps: true,
    }
  );


export default dbConnections.db2!.models.MetaConnection || dbConnections.db2!.model<IMetaConnection>("MetaConnection",metaConnectionSchema);