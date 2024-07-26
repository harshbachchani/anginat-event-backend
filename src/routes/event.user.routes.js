import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getAllEvents,
  userEventRegistration,
  getEventById,
} from "../controllers/event.user.controller.js";

const router = Router();

router.route("/").get(getAllEvents);
router.route("/:eventId").get(getEventById).post(userEventRegistration);

export default router;
