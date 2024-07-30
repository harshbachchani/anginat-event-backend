import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import prisma from "../db/config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
  encryptPassword,
  decryptPassword,
} from "../services/auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
};
const registerEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { name, phoneNo, password, loginId } = req.body;
    if (!(name && phoneNo && password && loginId))
      return next(new ApiError(400, "All Fields are required"));
    const adminId = req.user?.id;
    const exsitedemp = await prisma.employee.findFirst({
      where: {
        AND: [{ adminId }, { loginId }],
      },
    });
    if (exsitedemp)
      return next(new ApiError(400, "User with the loginId already exist"));
    const hashedPassword = encryptPassword(password);
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
      .json(new ApiResponse(201, createdUser, "Employee created successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const assignEvent = asyncHandler(async (req, res, next) => {
  try {
    const { empId, eventId } = req.body;
    const existedEvent = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
    });
    if (!existedEvent)
      return next(new ApiError(404, "Event not found with given event Id"));

    if (existedEvent.adminId != req.user?.id) {
      return next(
        new ApiError(
          400,
          "This event with provided Id is not created by the logged in admin"
        )
      );
    }
    const alreadyassigned = await prisma.eventAssignment.findFirst({
      where: {
        AND: [{ employeeId: parseInt(empId) }, { eventId: parseInt(eventId) }],
      },
    });
    if (alreadyassigned)
      return next(new ApiError(400, "Employee already assigned to the event"));
    const assignemp = await prisma.eventAssignment.create({
      data: {
        employeeId: parseInt(empId),
        eventId: parseInt(eventId),
        role: "Employee",
      },
    });
    if (!assignemp)
      return next(new ApiError(500, "Error assigning event to the employee"));
    return res
      .status(201)
      .json(
        new ApiResponse(201, {}, "Event assigned to employee successfully")
      );
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
const loginEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { loginId, password } = req.body;
    if (!(loginId && password))
      return next(new ApiError(400, "Email and password fields are required"));
    const myemp = await prisma.employee.findUnique({ where: { email } });
    if (!myemp)
      return next(
        new ApiError(404, "Employee not found, please register first")
      );
    if (!myemp.password) {
      return next(new ApiError(401, "Invalid password"));
    }
    const decryptedpassword = decryptPassword(myemp.password);
    const isMatch = decryptedpassword == password;
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

const getAllEmployee = asyncHandler(async (req, res, next) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return next(new ApiError(404, "Cannot get admin Id"));
    const employees = await prisma.employee.findMany({
      where: { adminId: parseInt(adminId) },
    });
    if (!employees || !employees.length)
      return next(new ApiError(400, "No employees found"));
    return res
      .status(200)
      .json(new ApiResponse(200, employees, "Employees fetched successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const getEmployeesByEventId = asyncHandler(async (req, res, next) => {
  try {
    const { eventId } = req.body;
    if (isNaN(eventId)) return next(new ApiError(400, "Invalid Event Id"));
    const result = await prisma.eventAssignment.findMany({
      where: { eventId: parseInt(eventId) },
      include: {
        employee: true,
      },
    });
    if (!result || !result.length)
      return next(new ApiError(400, "No employee found for for this event"));
    const employees = result.map((result) => result.employee);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          employees,
          `Employees fetched for event with id ${eventId}`
        )
      );
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const updateEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { empId } = req.params;
    const emp = await prisma.employee.findUnique({
      where: { id: parseInt(empId) },
    });
    if (!emp) return next(new ApiError(404, "Employee not found"));
    const { loginId, password, name, phoneNo } = req.body;
    const adminId = req.user?.id;
    let updatedInfo = {};
    if (loginId) updatedInfo.loginId = loginId;
    if (password) {
      const hashedPassword = encryptPassword(password);
      updatedInfo.password = hashedPassword;
    }
    if (name) updatedInfo.name = name;
    if (phoneNo) updatedInfo.phoneNo = phoneNo;
    if (Object.keys(updatedInfo).length === 0) {
      return next(new ApiError(400, "Atleast one parameter is required"));
    }
    const updatedEmp = await prisma.employee.update({
      where: { id: parseInt(empId) },
      data: updatedInfo,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, updatedEmp, "Employee updated successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const deleteEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { empId } = req.params;
    const myemp = await prisma.employee.findUnique({
      where: { id: parseInt(empId) },
    });
    if (!myemp) return next(new ApiError(404, "Employee Not found"));
    await prisma.eventAssignment.deleteMany({
      where: { employeeId: parseInt(empId) },
    });
    await prisma.employee.delete({ where: { id: parseInt(empId) } });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Employee and related assignments deleted successfully"
        )
      );
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
export {
  registerEmployee,
  loginEmployee,
  assignEvent,
  getAllEmployee,
  getEmployeesByEventId,
  updateEmployee,
  deleteEmployee,
};
