import mongoose from "mongoose";

const animeRowSchema = mongoose.Schema({
    title: String,
    status: String,
    episodes: { type: Number, default: 0 },
    movie: { type: Number, default: 0 },
});

const AnimeRow = mongoose.model("AnimeRow", animeRowSchema);

export default AnimeRow;