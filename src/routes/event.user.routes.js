import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getAllEvents,
  userEventRegistration,
  getEventById,
} from "../controllers/event.user.controller.js";
import { convertDateToIST } from "../services/dateconversion.service.js";

const router = Router();

router.route("/").get(getAllEvents);
router
  .route("/:eventId")
  .get(getEventById)
  .post(upload.single("profile"), userEventRegistration);

router.route("/testing").put((req, res, next) => {
  const { mydate } = req.body;
  console.log(mydate);
  const x = new Date(mydate);
  const y = convertDateToIST(mydate);
  const z = convertDateToIST(y);
  console.log(x);
  console.log(y);
  console.log(z);
  res.send("ok");
});
export default router;
