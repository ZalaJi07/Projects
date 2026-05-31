import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    id: { type: String },
    // Admin panel fields — both default to false so all existing users are unaffected
    isAdmin: { type: Boolean, default: false },
    isDisabled: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("User", userSchema);