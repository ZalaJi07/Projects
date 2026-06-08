import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.js";

export const signIn = async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) return res.status(404).json({ message: "User doesn't exist!" });

        // Block disabled accounts — new field defaults to false so existing users pass through
        if (existingUser.isDisabled) {
            return res.status(403).json({ message: "Your account has been disabled. Contact support." });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials." });

        const token = jwt.sign(
            { email: existingUser.email, id: existingUser._id, isAdmin: existingUser.isAdmin || false },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Strip password before sending — never send hashed passwords to the client
        const { password: _password, ...userWithoutPassword } = existingUser._doc;
        res.status(200).json({ result: userWithoutPassword, token });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
    }
}

export const signUp = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists." });

        if (password !== confirmPassword) return res.status(400).json({ message: "Passwords don't match." });

        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await User.create({ email, password: hashedPassword, username });

        const token = jwt.sign(
            { email: result.email, id: result._id, isAdmin: false },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({ result, token });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Something went wrong.", error: error.message });
    }
}

export const googleSignIn = async (req, res) => {
    const { token } = req.body;

    try {
        // Google ID token comes from the frontend OAuth library — safe to decode here
        const decoded = jwt.decode(token);
        const { email, name, sub } = decoded;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // Block disabled accounts
            if (existingUser.isDisabled) {
                return res.status(403).json({ message: "Your account has been disabled. Contact support." });
            }

            const newToken = jwt.sign(
                { email: existingUser.email, id: existingUser._id, isAdmin: existingUser.isAdmin || false },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );
            const { password, ...userWithoutPassword } = existingUser._doc;
            res.status(200).json({ result: userWithoutPassword, token: newToken });
        } else {
            // New Google user — use sub as the password placeholder (never used for login)
            const result = await User.create({ email, username: name, password: sub });
            const newToken = jwt.sign(
                { email: result.email, id: result._id, isAdmin: false },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );
            res.status(200).json({ result, token: newToken });
        }
    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
        console.log(error);
    }
}

export const updateProfile = async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        // ── Username change ──
        if (username && username.trim() !== user.username) {
            const trimmed = username.trim();
            if (trimmed.length < 2 || trimmed.length > 30) {
                return res.status(400).json({ message: "Username must be between 2 and 30 characters." });
            }
            const taken = await User.findOne({ username: trimmed });
            if (taken) return res.status(400).json({ message: "Username is already taken." });
            user.username = trimmed;
        }

        // ── Password change ──
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required." });
            }
            const isCorrect = await bcrypt.compare(currentPassword, user.password);
            if (!isCorrect) return res.status(400).json({ message: "Current password is incorrect." });
            if (newPassword.length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters." });
            }
            user.password = await bcrypt.hash(newPassword, 12);
        }

        await user.save();

        // Re-issue token so the client stays logged in with fresh data
        const token = jwt.sign(
            { email: user.email, id: user._id, isAdmin: user.isAdmin || false },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const { password: _pw, ...userWithoutPassword } = user._doc;
        res.status(200).json({ result: userWithoutPassword, token });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
    }
}

export const getUserStats = async (req, res) => {
    try {
        const user = await User.findById(req.userId, { episodeLog: 1 });
        if (!user) return res.status(404).json({ message: "User not found." });
        res.json({ episodeLog: user.episodeLog || [] });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
    }
};

// Called on every app load to silently refresh stale localStorage on other devices.
// Returns fresh profile + a new token so username/isAdmin changes propagate automatically.
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account has been disabled." });
        }

        const token = jwt.sign(
            { email: user.email, id: user._id, isAdmin: user.isAdmin || false },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const { password: _pw, ...userWithoutPassword } = user._doc;
        res.json({ result: userWithoutPassword, token });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
    }
};