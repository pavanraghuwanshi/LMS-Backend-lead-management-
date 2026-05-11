import { Response } from "express";
import axios from "axios";

import { AuthRequest } from "../../../middlewares/auth.middleware";

import MetaConnection from "../services/metaConnection.model";

import {
  getMetaUser,
  getUserPages,
  getLeadForms,
  getFormLeads,
  subscribePageWebhook,
} from "./metaService";

import {
  exchangeLongLivedToken,
} from "../utils/meta.Utils";


// ============================================
// GET META LOGIN URL
// ============================================

export const getMetaLoginUrl = async (req: AuthRequest,res: Response): Promise<Response> => {
  try {

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const scopes: string[] = [
      "pages_show_list",
      "pages_read_engagement",
      "leads_retrieval",
      "business_management",
      "ads_management",
      "email",
      "public_profile",
    ];

    const loginUrl =
      `https://www.facebook.com/${process.env.META_GRAPH_VERSION}/dialog/oauth?` +
      `client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${process.env.META_REDIRECT_URI}` +
      `&scope=${scopes.join(",")}` +
      `&state=${user.id}`;

    return res.status(200).json({
      success: true,
      message: "Meta login url generated successfully",
      data: {
        loginUrl,
      },
    });

  } catch (error: any) {

    console.error(
      "Get Meta Login URL Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


// ============================================
// META CALLBACK
// ============================================

export const metaCallback = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {

    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code missing",
      });
    }

    // ============================================
    // GET SHORT TOKEN
    // ============================================

    const tokenResponse = await axios.get(
      `https://graph.facebook.com/${process.env.META_GRAPH_VERSION}/oauth/access_token`,
      {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret:
            process.env.META_APP_SECRET,
          redirect_uri:
            process.env.META_REDIRECT_URI,
          code,
        },
      }
    );

    const shortToken: string =
      tokenResponse.data.access_token;

    // ============================================
    // EXCHANGE LONG TOKEN
    // ============================================

    const longTokenData =
      await exchangeLongLivedToken(
        shortToken
      );

    const accessToken: string =
      longTokenData.access_token;

    // ============================================
    // META USER
    // ============================================

    const metaUser =
      await getMetaUser(accessToken);

    // ============================================
    // GET PAGES
    // ============================================

    const pages =
      await getUserPages(accessToken);

    // ============================================
    // SUBSCRIBE WEBHOOKS
    // ============================================

    for (const page of pages) {

      await subscribePageWebhook(
        page.id,
        page.access_token
      );
    }

    // ============================================
    // SAVE CONNECTION
    // ============================================

    const metaConnection =
      await MetaConnection.findOneAndUpdate(
        {
          userId: state,
        },
        {
          userId: state,

          metaUserId: metaUser.id,

          name: metaUser.name,

          email: metaUser.email,

          accessToken,

          tokenExpiresAt: new Date(
            Date.now() +
              longTokenData.expires_in *
                1000
          ),

          pages: pages.map((page: any) => ({
            pageId: page.id,

            pageName: page.name,

            pageAccessToken:
              page.access_token,
          })),
        },
        {
          upsert: true,
          new: true,
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Meta account connected successfully",
      data: metaConnection,
    });

  } catch (error: any) {

    console.error(
      "Meta Callback Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error:
        error.response?.data ||
        error.message,
    });
  }
};