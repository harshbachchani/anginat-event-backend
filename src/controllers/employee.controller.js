import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "../db/config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  isPasswordCorrect,
  generateAccessToken,
  generateRefreshToken,
} from "../services/auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
};
const registerEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { name, phoneNo, password, adminId, loginId } = req.body;
    if (!(name && phoneNo && password && loginId && adminId))
      return next(new ApiError(400, "All Fields are required"));
    const exsitedemp = await prisma.employee.findFirst({
      where: {
        AND: [{ adminId }, { loginId }],
      },
    });
    if (exsitedemp)
      return next(new ApiError(400, "User with the loginId already exist"));
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await prisma.employee.create({
      data: {
        name,
        loginId,
        phoneNo,
        adminId: parseInt(adminId),
        password: hashedPassword,
      },
    });
    if (!createdUser)
      return next(new ApiError(500, "Error while creating employee"));
    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "Employee added successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const assignEvent = asyncHandler(async (req, res, next) => {
  try {
    const { empId, eventId } = req.body;
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
const loginEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!(email && password))
      return next(new ApiError(400, "Email and password fields are required"));
    const myemp = await prisma.employee.findUnique({ where: { email } });
    if (!myemp)
      return next(
        new ApiError(404, "Employee not found, please register first")
      );
    if (!myemp.password) {
      return next(new ApiError(401, "Invalid password"));
    }
    const isMatch = await isPasswordCorrect(myemp, password);
    if (!isMatch) return next(new ApiError(400, "Incorrect Credentials"));
    const accessToken = await generateAccessToken(myuser);
    const refreshToken = await generateRefreshToken(myuser);
    if (!(accessToken && refreshToken))
      return next(new ApiError(500, "Error generating tokens"));
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);
    return res
      .status(200)
      .json(new ApiResponse(200, myemp, "Employee logged in successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
export { registerEmployee, loginEmployee };
