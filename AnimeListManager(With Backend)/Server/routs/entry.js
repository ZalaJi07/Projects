import express from "express";

import { getAnime, createAnime, updateAnime } from "../controllers/entry.js";

const router = express.Router();

router.get("/", getAnime);

router.post("/", createAnime); 

router.patch("/:id", updateAnime);

export default router;