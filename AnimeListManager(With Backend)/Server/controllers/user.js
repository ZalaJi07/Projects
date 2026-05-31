import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.js";

export const signIn = async (req, res) => {
    const { email, password } = req.body;
    console.log("SignIn Request Body:", req.body);

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

        const { password: _password, ...userWithoutPassword } = existingUser._doc;
        res.status(200).json({ result: userWithoutPassword, token });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
    }
}

export const signUp = async (req, res) => {
    try {
        console.log("SignUp Request Body:", req.body);
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