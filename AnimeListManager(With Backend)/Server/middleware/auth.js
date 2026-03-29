import jwt from "jsonwebtoken";

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
        } else {
            decodedData = jwt.decode(token);
            req.userId = decodedData?.sub;
        }

        next();
    } catch (error) {
        console.log(error);
        // If auth fails, return 401 to prevent request hanging
        res.status(401).json({ message: "Unauthenticated" });
    }
}

export default auth;