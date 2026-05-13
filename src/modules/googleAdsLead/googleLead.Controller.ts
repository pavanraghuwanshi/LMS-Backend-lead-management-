import { Request, Response } from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

import Branch from "../../RocketsalesModels/Branch";

// ==========================================
// ROLE MAP
// ==========================================
const ROLE_MAP: Record<number, string> = {
  1: "superadmin",
  2: "company",
  3: "branch",
  4: "supervisor",
  5: "salesman",
};

// ==========================================
// GOOGLE OAUTH CLIENT
// ==========================================
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ==========================================
// GET GOOGLE AUTH URL
// ==========================================
export const getGoogleAuthUrl = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const scopes = [
      "https://www.googleapis.com/auth/adwords",
    ];

    // 🔥 Get JWT token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    // 🔥 Generate Google Auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state: token,
    });

    return res.status(200).json({
      success: true,
      message: "Google auth URL generated successfully",
      data: {
        authUrl,
      },
    });
  } catch (error: any) {
    console.error("Google Auth URL Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate Google auth URL",
      error: error.message,
    });
  }
};

// ==========================================
// GOOGLE CALLBACK CONTROLLER
// ==========================================
export const googleAuthCallback = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const code = req.query.code as string;

    const token = req.query.state as string;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing in state",
      });
    }


    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;


    const role = ROLE_MAP[decoded.role];

    if (role !== "branch") {
      return res.status(403).json({
        success: false,
        message: "Only branch users allowed",
      });
    }


    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens) {
      return res.status(400).json({
        success: false,
        message: "Failed to fetch Google tokens",
      });
    }


    await Branch.findByIdAndUpdate(decoded.id, {
      googleAds: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        scope: tokens.scope,
        tokenType: tokens.token_type,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Google Ads connected successfully",
    });

  } catch (error: any) {
    console.error("Google Callback Error:", error);

    return res.status(500).json({
      success: false,
      message: "Google authentication failed",
      error: error.message,
    });
  }
};


import { GoogleAdsApi } from "google-ads-api";
import { AuthRequest } from "../../middlewares/auth.middleware";
import Lead from "../lead/lead.model";

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_CLIENT_ID!,
  client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

export const getAccessibleCustomers = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    // 🔥 Get branch
    const branch = await Branch.findById(req.user?.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    // 🔥 Check Google Ads connection
    if (!branch?.googleAds?.refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Google Ads not connected",
      });
    }


    const customers =  await client.listAccessibleCustomers(  branch.googleAds.refreshToken );

    const resourceNames = customers.resource_names || [];

    if (resourceNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Google Ads accounts found",
      });
    }


    const firstCustomer = resourceNames[0].replace( "customers/", "" );


    await Branch.findByIdAndUpdate(req.user?.id, {
      "googleAds.customerId": firstCustomer,
      "googleAds.isConnected": true,
    });

    return res.status(200).json({
      success: true,
      message:
        "Google Ads customer fetched successfully",

      data: {
        customerId: firstCustomer,
        accounts: resourceNames,
      },
    });

  } catch (error: any) {
    console.error(
      "Get Accessible Customers Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Google Ads accounts",
      error: error.message,
    });
  }
};



export const getCampaigns = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const branch = await Branch.findById(req.user?.id);

    if (!branch?.googleAds?.refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Google Ads not connected",
      });
    }

    if (!branch?.googleAds?.customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID missing",
      });
    }

    // ==========================================
    // CUSTOMER INSTANCE
    // ==========================================
    const customer = client.Customer({
      customer_id: branch.googleAds.customerId,
      refresh_token:
        branch.googleAds.refreshToken,
    });

    // ==========================================
    // FETCH CAMPAIGNS
    // ==========================================
    const campaigns = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type
      FROM campaign
      ORDER BY campaign.id
    `);

    return res.status(200).json({
      success: true,
      total: campaigns.length,
      data: campaigns,
    });

  } catch (error: any) {
    console.error("Get Campaigns Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
      error: error.message,
    });
  }
};



export const googleLeadWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {

    // ==========================================
    // VERIFY WEBHOOK KEY
    // ==========================================
    const webhookKey =
      req.headers["google-key"];

    if (
      webhookKey !==
      process.env.GOOGLE_WEBHOOK_KEY
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook key",
      });
    }

    console.log(
      "🔥 GOOGLE LEAD:",
      req.body
    );

    // ==========================================
    // GOOGLE DATA
    // ==========================================
    const {
      lead_id,
      campaign_id,
      adgroup_id,
      user_column_data,
    } = req.body;

    const getField = (name: string) => {
      return user_column_data?.find(
        (x: any) => x.column_name === name
      )?.string_value;
    };

    const name = getField("FULL_NAME");

    const phone = getField("PHONE_NUMBER");

    const email = getField("EMAIL");

    // ==========================================
    // SAVE LEAD
    // ==========================================
    await Lead.create({
      googleLeadId: lead_id,

      campaignId: campaign_id,

      adGroupId: adgroup_id,

      name,

      phone,

      email,

      source: "google_ads",

      status: "new",
    });

    return res.status(200).json({
      success: true,
      message: "Lead received successfully",
    });

  } catch (error: any) {
    console.log(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};