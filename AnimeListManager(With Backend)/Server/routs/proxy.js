import express from 'express';
import { search, getAnime, getSchedule } from '../controllers/proxy.js';

const router = express.Router();

// No auth needed — these are public anime data endpoints
router.get('/search',     search);
router.get('/anime/:malId', getAnime);
router.get('/schedule',   getSchedule);

export default router;
