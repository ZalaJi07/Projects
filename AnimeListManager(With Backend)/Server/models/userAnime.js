import mongoose from "mongoose";

const userAnimeSchema = mongoose.Schema({
    name: { type: String, required: true },
    status: String,
    episodes: { type: Number, default: 0 },
    movies: { type: Number, default: 0 },
    creator: { type: String, required: true },
});

const UserAnime = mongoose.model("UserAnime", userAnimeSchema);

export default UserAnime;
