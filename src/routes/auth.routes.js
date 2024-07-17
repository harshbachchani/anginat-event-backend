import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  registerWithEmail,
  fullRegisteration,
  loginWithEmail,
} from "../controllers/auth.controller.js";
import passport from "passport";

const router = Router();

router.route("/register").post(registerWithEmail);
router.route("/logout").post();
router.route("/refresh-token").post(verifyJWT);
router.route("change-password").post(verifyJWT);
router.route("/fullRegister").post(fullRegisteration);
router.route("/current-user").get(verifyJWT);
router.route("/login").post(loginWithEmail);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/https://facebook.com",
    successRedirect: "https://google.com",
  }),
  (req, res) => {
    res.send("Google Authenticated successfully");
  }
);
export default router;
