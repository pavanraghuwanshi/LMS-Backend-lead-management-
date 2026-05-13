import { Request, Response } from "express";
import { google } from "googleapis";
import { AuthRequest } from "../../middlewares/auth.middleware";
import Branch from "../../RocketsalesModels/Branch";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);



export const getGoogleAuthUrl = async (req: Request, res: Response): Promise<Response> => {
  try {
    const scopes = [
      "https://www.googleapis.com/auth/adwords",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
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
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    // ✅ Only branch allowed
    if (req.user?.role !== "branch") {
      return res.status(403).json({
        success: false,
        message: "Only branch users allowed",
      });
    }

    // 🔥 Get Google tokens
    const { tokens } = await oauth2Client.getToken(code);

    // 🔥 Save in branch collection
    await Branch.findByIdAndUpdate(req.user.id, {
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
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};