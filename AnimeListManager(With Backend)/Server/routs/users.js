import express from "express";

import { signIn, signUp, googleSignIn } from "../controllers/user.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { signInRules, signUpRules, validate } from "../middleware/validators.js";

const router = express.Router();

router.post('/signin', authLimiter, signInRules, validate, signIn)
router.post('/signup', authLimiter, signUpRules, validate, signUp)
router.post('/googleSignIn', authLimiter, googleSignIn)

export default router;