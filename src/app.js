import { createServer } from "http";
import express from "express";
import cors from "cors";
import prisma from "./db/config.js";
const app = express();
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

app.use(express.urlencoded({ extended: true, limit: "16KB" }));
app.use(express.static("public"));

app.use(errHandler);
app.post("/user/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        passwod: password,
      },
    });
    return res.status(200).json({ msg: "User registered", data: newUser });
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
});
app.put("/user/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { name, email, passwod: password },
    });
    return res.status(200).json({ msg: "User updated", data: user });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", err: error });
  }
});
app.delete("/user/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: Number(id) },
    });
    return res.status(200).json({ msg: `User deleted with id ${id}` });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", err: error });
  }
});
app.get("/user/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });
    return res
      .status(200)
      .json({ msg: "Users Successfully fecthed", data: user });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", err: error });
  }
});

app.post("/events/register", async (req, res, next) => {
  try {
    const { userId, name, location } = req.body;
    const event = await prisma.event.create({
      data: {
        name,
        location,
        userId,
      },
    });
    res.status(200).json({ msg: "User Registered On event ", data: event });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", err: error });
  }
});
app.get("/", (req, res, next) => {
  res.send("Hello from server");
});

export { app, httpServer };
