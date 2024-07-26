import prisma from "../db/config.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) next(new ApiError(401, "Unauthorized request"));

    const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedtoken)
      return next(new ApiError(400, "Token Expired or invalid"));

    const user = await prisma.admin.findUnique({
      where: { id: decodedtoken?.id },
    });
    if (!user) return next(new ApiError(401, "Invalid Access Token"));
    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(401, error?.message || "Invalid Access Token"));
  }
});
