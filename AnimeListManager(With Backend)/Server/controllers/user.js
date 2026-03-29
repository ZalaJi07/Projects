import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.js";

export const signIn = async (req, res) => {
    const { email, password } = req.body;
    console.log("SignIn Request Body:", req.body);

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) return res.status(404).json({ message: "User doesn't exist!" });

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials." });

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        const { password, ...userWithoutPassword } = existingUser._doc;
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

        const token = jwt.sign({ email: result.email, id: result._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

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
            const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const { password, ...userWithoutPassword } = existingUser._doc;
            res.status(200).json({ result: userWithoutPassword, token });
        } else {
            const result = await User.create({ email, username: name, password: sub }); // Using sub as password for now, though it can be random
            const token = jwt.sign({ email: result.email, id: result._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.status(200).json({ result, token });
        }
    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
        console.log(error);
    }
}