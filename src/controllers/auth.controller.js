import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcrypt";
import {
  isPasswordCorrect,
  generateAccessToken,
  generateRefreshToken,
} from "../services/auth.service.js";
import sendEmail from "../services/mail.service.js";
import prisma from "../db/config.js";
import crypto from "crypto";
const registerWithEmail = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!(email && password))
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
    if (!(userId && companyName && phoneNo))
      return next(new ApiError(400, "All fields are required"));
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });
    if (!user) return next(new ApiError(400, "Invalid User Id"));
    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    if (!(accessToken && refreshToken))
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
          { user: userwithoutpassword, accessToken },
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
    if (!(email && password))
      return next(new ApiError(400, "Email and password fields are required"));
    const myuser = await prisma.user.findUnique({ where: { email } });
    if (!myuser)
      return next(new ApiError(400, "User not exist please register first"));
    const isMatch = await isPasswordCorrect(myuser, password);
    if (!isMatch) return next(new ApiError(400, "Incorrect credentials"));
    const accessToken = await generateAccessToken(myuser);
    const refreshToken = await generateRefreshToken(myuser);
    if (!(accessToken && refreshToken))
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

const refreshAccessToken = asyncHandler(async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return next(new ApiError(400, "Refresh Token is required"));
    const decodedtoken = await jwt.verify(refreshToken);
    if (!decodedtoken)
      return next(new ApiError(400, "Token Expired Or Invalid"));
    const myuser = await prisma.user.findUnique({
      where: { id: decodedtoken.id },
    });
    if (!myuser) return next(new ApiError(400, "User don't exist"));
    if (refreshToken != myuser.refreshToken)
      return next(new ApiError(400, "Refresh Token not matched"));
    const accessToken = await generateAccessToken(myuser);
    if (!accessToken)
      return next(new ApiError(500, "Error generating access token"));
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: myuser, accessToken },
          "Access Token refreshed successfully"
        )
      );
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const forgetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new ApiError(400, "Email is required"));
    const myuser = await prisma.user.findUnique({ where: { email } });
    if (!myuser) return next(new ApiError(400, "User not exist"));
    const token = crypto.randomBytes(20).toString("hex");
    const expiry = Date.now() + 3600000;
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(expiry),
      },
    });
    const resetUrl = `https//localhost:8000/api/v1/${token}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n${resetUrl}`;
    await sendEmail({
      email: email,
      subject: "Password Reset",
      message,
    });
    return res.status(200).json(new ApiResponse(200, {}, "Email sent"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
export {
  registerWithEmail,
  fullRegisteration,
  loginWithEmail,
  refreshAccessToken,
  forgetPassword,
};
