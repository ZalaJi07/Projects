import User from "../models/user.js";
import UserAnime from "../models/userAnime.js";
import mongoose from "mongoose";

// Resolve a URL param that is either a MongoDB ObjectId (new links) or a username (legacy links).
// New share links use the user's _id so they survive username changes.
const resolveUser = async (param) => {
    if (mongoose.Types.ObjectId.isValid(param)) {
        return User.findById(param);
    }
    return User.findOne({ username: { $regex: new RegExp(`^${param}$`, 'i') } });
};

export const getPublicList = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await resolveUser(username);
        if (!user) return res.status(404).json({ message: "User not found." });


        const { page = 1, limit = 20, search = '', status = '', sort = 'createdAt', order = 'desc', entryType = 'series' } = req.query;

        const filter = { creator: user._id.toString() };
        if (entryType === 'series') {
            filter.$or = [{ entryType: 'series' }, { entryType: { $exists: false } }];
        } else {
            filter.entryType = entryType;
        }
        if (search) filter.name = { $regex: search, $options: 'i' };
        if (status && status !== 'All') filter.status = status;

        // Allowlist sort field (mirrors the authenticated getAnime endpoint)
        const ALLOWED_SORT = ['createdAt', 'name', 'status', 'episodes', 'rating'];
        const safeSort = ALLOWED_SORT.includes(sort) ? sort : 'createdAt';
        const sortOrder = order === 'asc' ? 1 : -1;

        const total = await UserAnime.countDocuments(filter);
        const animeRows = await UserAnime.find(filter)
            .sort({ [safeSort]: sortOrder })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.status(200).json({
            username: user.username,
            data: animeRows,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPublicStats = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await resolveUser(username);
        if (!user) return res.status(404).json({ message: "User not found." });

        const creatorId = user._id.toString();

        // Single aggregation pipeline — no JS-side filtering/reducing
        const [result] = await UserAnime.aggregate([
            { $match: { creator: creatorId } },
            {
                $facet: {
                    // Series stats
                    series: [
                        { $match: { $or: [{ entryType: 'series' }, { entryType: { $exists: false } }] } },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                totalEpisodes: { $sum: { $ifNull: ['$episodes', 0] } },
                                statusCounts: { $push: '$status' },
                            },
                        },
                    ],
                    // Movie count
                    movies: [
                        { $match: { entryType: 'movie' } },
                        { $count: 'total' },
                    ],
                    // Rating stats (across all entries)
                    ratings: [
                        { $match: { rating: { $ne: null } } },
                        {
                            $group: {
                                _id: null,
                                avg: { $avg: '$rating' },
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    // Top 5 rated
                    topRated: [
                        { $match: { rating: { $ne: null } } },
                        { $sort: { rating: -1 } },
                        { $limit: 5 },
                        { $project: { name: 1, rating: 1, entryType: 1, malId: 1 } },
                    ],
                },
            },
        ]);

        // Tally statusCounts from the pushed array
        const statusArr = result?.series?.[0]?.statusCounts || [];
        const statusCounts = statusArr.reduce((acc, s) => {
            if (s) acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        const avgRaw = result?.ratings?.[0]?.avg;
        const avgRating = avgRaw != null ? Math.round(avgRaw * 10) / 10 : null;

        res.json({
            username: user.username,
            totalSeries: result?.series?.[0]?.total || 0,
            totalMovies: result?.movies?.[0]?.total || 0,
            totalEpisodes: result?.series?.[0]?.totalEpisodes || 0,
            avgRating,
            statusCounts,
            topRated: result?.topRated || [],
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
