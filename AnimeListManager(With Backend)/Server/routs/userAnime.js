import express from "express";

import { getAnime, createAnime, updateAnime, deleteAnime, increaseEp, decreaseEp } from "../controllers/userAnime.js";

import auth from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";
import { animeRules, validate } from "../middleware/validators.js";

const router = express.Router();

router.get("/", auth, getAnime);
router.post("/", auth, apiLimiter, animeRules, validate, createAnime); 
router.patch("/:id", auth, apiLimiter, animeRules, validate, updateAnime);
router.delete("/:id", auth, apiLimiter, deleteAnime);
router.patch("/:id/increaseEp", auth, apiLimiter, increaseEp);
router.patch("/:id/decreaseEp", auth, apiLimiter, decreaseEp);

export default router;
