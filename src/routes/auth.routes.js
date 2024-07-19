import { Router } from "express";
import {
  registerWithEmail,
  fullRegisteration,
  loginWithEmail,
  refreshAccessToken,
  forgetPassword,
  changePassword,
  verifyResetToken,
} from "../controllers/auth.controller.js";
import passport from "passport";

const router = Router();

router.route("/register").post(registerWithEmail);
router.route("/logout").post();
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forget-password").post(forgetPassword);
router.route("/fullRegister").post(fullRegisteration);
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
    failureRedirect: "https://facebook.com",
    successRedirect: "https://google.com",
  }),
  (req, res) => {
    res.send("Google Authenticated successfully");
  }
);

router
  .route("/reset-password/:token")
  .get(verifyResetToken)
  .post(changePassword);
export default router;
