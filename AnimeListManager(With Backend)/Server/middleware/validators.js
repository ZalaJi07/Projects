import { body, validationResult } from "express-validator";

// Middleware to check validation results
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
};

// Validation rules for sign up
export const signUpRules = [
    body("email")
        .trim()
        .isEmail().withMessage("Please provide a valid email address.")
        .normalizeEmail(),
    body("username")
        .trim()
        .isLength({ min: 2, max: 30 }).withMessage("Username must be between 2 and 30 characters."),
    body("password")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long."),
    body("confirmPassword")
        .custom((value, { req }) => value === req.body.password).withMessage("Passwords don't match."),
];

// Validation rules for sign in
export const signInRules = [
    body("email")
        .trim()
        .isEmail().withMessage("Please provide a valid email address.")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("Password is required."),
];

// Validation rules for creating/updating anime
export const animeRules = [
    body("name")
        .trim()
        .notEmpty().withMessage("Anime name is required.")
        .isLength({ max: 200 }).withMessage("Anime name is too long."),
    body("status")
        .optional()
        .isIn(["Finished", "CaughtUp", "Watching", "OnHold", "Pending", "Dropped"])
        .withMessage("Invalid status."),
    body("episodes")
        .optional()
        .isInt({ min: 0 }).withMessage("Episodes must be a positive number."),
    body("movies")
        .optional()
        .isInt({ min: 0 }).withMessage("Movies must be a positive number."),
    body("rating")
        .optional({ nullable: true })
        .isFloat({ min: 0, max: 10 }).withMessage("Rating must be between 0 and 10."),
];

// Validation rules for profile updates (username + optional password change)
export const profileRules = [
    body("username")
        .optional()
        .trim()
        .isLength({ min: 2, max: 30 }).withMessage("Username must be between 2 and 30 characters.")
        .matches(/^[a-zA-Z0-9_.-]+$/).withMessage("Username can only contain letters, numbers, underscores, dots and hyphens."),
    body("newPassword")
        .optional()
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
    body("confirmNewPassword")
        .optional()
        .custom((value, { req }) => {
            if (req.body.newPassword && value !== req.body.newPassword) {
                throw new Error("Passwords don't match.");
            }
            return true;
        }),
];

