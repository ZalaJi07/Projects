import rateLimit from "express-rate-limit";

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for auth routes (prevent brute force)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 auth attempts per window
    message: { message: "Too many login attempts, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});
