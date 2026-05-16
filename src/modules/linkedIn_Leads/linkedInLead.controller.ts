import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import Branch from "../../RocketsalesModels/Branch";
import { AuthRequest } from "../../middlewares/auth.middleware";
import Lead from "../lead/lead.model";
import Client from "../ClientsModule/client.model";


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
// GET LINKEDIN AUTH URL
// ==========================================
export const getLinkedInAuthUrl = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const scopes = [
      "openid",
      "profile",
      "email",
    ].join(" ");

    const authUrl =
      `https://www.linkedin.com/oauth/v2/authorization` +
      `?response_type=code` +
      `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
      `&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${token}`;

    return res.status(200).json({
      success: true,
      data: {
        authUrl,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const linkedInAuthCallback = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const code = req.query.code as string;
      const token = req.query.state as string;
  
      if (!code) {
        return res.status(400).json({
          success: false,
          message: "Authorization code missing",
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
  
      // ==========================================
      // GET ACCESS TOKEN
      // ==========================================
      const tokenResponse = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env
            .LINKEDIN_REDIRECT_URI as string,
          client_id: process.env
            .LINKEDIN_CLIENT_ID as string,
          client_secret: process.env
            .LINKEDIN_CLIENT_SECRET as string,
        }),
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );
  
      const accessToken =
        tokenResponse.data.access_token;
  
      const expiresIn =
        tokenResponse.data.expires_in;
  
      await Branch.findByIdAndUpdate(decoded.id, {
        $set: {
          "linkedInAds.accessToken": accessToken,
          "linkedInAds.expiresIn": expiresIn,
          "linkedInAds.isConnected": true,
        },
      });
  
      return res.status(200).json({
        success: true,
        message:
          "LinkedIn Ads connected successfully",
      });
    } catch (error: any) {
      console.log("LINKEDIN CALLBACK ERROR:", error);
  
      return res.status(500).json({
        success: false,
        message: "LinkedIn authentication failed",
        error: error.message,
      });
    }
  };



  export const getLinkedInAdAccounts = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      const branch = await Branch.findById(
        req.user?.id
      );
  
      if (!branch?.linkedInAds?.accessToken) {
        return res.status(400).json({
          success: false,
          message: "LinkedIn not connected",
        });
      }
  
      const response = await axios.get(
        "https://api.linkedin.com/v2/adAccountsV2",
        {
          headers: {
            Authorization: `Bearer ${branch.linkedInAds.accessToken}`,
          },
        }
      );
  
      return res.status(200).json({
        success: true,
        data: response.data,
      });
    } catch (error: any) {
      console.log(
        "GET LINKEDIN ACCOUNTS ERROR:",
        error.response?.data || error.message
      );
  
      return res.status(500).json({
        success: false,
        message: "Failed to fetch ad accounts",
        error: error.message,
      });
    }
  };


  export const linkedInLeadWebhook = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
  
      console.log(
        "🔥 LINKEDIN WEBHOOK:",
        JSON.stringify(req.body, null, 2)
      );
  
      // ==========================================
      // VERIFY WEBHOOK
      // ==========================================
      const webhookKey = req.query.key;
  
      if (
        webhookKey !==
        process.env.LINKEDIN_WEBHOOK_KEY
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid webhook key",
        });
      }
  
      // ==========================================
      // EXTRACT DATA
      // ==========================================
      const data = req.body;
  
      const leadId = data.id;
  
      // prevent duplicate
      const existingLead = await Lead.findOne({
        linkedInLeadId: leadId,
      });
  
      if (existingLead) {
        return res.status(200).json({
          success: true,
          message: "Lead already exists",
        });
      }
  
      // ==========================================
      // FIND BRANCH
      // ==========================================
      const branch = await Branch.findOne({
        "linkedInAds.webhookKey": webhookKey,
      });
  
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: "Branch not found",
        });
      }
  
      // ==========================================
      // FETCH LEAD DETAILS
      // ==========================================
      const leadResponse = await axios.get(
        `https://api.linkedin.com/v2/leadForms/${leadId}`,
        {
          headers: {
            Authorization: `Bearer ${branch?.linkedInAds?.accessToken}`,
          },
        }
      );
  
      const leadData = leadResponse.data;
  
      const name =
        leadData.firstName + " " +
        leadData.lastName;
  
      const email = leadData.emailAddress;
  
      const phone = leadData.phoneNumber;
  
      const companyName =
        leadData.companyName;
  
      // ==========================================
      // FIND OR CREATE CLIENT
      // ==========================================
      let client = null;
  
      if (phone || email) {
        client = await Client.findOne({
          companyId: branch.companyId,
          $or: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : []),
          ],
        });
      }
  
      if (!client) {
        client = await Client.create({
          clientName: name,
          email,
          phone,
  
          companyId: branch.companyId,
          branchId: branch._id,
        });
      }
  
      // ==========================================
      // CREATE LEAD
      // ==========================================
      const lead = await Lead.create({
        leadTitle: "LinkedIn Ads Lead",
  
        status: "new",
  
        companyId: branch.companyId,
        branchId: branch._id,
  
        createdById: branch._id,
        createdByRole: "branch",
  
        notes: "Lead received from LinkedIn Ads",
  
        clientId: client._id,
  
        leadFrom: "linkedin_ads",
        source: "linkedin_ads",
  
        linkedInLeadId: leadId,
  
        shopName: companyName || "",
      });
  
      return res.status(200).json({
        success: true,
        message: "Lead received successfully",
        data: lead,
      });
  
    } catch (error: any) {
  
      console.log(
        "❌ LINKEDIN WEBHOOK ERROR:",
        error.response?.data || error.message
      );
  
      return res.status(500).json({
        success: false,
        message: "Failed to process LinkedIn lead",
        error: error.message,
      });
    }
  };