import mongoose from "mongoose";

const animeRowSchema = mongoose.Schema({
    name: String,
    status: String,
    episodes: { type: Number, default: 0 },
    movies: { type: Number, default: 0 },
});

const AnimeRow = mongoose.model("AnimeRow", animeRowSchema);

export default AnimeRow;