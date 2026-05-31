import express from "express";
import auth from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";
import { getUsers, disableUser, removeUser } from "../controllers/admin.js";

const router = express.Router();

// All admin routes require a valid JWT (auth) AND verified admin status (requireAdmin)
router.get("/users", auth, requireAdmin, getUsers);
router.patch("/users/:id/disable", auth, requireAdmin, disableUser);
router.delete("/users/:id", auth, requireAdmin, removeUser);

export default router;
