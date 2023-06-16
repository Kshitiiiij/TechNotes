const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

//GET ALL USER
const getAllUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findMany({
    select: {
      username: true,
      roles: true,
    },
  });

  if (!user || user.length === 0) {
    return res.status(404).json({ message: "No Users found" });
  }
  res.json(user);
});

//CREATE NEW USER
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles, active } = req.body;

  if (!username || !password || !roles || typeof active !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }

  const dupliate = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  if (dupliate) {
    return res.status(409).json({ message: "Username already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username: username,
      password: hashedPassword,
      roles: roles,
      isActive: active,
    },
  });

  if (user) {
    res
      .status(201)
      .json({ message: `New User ${username} created successfully` });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
});

//UPDATE USER
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, password, roles, active } = req.body;
  if (!id || !username || !Array || typeof active !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const duplicate = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });
  if(duplicate && duplicate.id !== parseInt(id)) {
    return res.status(409).json({ message: "Username already exists" });
  }

  user.username = username;
  user.roles = roles;
  user.isActive = active;

  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }
  const updatedUser = await prisma.user.update({
    where: {
      id: parseInt(id),
    },
    data: user,
  });
  if (updatedUser) {
    res.status(200).json({ message: "User updated successfully" });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
});

//DELETE USER

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const notes = await prisma.notes.findMany({
    where: {
      userId: parseInt(id),
    }
  })

  if(notes && notes.length > 0) {
    return res.status(409).json({ message: "User has notes, delete them first" });
  }
  
  const deletedUser = await prisma.user.delete({
    where: {
      id: parseInt(id),
    },
  });

  if (deletedUser) {
    res.status(200).json({ message: "User deleted successfully" });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
});

module.exports = { getAllUser, createNewUser, updateUser, deleteUser };
