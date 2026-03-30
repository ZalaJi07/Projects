import mongoose from "mongoose";

const userAnimeSchema = mongoose.Schema({
    name: { type: String, required: true },
    status: String,
    episodes: { type: Number, default: 0 },
    movies: { type: Number, default: 0 },
    creator: { type: String, required: true },
}, { timestamps: true });

// Index for fast per-user queries and sorting
userAnimeSchema.index({ creator: 1, createdAt: -1 });
userAnimeSchema.index({ creator: 1, name: 1 });

const UserAnime = mongoose.model("UserAnime", userAnimeSchema);

export default UserAnime;
