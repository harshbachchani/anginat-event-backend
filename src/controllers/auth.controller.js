import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcrypt";
import {
  isPasswordCorrect,
  generateAccessToken,
  generateRefreshToken,
} from "../services/user.service.js";
import prisma from "../db/config.js";

const registerWithEmail = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!(email || password))
      return next(new ApiError(400, "email and password are required"));
    const hashedPassword = await bcrypt.hash(password, 10);
    const existeduser = await prisma.user.findUnique({ where: { email } });
    if (existeduser)
      return next(new ApiError(400, "User already exist with same email"));
    const myuser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const createduser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!createduser)
      return next(
        new ApiError(500, "Something went wrong while registering user")
      );

    return res
      .status(201)
      .json(new ApiResponse(200, createduser, "User Registered Successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const fullRegisteration = asyncHandler(async (req, res, next) => {
  try {
    const { userId, companyName, phoneNo } = req.body;
    if (!(userId || companyName || phoneNo))
      return next(new ApiError(400, "All fields are required"));
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });
    if (!user) return next(new ApiError(400, "Invalid User Id"));
    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    if (!(accessToken || refreshToken))
      return next(
        new ApiError(501, "Error in generating access and refresh token ")
      );
    const updateduser = await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        companyName,
        phoneNo,
        refreshToken,
      },
    });
    if (!updateduser) return next(new ApiError(501, "Error in updating user"));
    const xuser = await prisma.user.findUnique({
      where: { id: updateduser.id },
    });

    const { password, ...userwithoutpassword } = xuser;
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { userwithoutpassword, accessToken },
          "User Saved Successfuly"
        )
      );
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const loginWithEmail = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!(email || password))
      return next(new ApiError(400, "Email and password fields are required"));
    const myuser = await prisma.user.findUnique({ where: { email } });
    if (!myuser)
      return next(new ApiError(400, "User not exist please register first"));
    const isMatch = await isPasswordCorrect(myuser, password);
    if (!isMatch) return next(new ApiError(400, "Incorrect credentials"));
    const accessToken = await generateAccessToken(myuser);
    const refreshToken = await generateRefreshToken(myuser);
    if (!(accessToken || refreshToken))
      return next(
        new ApiError(500, "Internal Server Error while generating token")
      );
    const updateduser = await prisma.user.update({
      where: { id: myuser.id },
      data: { refreshToken },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { updateduser, accessToken },
          "User logged in successfully"
        )
      );
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

export { registerWithEmail, fullRegisteration, loginWithEmail };
