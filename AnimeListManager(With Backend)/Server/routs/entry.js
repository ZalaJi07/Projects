import express from "express";

import { getAnime } from "../controllers/entry.js";

const router = express.Router();

router.get("/", getAnime);

// router.post("/", ); 

export default router;