import { createServer } from "http";
import express from "express";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
const app = express();
import "./services/google.service.js";
const httpServer = createServer(app);

import { errHandler } from "./middlewares/err.middleware.js";

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
    "Cache-Control",
    "refreshToken",
  ],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Expose-Headers", "accessToken, refreshToken");
  next();
});
app.use(
  express.json({
    limit: "64KB",
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

app.use(express.urlencoded({ extended: true, limit: "64KB" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import eventRegistrationRoutes from "./routes/event.user.routes.js";
import employeeRoutes from "./routes/emp.routes.js";
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin/event", eventRoutes);
app.use("/api/v1/admin/employee", employeeRoutes);
app.use("/api/v1/event", eventRegistrationRoutes);
app.get("/", async (req, res, next) => {
  res.send("hello from server");
});

app.use(errHandler);
export { app, httpServer };
