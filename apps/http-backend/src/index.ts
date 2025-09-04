import express from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middlewares/auth.middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateUserSchema,
  SignInSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import bcrypt from "bcryptjs";

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.json({
      message: "Incorrect Inputs",
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(parsedData.data?.password, 10);

  try {
    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data?.username,
        password: hashedPassword,
        name: parsedData.data?.name,
      },
    });

    res.status(201).json({
      message: "User Signed Up successfully",
      userId: user.id,
    });
  } catch (e) {
    res.status(411).json({
      message: "User with this email already exists",
    });
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = SignInSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.json({
      message: "Invalid Credentials",
    });
    return;
  }

  try {
    const user = await prismaClient.user.findFirst({
      where: {
        email: parsedData.data?.username,
      },
    });

    if (!user) {
      res.json({
        message: "Not authorized",
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(
      parsedData.data?.password,
      user.password
    );

    if (!isValidPassword) {
      res.status(411).json({
        message: "Incorrect Password",
      });
    }

    const token = jwt.sign(
      {
        userId: user?.id,
      },
      JWT_SECRET,
      { expiresIn: "96h" }
    );

    res.status(200).json({
      token,
      message: "User signed in successfully",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.post("/room", authMiddleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.json({
      message: "Incorrect inputs",
    });
    return;
  }

  // db call
  try {
    const userId = req.userId;

    console.log(userId);

    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId as string,
      },
    });

    res.json({
      roomId: room.id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);

  const messages = await prismaClient.chat.findMany({
    where: {
      roomId: roomId,
    },
    orderBy: {
      id: "desc",
    },
    take: 50,
  });

  return res.json({
    messages,
  });
});

app.listen(5000);
