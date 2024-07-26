import { Router } from "express";
import {
  registerWithEmail,
  fullRegisteration,
  loginWithEmail,
  refreshAccessToken,
  forgetPassword,
  changePassword,
  verifyResetToken,
  logoutUser,
} from "../controllers/auth.controller.js";
import passport from "passport";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(registerWithEmail);
router.route("/logout").post(logoutUser);
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
    failureRedirect: "https://event-frontend-omega.vercel.app/signup",
    successRedirect: "https://event-frontend-omega.vercel.app/signup1",
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
