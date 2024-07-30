import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "../db/config.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { name, phoneNo, password, email } = req.body;
    if (!(name && phoneNo && password && email))
      return next(new ApiError(400, "All Fields are required"));
    const hashedPassword = await bcrypt.hash(password, 10);
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const loginEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
export { registerEmployee, loginEmployee };
