import AnimeRow from "../models/animeRow.js";

export const getAnime = async (req, res) => {
    try {
        const animeRows = await AnimeRow.find();
        res.status(200).json(animeRows);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const createAnime = async (req, res) => {
    const anime = req.body;

    const newAnime = new AnimeRow(anime);
    try {
        await newAnime.save();
        res.status(201).json(newAnime);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}