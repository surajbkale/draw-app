import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

// export function authMiddleware(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   const token = req.headers["authorization"] ?? "";

//   const decoded = jwt.verify(token, JWT_SECRET);

//   if (typeof decoded === "string") {
//     return;
//   }
//   console.log("middleware: " + decoded.userId);

//   if (decoded) {
//     req.userId = decoded.userId;
//     next();
//   } else {
//     res.status(403).json({
//       message: "Unauthorized",
//     });
//   }
// }

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded || typeof decoded === "string" || !decoded.userId) {
      return res.status(403).json({ message: "Invalid token" });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ messsage: "Unauthorized" });
  }
}
