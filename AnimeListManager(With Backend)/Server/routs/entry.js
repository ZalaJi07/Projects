import express from "express";

import { getAnime, createAnime } from "../controllers/entry.js";

const router = express.Router();

router.get("/", getAnime);

router.post("/", createAnime); 

export default router;