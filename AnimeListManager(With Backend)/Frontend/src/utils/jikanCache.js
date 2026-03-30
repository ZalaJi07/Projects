// Browser-side cache for Jikan API responses
const cache = {};

export const getAnimeDetails = async (malId) => {
    if (!malId) return null;
    if (cache[malId]) return cache[malId];

    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
        if (!res.ok) return null;
        const json = await res.json();
        cache[malId] = json.data;
        return json.data;
    } catch (error) {
        console.error("Jikan fetch error:", error);
        return null;
    }
};

export const getCachedDetails = (malId) => {
    return cache[malId] || null;
};
