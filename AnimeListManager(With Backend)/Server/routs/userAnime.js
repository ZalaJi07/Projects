import express from "express";

import { getAnime, createAnime, updateAnime, deleteAnime, increaseEp, decreaseEp } from "../controllers/userAnime.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getAnime);
router.post("/", auth, createAnime); 
router.patch("/:id", auth, updateAnime);
router.delete("/:id", auth, deleteAnime);
router.patch("/:id/increaseEp", auth, increaseEp);
router.patch("/:id/decreaseEp", auth, decreaseEp)

export default router;
