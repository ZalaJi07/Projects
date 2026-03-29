import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import entryRoutes from "./routs/entry.js";
import userRoutes from "./routs/users.js";
import userAnimeRoutes from "./routs/userAnime.js";

const app = express();
dotenv.config();


app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.use("/anime", entryRoutes);
app.use("/user", userRoutes);
app.use("/userAnime", userAnimeRoutes);

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