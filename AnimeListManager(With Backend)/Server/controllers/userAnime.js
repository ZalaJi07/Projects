import mongoose from "mongoose";
import UserAnime from "../models/userAnime.js";
import User from "../models/user.js";

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
        if (search) filter.name = { $regex: search, $options: 'i' };
        if (status && status !== 'All') filter.status = status;

        // Allowlist sort field to prevent arbitrary field injection in the aggregation pipeline
        const ALLOWED_SORT = ['createdAt', 'name', 'status', 'episodes', 'rating'];
        const safeSort = ALLOWED_SORT.includes(sort) ? sort : 'createdAt';
        const sortOrder = order === 'asc' ? 1 : -1;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Issue 5 fix: single $facet aggregation replaces two separate DB calls
        // (countDocuments + find). Both the data slice and the total count are
        // computed in one round-trip, halving DB load per page navigation.
        const [result] = await UserAnime.aggregate([
            { $match: filter },
            {
                $facet: {
                    data: [
                        { $sort: { [safeSort]: sortOrder } },
                        { $skip: (pageNum - 1) * limitNum },
                        { $limit: limitNum },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
        ]);

        const total = result?.total[0]?.count ?? 0;

        res.status(200).json({
            data: result?.data ?? [],
            currentPage: pageNum,
            totalPages: Math.max(1, Math.ceil(total / limitNum)),
            totalItems: total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fetch ALL entries for the user (no pagination) — used for client-side export
// Intentionally lightweight: just a plain DB read + JSON response, zero CPU formatting
export const getAllAnime = async (req, res) => {
    try {
        if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

        const animeRows = await UserAnime.find({ creator: req.userId })
            .sort({ createdAt: -1 })
            .select('name status episodes movies rating malId entryType createdAt');

        res.status(200).json({ data: animeRows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Strip HTML tags and trim whitespace
const sanitizeName = (name) => {
    if (typeof name !== 'string') return '';
    return name.replace(/<[^>]*>/g, '').trim();
};

// Escape special regex characters to prevent ReDoS
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createAnime = async (req, res) => {
    const anime = req.body;

    if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

    // Sanitize name
    anime.name = sanitizeName(anime.name);
    if (!anime.name) return res.status(400).json({ message: "Anime name is required." });
    if (anime.name.length > 200) return res.status(400).json({ message: "Anime name is too long (max 200 characters)." });

    try {
        // Duplicate check: malId first, then name fallback
        let existing;
        if (anime.malId) {
            existing = await UserAnime.findOne({ creator: req.userId, malId: anime.malId });
        } else {
            existing = await UserAnime.findOne({ creator: req.userId, name: { $regex: new RegExp(`^${escapeRegex(anime.name)}$`, 'i') } });
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

    // Sanitize name if provided
    if (anime.name !== undefined) {
        anime.name = sanitizeName(anime.name);
        if (!anime.name) return res.status(400).json({ message: "Anime name is required." });
        if (anime.name.length > 200) return res.status(400).json({ message: "Anime name is too long (max 200 characters)." });
    }

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

    const month = new Date().toISOString().slice(0, 7); // e.g. "2026-06"

    // Create the month entry if it doesn't exist yet, then increment in the next step.
    // Two-step is intentional: updateOne with $push + $ne is not atomic on the increment,
    // so we just guarantee the document exists here.
    await User.updateOne(
        { _id: req.userId, "episodeLog.month": { $ne: month } },
        { $push: { episodeLog: { month, count: 0 } } }
    );

    // Increment anime episode count + user's monthly total in parallel
    const [updatedAnime] = await Promise.all([
        UserAnime.findByIdAndUpdate(_id, { $inc: { episodes: 1 } }, { new: true }),
        User.updateOne(
            { _id: req.userId, "episodeLog.month": month },
            { $inc: { "episodeLog.$.count": 1 } }
        ),
    ]);

    res.json(updatedAnime);
};

export const decreaseEp = async (req, res) => {
    const { id: _id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No anime with that id!');

    const anime = await UserAnime.findById(_id);
    if (!anime || anime.creator !== req.userId) return res.status(403).json({ message: "Not authorized" });

    const month = new Date().toISOString().slice(0, 7);

    // Ensure month entry exists in User's log
    await User.updateOne(
        { _id: req.userId, "episodeLog.month": { $ne: month } },
        { $push: { episodeLog: { month, count: 0 } } }
    );

    // Single atomic update: only decrement log count when it's already > 0.
    // The $inc on the array element only fires if the filter matches (count > 0),
    // eliminating the read-then-write TOCTOU race.
    const [updatedAnime] = await Promise.all([
        UserAnime.findByIdAndUpdate(_id, { $inc: { episodes: -1 } }, { new: true }),
        User.updateOne(
            { _id: req.userId, "episodeLog.month": month, "episodeLog.$.count": { $gt: 0 } },
            { $inc: { "episodeLog.$.count": -1 } }
        ),
    ]);

    res.json(updatedAnime);
};
