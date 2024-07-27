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
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
};
const registerWithEmail = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!(email && password))
      return next(new ApiError(400, "email and password are required"));
    const hashedPassword = await bcrypt.hash(password, 10);
    const existeduser = await prisma.admin.findUnique({ where: { email } });
    if (existeduser)
      return next(new ApiError(400, "User already exist with same email"));
    const myuser = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const createduser = await prisma.admin.findUnique({
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
    const user = await prisma.admin.findUnique({
      where: { id: Number(userId) },
    });
    if (!user) return next(new ApiError(400, "Invalid User Id"));
    if (user.companyName && user.phoneNo)
      return next(
        new ApiError(
          400,
          "Phone no and company name of user already exist please login directly"
        )
      );
    const existingusers = await prisma.admin.findMany({
      where: { phoneNo },
    });
    if (existingusers.length > 0)
      return new ApiError(
        400,
        "User with this phone no already exist use different values"
      );
    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    if (!(accessToken && refreshToken))
      return next(
        new ApiError(501, "Error in generating access and refresh token ")
      );
    const updateduser = await prisma.admin.update({
      where: { id: Number(userId) },
      data: {
        companyName,
        phoneNo,
        refreshToken,
      },
    });
    if (!updateduser) return next(new ApiError(501, "Error in updating user"));
    const xuser = await prisma.admin.findUnique({
      where: { id: updateduser.id },
    });

    const { password, ...userwithoutpassword } = xuser;
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);
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
    const myuser = await prisma.admin.findUnique({ where: { email } });
    if (!myuser)
      return next(new ApiError(400, "User do not exist please register first"));
    const isMatch = await isPasswordCorrect(myuser, password);
    if (!isMatch) return next(new ApiError(400, "Incorrect credentials"));
    const accessToken = await generateAccessToken(myuser);
    const refreshToken = await generateRefreshToken(myuser);
    if (!(accessToken && refreshToken))
      return next(
        new ApiError(500, "Internal Server Error while generating token")
      );
    const updateduser = await prisma.admin.update({
      where: { id: myuser.id },
      data: { refreshToken },
    });
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);
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
    const { refreshToken } = req.cookies || req.body;
    if (!refreshToken)
      return next(new ApiError(400, "Refresh Token is required"));
    const decodedtoken = await jwt.verify(refreshToken);
    if (!decodedtoken)
      return next(new ApiError(400, "Token Expired Or Invalid"));
    const myuser = await prisma.admin.findUnique({
      where: { id: decodedtoken.id },
    });
    if (!myuser) return next(new ApiError(400, "User don't exist"));
    if (refreshToken != myuser.refreshToken)
      return next(new ApiError(400, "Refresh Token not matched"));
    const accessToken = await generateAccessToken(myuser);
    if (!accessToken)
      return next(new ApiError(500, "Error generating access token"));
    res.cookie("accessToken", accessToken, cookieOptions);
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
    const myuser = await prisma.admin.findUnique({ where: { email } });
    if (!myuser) return next(new ApiError(400, "User not exist"));
    const token = crypto.randomBytes(20).toString("hex");
    const expiry = Date.now() + 3600000;
    await prisma.admin.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(expiry),
      },
    });
    const resetUrl = `https://anginat-event-backend.onrender.com/api/v1/auth/reset-password/${token}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n${resetUrl}`;
    await sendEmail({
      email: email,
      subject: "Password Reset",
      message,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Email sent For Password Reset"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const verifyResetToken = asyncHandler(async (req, res, next) => {
  try {
    const { token } = req.params;
    const users = await prisma.admin.findMany({
      where: {
        resetPasswordToken: token,
      },
    });
    const myuser = users[0];

    if (!myuser) return next(new ApiError(400, "Invalid Password Reset token"));
    if (myuser.resetPasswordExpires < new Date()) {
      return next(new ApiError(400, "Password Teset Token has been expired"));
    }
    /*
    to give the url of the password reset form where user input the password
    */
    // res.render("https://google.com", { token: token });
    res.send("Hii from me");
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const checkTokenValidity = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    const refreshToken = req.cookies?.refreshToken;
    if (!(accessToken || refreshToken))
      return next(new ApiError(401, "Unauthorized request"));
    const decodedaccesstoken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    if (!decodedaccesstoken) {
      const decodedrefreshtoken = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      if (!decodedrefreshtoken)
        return next(new ApiError(401, "Tokens are expired please login again"));
      const userx = await prisma.admin.findUnique({
        where: { id: decodedaccesstoken?.id },
      });
      if (!userx) return next(new ApiError(401, "Invalid refresh Token"));
      const newaccessToken = await generateAccessToken(userx);
      res.cookie("accessToken", newaccessToken, cookieOptions);
      res.cookie("refreshToken", refreshToken, cookieOptions);
      return res
        .status(201)
        .json(new ApiResponse(200, {}, "User Verified Successfully"));
    }
    const user = await prisma.admin.findUnique({
      where: { id: decodedaccesstoken?.id },
    });
    if (!user) return next(new ApiError(401, "Invalid Access Token"));
    return res
      .status(201)
      .json(new ApiResponse(200, {}, "User Verified Successfully"));
  } catch (err) {
    return next(new ApiError(500, "Internal Server Error", err));
  }
});
const changePassword = asyncHandler(async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return next(new ApiError(400, "Password field is required"));
    const { token } = req.params;
    const users = await prisma.admin.findMany({
      where: {
        resetPasswordToken: token,
      },
    });
    const myuser = users[0];
    if (!myuser) return next(new ApiError(400, "Invalid Password Reset token"));
    if (myuser.resetPasswordExpires < new Date()) {
      return next(new ApiError(400, "Password Teset Token has been expired"));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateduser = await prisma.admin.update({
      where: { id: myuser.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
    if (!updateduser) return next(new ApiError(500, "Cannot update password"));
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Reset successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
const googleCheck = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const existeduser = await prisma.admin.findFirst({
      where: {
        AND: {
          companyName: user.companyName,
          phoneNo: user.phoneNo,
        },
      },
    });
    if (!existeduser) {
      const accessToken = await generateAccessToken(existeduser);
      const refreshToken = await generateRefreshToken(existeduser);
      res.cookie("accessToken", accessToken, cookieOptions);
      res.cookie("refreshToken", refreshToken, cookieOptions);
      res.redirect("https://event-frontend-omega.vercel.app/dashboard");
    } else {
      res.redirect(
        `https://event-frontend-omega.vercel.app/signup1?id=${encodeURIComponent(user.id)}`
      );
    }
  } catch (err) {
    console.log(err);
    res.redirect("https://event-frontend-omega.vercel.app/signup");
  }
});
const logoutUser = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user?.id;
    // req.session.destroy((err) => {
    //   if (err) {
    //     return next(new ApiError(500, "Failed to logout", err));
    //   }
    //   res.clearCookie("connect.sid");
    //   // revokeGoogleToken(token);
    // });
    await prisma.admin.update({
      where: { id: parseInt(userId) },
      data: { refreshToken: null },
    });
    res
      .status(200)
      .clearCookie("connect.sid", cookieOptions)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
// function revokeGoogleToken(token) {
//   return new Promise((resolve, reject) => {
//     oauth2Client.revokeToken(token, (err, body) => {
//       if (err) {
//         console.error("Failed to revoke token:", err);
//         return reject(err);
//       }
//       console.log("Token revoked:", body);
//       resolve(body);
//     });
//   });
// }
export {
  registerWithEmail,
  fullRegisteration,
  loginWithEmail,
  refreshAccessToken,
  forgetPassword,
  verifyResetToken,
  checkTokenValidity,
  changePassword,
  logoutUser,
};
