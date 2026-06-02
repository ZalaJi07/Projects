import express from "express";

import { signIn, signUp, googleSignIn, updateProfile } from "../controllers/user.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { signInRules, signUpRules, validate } from "../middleware/validators.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post('/signin', authLimiter, signInRules, validate, signIn)
router.post('/signup', authLimiter, signUpRules, validate, signUp)
router.post('/googleSignIn', authLimiter, googleSignIn)
router.patch('/profile', auth, updateProfile)

export default router;