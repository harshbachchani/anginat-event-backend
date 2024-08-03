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
    const { eventId } = req.params;
    if (!eventId) return next(new ApiError(400, "Event Id is required"));
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
    const { employees } = req.body;
    console.log(req.body);
    if (!employees) return next(new ApiError(400, "Employee Ids are required"));
    console.log(employees);
    let data;
    try {
      data = JSON.parse(employees);
      console.log(data);
    } catch (error) {
      return next(new ApiError(400, "Invalid JSON for employees Id", error));
    }
    let assignmentResult = [];
    for (let ele of data) {
      const empId = ele.id;
      const flag = Boolean(ele.flag);
      console.log(empId);
      console.log(flag);
      if (flag) {
        const employeeExists = await prisma.employee.findUnique({
          where: { id: parseInt(empId) },
        });
        if (!employeeExists) {
          assignmentResult.push({ empId, status: "Employee Not Found" });
          continue;
        }

        // check if already assigned that event or not
        const existingassignment = await prisma.eventAssignment.findUnique({
          where: {
            employeeId_eventId: {
              employeeId: parseInt(empId),
              eventId: parseInt(eventId),
            },
          },
        });
        if (existingassignment) {
          assignmentResult.push({ empId, status: "Already Assigned" });
        }

        //create the assingment
        const newAssingment = await prisma.eventAssignment.create({
          data: {
            eventId: parseInt(eventId),
            employeeId: parseInt(empId),
          },
        });
        assignmentResult.push({ empId, status: "Assigned", newAssingment });
      } else {
        const employeeExists = await prisma.employee.findUnique({
          where: { id: parseInt(empId) },
        });
        if (!employeeExists) {
          assignmentResult.push({ empId, status: "Employee Not Found" });
          continue;
        }
        // check if already assigned or not
        const existingassignment = await prisma.eventAssignment.findUnique({
          where: {
            employeeId_eventId: {
              employeeId: parseInt(empId),
              eventId: parseInt(eventId),
            },
          },
        });
        if (existingassignment == null) {
          assignmentResult.push({ empId, status: "Event Never Assigned" });
          continue;
        }
        await prisma.eventAssignment.delete({
          where: {
            employeeId_eventId: {
              employeeId: parseInt(empId),
              eventId: parseInt(eventId),
            },
          },
        });
        assignmentResult.push({
          empId,
          status: "Unassigned",
        });
      }
    }
    console.log(assignmentResult);
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          assignmentResult,
          "Employees Processed Successfully"
        )
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
    if (!employees.length) return next(new ApiError(404, "No employees found"));
    return res
      .status(200)
      .json(new ApiResponse(200, employees, "Employees fetched successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const getEmployeesByEventId = asyncHandler(async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const adminId = req.user?.id;
    if (!adminId) return next(new ApiError(404, "Cannot get admin Id"));
    if (isNaN(eventId)) return next(new ApiError(400, "Invalid Event Id"));
    const data1 = await prisma.employee.findMany({
      where: { adminId: parseInt(adminId) },
      select: {
        id: true,
        loginId: true,
        name: true,
      },
    });
    if (!data1.length) return next(new ApiError(404, "No employees found"));
    const result = await prisma.eventAssignment.findMany({
      where: { eventId: parseInt(eventId) },
      include: {
        employee: {
          select: {
            id: true,
          },
        },
      },
    });
    const data2 = result.map((result) => result.employee);
    let employees = [];
    for (let temp of data1) {
      if (data2.some((emp) => emp.id === temp.id)) {
        temp.flag = true;
        employees.push(temp);
      } else {
        temp.flag = false;
        employees.push(temp);
      }
    }
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
