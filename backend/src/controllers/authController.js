import User from "../models/User.js";
import bcrypt from "bcrypt";
import { cookieOptions, createToken } from "../utils/token.js";
import cloudinary from "../config/cloudinary.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});
export async function register(req, res, next) {
  try {
    const { name, email, password, role = "applicant" } = req.body;
    if (!["applicant", "recruiter"].includes(role))
      return res.status(400).json({
        message: "Only applicant or recruiter registration is allowed",
      });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "That email is already registered" });
    next(error);
  }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchesPassword(password)))
      return res.status(401).json({ message: "Incorrect email or password" });
    res
      .cookie("token", createToken(user._id), cookieOptions)
      .json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}
export function logout(req, res) {
  res
    .clearCookie("token", { ...cookieOptions, maxAge: undefined })
    .status(204)
    .send();
}
export const currentUser = (req, res) => res.json({ user: safeUser(req.user) });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateProfile(req, res, next) {
  try {
    const name = (req.body.name ?? "").trim();
    const email = (req.body.email ?? "").trim().toLowerCase();
    if (!name || name.length > 80)
      return res.status(400).json({ message: "Name is required (80 characters max)" });
    if (!EMAIL_PATTERN.test(email))
      return res.status(400).json({ message: "Please enter a valid email address" });

    if (email !== req.user.email && (await User.exists({ email, _id: { $ne: req.user._id } })))
      return res.status(409).json({ message: "That email is already registered" });

    const user = req.user;
    user.name = name;
    user.email = email;

    let previousAvatarId;
    if (req.file) {
      const image = await uploadToCloudinary(req.file.buffer, "job-portal/avatars", "image");
      previousAvatarId = user.avatar?.publicId;
      user.avatar = { url: image.secure_url, publicId: image.public_id };
    }
    await user.save();

    // Best effort: remove the replaced image so old avatars don't pile up.
    if (previousAvatarId) cloudinary.uploader.destroy(previousAvatarId).catch(() => {});

    res.json({ user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: "That email is already registered" });
    next(error);
  }
}
