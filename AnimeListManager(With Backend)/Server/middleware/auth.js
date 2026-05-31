import jwt from "jsonwebtoken";
import User from "../models/user.js";

const auth = async (req, res, next) => {
    try {
        console.log("Auth Middleware - Headers:", req.headers.authorization ? "Present" : "Missing");

        if (!req.headers.authorization) return res.status(401).json({ message: "Unauthenticated" });

        const token = req.headers.authorization.split(" ")[1];
        const isCodedAuth = token && token.length < 500;

        let decodedData;

        if (token && isCodedAuth) {
            decodedData = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decodedData?.id;
            req.isAdmin = decodedData?.isAdmin || false;
        } else {
            decodedData = jwt.decode(token);
            req.userId = decodedData?.sub;
            req.isAdmin = false;
        }

        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: "Unauthenticated" });
    }
}

// Secondary guard — DB-backed admin check so no crafted JWT can bypass it
export const requireAdmin = async (req, res, next) => {
    try {
        if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

        const user = await User.findById(req.userId).select("isAdmin");
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        next();
    } catch (error) {
        res.status(403).json({ message: "Access denied." });
    }
};

export default auth;