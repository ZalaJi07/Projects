import User from "../models/user.js";
import UserAnime from "../models/userAnime.js";

// GET /admin/users?page=1&limit=20&search=
export const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const filter = {};
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            User.countDocuments(filter),
        ]);

        // Attach anime count for each user in a single aggregation
        const userIds = users.map((u) => String(u._id));
        const animeCounts = await UserAnime.aggregate([
            { $match: { creator: { $in: userIds } } },
            { $group: { _id: '$creator', count: { $sum: 1 } } },
        ]);
        const countMap = Object.fromEntries(animeCounts.map((a) => [a._id, a.count]));

        const result = users.map((u) => ({
            ...u,
            animeCount: countMap[String(u._id)] ?? 0,
        }));

        res.status(200).json({
            data: result,
            currentPage: pageNum,
            totalPages: Math.max(1, Math.ceil(total / limitNum)),
            totalItems: total,
        });
    } catch (error) {
        console.error("Admin getUsers error:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
};

// PATCH /admin/users/:id/disable — toggle disabled state
export const disableUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('isDisabled isAdmin username');
        if (!user) return res.status(404).json({ message: "User not found." });

        // Prevent disabling an admin account
        if (user.isAdmin) return res.status(400).json({ message: "Cannot disable an admin account." });

        user.isDisabled = !user.isDisabled;
        await user.save();

        res.status(200).json({
            message: user.isDisabled
                ? `${user.username} has been disabled.`
                : `${user.username} has been re-enabled.`,
            isDisabled: user.isDisabled,
        });
    } catch (error) {
        console.error("Admin disableUser error:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
};

// DELETE /admin/users/:id — permanently delete user + all their anime entries
export const removeUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('isAdmin username');
        if (!user) return res.status(404).json({ message: "User not found." });

        // Prevent deleting an admin account
        if (user.isAdmin) return res.status(400).json({ message: "Cannot remove an admin account." });

        // Cascade: delete all anime entries belonging to this user, then delete the user
        await Promise.all([
            UserAnime.deleteMany({ creator: String(id) }),
            User.findByIdAndDelete(id),
        ]);

        res.status(200).json({ message: `${user.username}'s account and all their data have been permanently removed.` });
    } catch (error) {
        console.error("Admin removeUser error:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
};
