// Browser-side cache for Jikan API responses
//
// localStorage (jikan_img_cache):
//   Compact, persistent. Stores only { smallUrl, timestamp } per mal_id.
//   ~60 bytes per entry vs ~3 KB for the old full-object approach.
//   Survives page reloads so table images appear instantly.
//
// memoryCache (in-process):
//   Full Jikan detail objects. Fast, no storage limit concerns.
//   Resets on page reload — acceptable since full details are only needed
//   when the user opens a modal (rare relative to table renders).

const IMG_CACHE_KEY = "jikan_img_cache";
const CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Full detail objects — in-memory only
const memoryCache = {};

// Small image URLs — populated from localStorage on startup
const imageCache = {};

// ── localStorage helpers ──

const loadLocalCache = () => {
    try {
        // Migrate: remove old bloated cache key if it still exists
        localStorage.removeItem("jikan_cache");
    } catch { }

    try {
        const raw = localStorage.getItem(IMG_CACHE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const now = Date.now();
        const cleaned = {};

        for (const [key, entry] of Object.entries(parsed)) {
            if (now - entry.timestamp < CACHE_EXPIRY_MS) {
                cleaned[key] = entry;
                imageCache[key] = entry.smallUrl; // warm up in-memory image cache
            }
        }

        // Write back cleaned version (expired entries removed)
        if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
            localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(cleaned));
        }
    } catch { }
};

const saveImageToLocalCache = (malId, data) => {
    const smallUrl = data?.images?.jpg?.small_image_url;
    if (!smallUrl) return;
    try {
        const existing = JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || "{}");
        existing[malId] = { smallUrl, timestamp: Date.now() };
        localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(existing));
    } catch {
        // localStorage full — clear and retry with just this entry
        try {
            localStorage.removeItem(IMG_CACHE_KEY);
            localStorage.setItem(IMG_CACHE_KEY, JSON.stringify({ [malId]: { smallUrl, timestamp: Date.now() } }));
        } catch { }
    }
};

// ── Rate-limited request queue ──

const queue = [];
let processing = false;
const DELAY_MS = 400; // ~2.5 req/sec — stays within Jikan's 3 req/sec limit

const processQueue = async () => {
    if (processing || queue.length === 0) return;
    processing = true;

    while (queue.length > 0) {
        const { malId, resolve } = queue.shift();

        // Double-check: might have been filled while waiting in queue
        if (memoryCache[malId]) {
            resolve(memoryCache[malId]);
            continue;
        }

        try {
            const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
            if (res.status === 429) {
                // Rate limited — put back and wait longer
                queue.unshift({ malId, resolve });
                await new Promise((r) => setTimeout(r, 2000));
                continue;
            }
            if (!res.ok) {
                resolve(null);
                await new Promise((r) => setTimeout(r, DELAY_MS));
                continue;
            }

            const json = await res.json();
            const data = json.data;

            // Full details → memory only (no localStorage bloat)
            memoryCache[malId] = data;

            // Image URL → compact localStorage (persistent, tiny footprint)
            const smallUrl = data?.images?.jpg?.small_image_url;
            if (smallUrl) imageCache[malId] = smallUrl;
            saveImageToLocalCache(malId, data);

            resolve(data);
        } catch (error) {
            console.error("Jikan fetch error:", error);
            resolve(null);
        }

        if (queue.length > 0) {
            await new Promise((r) => setTimeout(r, DELAY_MS));
        }
    }

    processing = false;
};

// Initialize: warm up imageCache from localStorage
loadLocalCache();

// ── Public API ──

// Returns the full Jikan detail object (score, synopsis, genres, images, etc.)
// Used by AnimeDetailModal.
export const getAnimeDetails = (malId) => {
    if (!malId) return Promise.resolve(null);
    if (memoryCache[malId]) return Promise.resolve(memoryCache[malId]);
    return new Promise((resolve) => {
        queue.push({ malId, resolve });
        processQueue();
    });
};

// Returns just the small cover image URL string.
// Used by AnimeImage (hot path — one call per table row).
// Resolves instantly from imageCache (localStorage) when available,
// otherwise queues a Jikan fetch and extracts the URL from the response.
export const getImageUrl = (malId) => {
    if (!malId) return Promise.resolve(null);
    // Full details already in memory → extract URL, no extra work
    if (memoryCache[malId]) return Promise.resolve(memoryCache[malId]?.images?.jpg?.small_image_url ?? null);
    // Compact image cache (from localStorage) → instant return
    if (imageCache[malId]) return Promise.resolve(imageCache[malId]);
    // Neither cache has it — queue a fetch, resolve with just the URL
    return new Promise((resolve) => {
        queue.push({ malId, resolve: (data) => resolve(data?.images?.jpg?.small_image_url ?? null) });
        processQueue();
    });
};

// Synchronous check — returns full details only if already in memory.
export const getCachedDetails = (malId) => memoryCache[malId] || null;
