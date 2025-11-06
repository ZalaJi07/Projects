import express from "express";

import { getAnime, createAnime, updateAnime, deleteAnime, increaseEp } from "../controllers/entry.js";

const router = express.Router();

router.get("/", getAnime);
router.post("/", createAnime); 
router.patch("/:id", updateAnime);
router.delete("/:id", deleteAnime);
router.patch("/:id/increaseEp", increaseEp);

export default router;