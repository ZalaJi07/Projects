import User from "../models/user.js";
import UserAnime from "../models/userAnime.js";

export const getPublicList = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (!user) return res.status(404).json({ message: "User not found." });

        const { page = 1, limit = 20, search = '', status = '', sort = 'createdAt', order = 'desc' } = req.query;

        const filter = { creator: user._id.toString() };
        if (search) filter.name = { $regex: search, $options: 'i' };
        if (status && status !== 'All') filter.status = status;

        const sortOrder = order === 'asc' ? 1 : -1;
        const sortConfig = { [sort]: sortOrder };

        const total = await UserAnime.countDocuments(filter);
        const animeRows = await UserAnime.find(filter)
            .sort(sortConfig)
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
