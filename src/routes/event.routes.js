import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteEvent,
  getAllCreatedEvents,
  getEventDetails,
  registerEvent,
  updateEvent,
} from "../controllers/event.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);
router
  .route("/:id")
  .get(getEventDetails)
  .delete(deleteEvent)
  .patch(updateEvent);
router.route("/").get(getAllCreatedEvents);
router.route("/register").post(upload.single("image"), registerEvent);
export default router;
