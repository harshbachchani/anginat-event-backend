import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  assignEvent,
  deleteEmployee,
  getAllEmployee,
  getEmployeesByEventId,
  loginEmployee,
  registerEmployee,
  updateEmployee,
} from "../controllers/employee.controller.js";
const router = Router();

router.route("/register").post(verifyJWT, registerEmployee);
router
  .route("/:empId")
  .put(verifyJWT, updateEmployee)
  .delete(verifyJWT, deleteEmployee);
router.route("/").get(verifyJWT, getAllEmployee);
router.route("/event/:eventId").get(verifyJWT, getEmployeesByEventId);
router.route("/event/:eventId").post(verifyJWT, assignEvent);
export default router;
