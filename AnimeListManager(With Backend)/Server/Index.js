import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import entryRoutes from "./routs/entry.js";
import userRoutes from "./routs/users.js";
import userAnimeRoutes from "./routs/userAnime.js";
import publicListRoutes from "./routs/publicList.js";
import adminRoutes from "./routs/admin.js";

const app = express();
dotenv.config();


app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ limit: "1mb", extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use("/anime", entryRoutes);
app.use("/user", userRoutes);
app.use("/userAnime", userAnimeRoutes);
app.use("/list", publicListRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Anime List Manager is running...");
});

const CONNECTION_URL = process.env.CONNECTION_URL;
const PORT = process.env.PORT || 5000;

mongoose.connect(CONNECTION_URL)
  .then(() => app.listen(PORT, () => console.log(`✅ Server running on port: ${PORT}`)))
  .catch((error) => console.error("MongoDB connection error:", error));

// mongoose
//   .connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
//   .catch((error) => console.log(error.message));

// mongoose.set("useFindAndModify", false);