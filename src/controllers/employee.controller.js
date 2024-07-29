import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import prisma from "../db/config.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { name, phoneno, password } = req.body;
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const loginEmployee = asyncHandler(async (req, res, next) => {});
export { registerEmployee, loginEmployee };
