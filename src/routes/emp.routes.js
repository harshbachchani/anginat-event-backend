import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  loginEmployee,
  registerEmployee,
} from "../controllers/employee.controller.js";
const router = Router();

router.route("/register").post(registerEmployee);
router.route("/login").post(loginEmployee);
