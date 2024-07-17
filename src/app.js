import { createServer } from "http";
import express from "express";
import cors from "cors";
import prisma from "./db/config.js";
import passport from "passport";
import session from "express-session";
const app = express();
import "./services/google.service.js";
const httpServer = createServer(app);

import { errHandler } from "./middlewares/err.middleware.js";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(
  express.json({
    limit: "16KB",
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.urlencoded({ extended: true, limit: "16KB" }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

import authRoutes from "./routes/auth.routes.js";

app.use("/api/v1/auth", authRoutes);
app.get("/", (req, res, next) => {
  res.send("Hello from server");
});

app.use(errHandler);
export { app, httpServer };
