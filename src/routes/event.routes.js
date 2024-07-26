import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteEvent,
  getAllCreatedEvents,
  getEventDetails,
  registerEvent,
  updateEvent,
  getAllEventRegsiteredUser,
} from "../controllers/event.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);
router.route("/register").post(upload.single("image"), registerEvent);
router
  .route("/:id")
  .get(getEventDetails)
  .delete(deleteEvent)
  .put(upload.single("image"), updateEvent);
router.route("/").get(getAllCreatedEvents);
router.route("/users/:eventId").get(getAllEventRegsiteredUser);
export default router;
