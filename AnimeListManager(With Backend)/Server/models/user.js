import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    id: { type: String },
    isAdmin: { type: Boolean, default: false },
    isDisabled: { type: Boolean, default: false },
    // Global monthly episode activity — one total count per month, updated on every +/- press
    // Format: [{ month: "2026-06", count: 14 }]
    episodeLog: { type: [{ month: String, count: Number }], default: [] },
}, { timestamps: true });


export default mongoose.model("User", userSchema);