// Browser-side cache for Jikan API responses
// Uses localStorage for persistence + in-memory cache for speed
// Rate-limited queue to respect Jikan's 3 req/sec limit

const CACHE_KEY = "jikan_cache";
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── In-memory cache (instant access within session) ──
const memoryCache = {};

// ── localStorage helpers ──
const loadLocalCache = () => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        const now = Date.now();

        // Clean expired entries
        const cleaned = {};
        for (const [key, entry] of Object.entries(parsed)) {
            if (now - entry.timestamp < CACHE_EXPIRY_MS) {
                cleaned[key] = entry;
                memoryCache[key] = entry.data; // Warm up memory cache
            }
        }

        // Save cleaned version back
        if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(cleaned));
        }

        return cleaned;
    } catch {
        return {};
    }
};

const saveToLocalCache = (malId, data) => {
    try {
        const existing = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
        existing[malId] = { data, timestamp: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(existing));
    } catch {
        // localStorage full — clear old entries and retry
        try {
            localStorage.removeItem(CACHE_KEY);
            localStorage.setItem(CACHE_KEY, JSON.stringify({ [malId]: { data, timestamp: Date.now() } }));
        } catch {
            // Silent fail
        }
    }
};

// ── Rate-limited request queue ──
const queue = [];
let processing = false;
const DELAY_MS = 400; // ~2.5 req/sec (safely under 3/sec limit)

const processQueue = async () => {
    if (processing || queue.length === 0) return;
    processing = true;

    while (queue.length > 0) {
        const { malId, resolve } = queue.shift();

        // Double-check cache (might have been filled while waiting in queue)
        if (memoryCache[malId]) {
            resolve(memoryCache[malId]);
            continue;
        }

        try {
            const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
            if (res.status === 429) {
                // Rate limited — put it back and wait longer
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

            // Save to both caches
            memoryCache[malId] = data;
            saveToLocalCache(malId, data);

            resolve(data);
        } catch (error) {
            console.error("Jikan fetch error:", error);
            resolve(null);
        }

        // Wait between requests
        if (queue.length > 0) {
            await new Promise((r) => setTimeout(r, DELAY_MS));
        }
    }

    processing = false;
};

// ── Public API ──

// Initialize: load localStorage cache into memory on startup
loadLocalCache();

export const getAnimeDetails = (malId) => {
    if (!malId) return Promise.resolve(null);

    // 1. Check memory cache (instant)
    if (memoryCache[malId]) return Promise.resolve(memoryCache[malId]);

    // 2. Enqueue the request (rate-limited)
    return new Promise((resolve) => {
        queue.push({ malId, resolve });
        processQueue();
    });
};

export const getCachedDetails = (malId) => {
    return memoryCache[malId] || null;
};
