import express from "express";
import { getPublicList } from "../controllers/publicList.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public route — no auth required
router.get("/:username", apiLimiter, getPublicList);

export default router;
