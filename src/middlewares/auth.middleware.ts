import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// 🔥 Role Map (same as your auth app)
const ROLE_MAP: Record<number, string> = {
  1: "superadmin",
  2: "company",
  3: "branch",
  4: "supervisor",
  5: "salesman",
};

// 🔥 Extend Request type
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    companyId?: string | null;
    branchId?: string | null;
    supervisorId?: string | null;
    username?: string | null;
  };
  role?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  console.log(token,"hhhhhhhhhhhh")

  if (!token) {
    return res.status(401).json({
      message: "Authorization token is required",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    // 🔐 Basic validation
    if (!decoded.id || !decoded.role) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    const roleName = ROLE_MAP[decoded.role];

    if (!roleName) {
      return res.status(401).json({
        message: "Invalid role in token",
      });
    }

    // ✅ Attach user (NO DB HIT → fast ⚡)
    req.user = {
      id: decoded.id,
      role: roleName,
      companyId: decoded.companyId || null,
      branchId: decoded.branchId || null,
      supervisorId: decoded.supervisorId || null,
      username: decoded.username || null,
    };

    req.role = roleName;

    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};