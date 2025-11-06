import express from "express";

import { getAnime, createAnime, updateAnime, deleteAnime, increaseEp, decreaseEp } from "../controllers/entry.js";

const router = express.Router();

router.get("/", getAnime);
router.post("/", createAnime); 
router.patch("/:id", updateAnime);
router.delete("/:id", deleteAnime);
router.patch("/:id/increaseEp", increaseEp);
router.patch("/:id/decreaseEp", decreaseEp)

export default router;