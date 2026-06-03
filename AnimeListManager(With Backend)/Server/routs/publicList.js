import express from "express";
import { getPublicList, getPublicStats } from "../controllers/publicList.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public routes — no auth required
router.get("/:username/stats", apiLimiter, getPublicStats);
router.get("/:username", apiLimiter, getPublicList);

export default router;
