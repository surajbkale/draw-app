import express from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middlewares/auth.middleware";

const app = express();

app.post("/signup", (req, res) => {});

app.post("/signin", (req, res) => {
  // db call
  const userId = 1;
  const token = jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET as string
  );

  res.json({
    token,
  });
});

app.post("/room", authMiddleware, (req, res) => {
  // db call

  res.json({
    roomId: 123,
  });
});

app.listen(5000);
