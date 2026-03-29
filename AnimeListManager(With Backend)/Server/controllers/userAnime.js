import mongoose from "mongoose";
import UserAnime from "../models/userAnime.js";

export const getAnime = async (req, res) => {
    try {
        if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

        const animeRows = await UserAnime.find({ creator: req.userId });
        res.status(200).json(animeRows);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const createAnime = async (req, res) => {
    const anime = req.body;

    if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

    const newAnime = new UserAnime({ ...anime, creator: req.userId });
    try {
        await newAnime.save();
        res.status(201).json(newAnime);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

export const updateAnime = async (req, res) => {
    const { id: _id } = req.params;
    const anime = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No anime with that id!');

    const existing = await UserAnime.findById(_id);
    if (!existing || existing.creator !== req.userId) return res.status(403).json({ message: "Not authorized" });

    const updatedPost = await UserAnime.findByIdAndUpdate(_id, { ...anime, _id }, { new: true });
    res.json(updatedPost);
}

export const deleteAnime = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No anime with that id!');

    const existing = await UserAnime.findById(_id);
    if (!existing || existing.creator !== req.userId) return res.status(403).json({ message: "Not authorized" });

    await UserAnime.findByIdAndDelete(_id);
    res.json({ message: 'Anime deleted successfully.' });
}

export const increaseEp = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No anime with that id!');

    const anime = await UserAnime.findById(_id);
    if (!anime || anime.creator !== req.userId) return res.status(403).json({ message: "Not authorized" });

    const updatedAnime = await UserAnime.findByIdAndUpdate(_id, { episodes: anime.episodes + 1 }, { new: true });
    res.json(updatedAnime);
}

export const decreaseEp = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No anime with that id!');

    const anime = await UserAnime.findById(_id);
    if (!anime || anime.creator !== req.userId) return res.status(403).json({ message: "Not authorized" });

    const updatedAnime = await UserAnime.findByIdAndUpdate(_id, { episodes: anime.episodes - 1 }, { new: true });
    res.json(updatedAnime);
}
