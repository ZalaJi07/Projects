import mongoose from "mongoose";
import UserAnime from "../models/userAnime.js";

export const getAnime = async (req, res) => {
    try {
        if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

        const { page = 1, limit = 20, search = '', status = '', sort = 'createdAt', order = 'desc', entryType = 'series' } = req.query;

        // Build filter
        const filter = { creator: req.userId };
        // Old entries have no entryType — treat them as "series"
        if (entryType === 'series') {
            filter.$or = [{ entryType: 'series' }, { entryType: { $exists: false } }];
        } else {
            filter.entryType = entryType;
        }
        if (search) filter.name = { $regex: search, $options: 'i' }; // case-insensitive search
        if (status && status !== 'All') filter.status = status;

        // Sort config
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortConfig = { [sort]: sortOrder };

        const total = await UserAnime.countDocuments(filter);
        const animeRows = await UserAnime.find(filter)
            .sort(sortConfig)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.status(200).json({
            data: animeRows,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const createAnime = async (req, res) => {
    const anime = req.body;

    if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

    try {
        // Duplicate check: malId first, then name fallback
        let existing;
        if (anime.malId) {
            existing = await UserAnime.findOne({ creator: req.userId, malId: anime.malId });
        } else {
            existing = await UserAnime.findOne({ creator: req.userId, name: { $regex: new RegExp(`^${anime.name}$`, 'i') } });
        }
        if (existing) return res.status(409).json({ message: `"${anime.name}" is already in your list.` });

        const newAnime = new UserAnime({ ...anime, creator: req.userId });
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
