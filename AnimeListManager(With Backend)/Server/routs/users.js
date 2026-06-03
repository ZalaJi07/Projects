import express from "express";

import { signIn, signUp, googleSignIn, updateProfile, getUserStats, getMe } from "../controllers/user.js";
import { authLimiter, apiLimiter } from "../middleware/rateLimiter.js";
import { signInRules, signUpRules, profileRules, validate } from "../middleware/validators.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post('/signin', authLimiter, signInRules, validate, signIn)
router.post('/signup', authLimiter, signUpRules, validate, signUp)
router.post('/googleSignIn', authLimiter, googleSignIn)
router.patch('/profile', auth, profileRules, validate, updateProfile)
router.get('/stats', auth, getUserStats)
router.get('/me', auth, apiLimiter, getMe)

export default router;