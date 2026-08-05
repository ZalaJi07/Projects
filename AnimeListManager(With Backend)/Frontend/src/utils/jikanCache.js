// Browser-side cache for MAL API responses (via backend proxy)
//
// All external API calls go through /proxy/* on your own Express server.
// The browser never directly contacts MAL — no CORS issues.
//
// localStorage (mal_img_cache):
//   Permanent — no expiry. Anime cover images never change for a given MAL ID,
//   so once cached they are stored forever to avoid unnecessary API calls.
//
// memoryCache (in-process):
//   Full detail objects. Resets on page reload — only needed for detail modals.

const PROXY_BASE = import.meta.env.VITE_API_URL; // same base URL as your other API calls

const IMG_CACHE_KEY    = 'mal_img_cache';    // no expiry — images are permanent
const GENRE_CACHE_KEY  = 'mal_genre_cache';
const GENRE_EXPIRY_MS  = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_DETAIL_KEY = 'mal_session_details';
const SCHEDULE_CACHE_KEY = 'mal_schedule_v1';
const SCHEDULE_EXPIRY_MS = 6 * 60 * 60 * 1000;     // 6 hours

const FAILED_CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const memoryCache = {};  // { [malId]: detail object }
const imageCache  = {};  // { [malId]: imageUrl string }
const failedCache = {};  // { [malId]: timestamp }

// ── Failure tracking ──

const isFailedRecently = (malId) => {
    const ts = failedCache[malId];
    if (!ts) return false;
    if (Date.now() - ts < FAILED_CACHE_EXPIRY_MS) return true;
    delete failedCache[malId];
    return false;
};

const markAsFailed = (malId) => { failedCache[malId] = Date.now(); };

// ── localStorage helpers ──

const loadLocalCache = () => {
    try {
        // Clean up old Jikan/AniList cache keys
        ['jikan_cache', 'jikan_img_cache', 'jikan_genre_cache', 'jikan_session_details',
         'jikan_schedual_cache', 'jikan_schedule_v2', 'jikan_schedual-v2',
         'al_img_cache', 'al_genre_cache', 'al_session_details', 'al_schedule_v1',
        ].forEach(k => { try { localStorage.removeItem(k); } catch {} });
    } catch {}

    try {
        // Load image cache — no expiry check, images are permanent
        const raw = localStorage.getItem(IMG_CACHE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        for (const [key, entry] of Object.entries(parsed)) {
            imageCache[key] = entry.url;
        }
    } catch {}
};

const loadSessionCache = () => {
    try {
        const raw = sessionStorage.getItem(SESSION_DETAIL_KEY);
        if (!raw) return;
        Object.assign(memoryCache, JSON.parse(raw));
    } catch {}
};

const saveToSessionCache = (malId, data) => {
    try {
        const existing = JSON.parse(sessionStorage.getItem(SESSION_DETAIL_KEY) || '{}');
        existing[malId] = data;
        sessionStorage.setItem(SESSION_DETAIL_KEY, JSON.stringify(existing));
    } catch {
        try {
            sessionStorage.removeItem(SESSION_DETAIL_KEY);
            sessionStorage.setItem(SESSION_DETAIL_KEY, JSON.stringify({ [malId]: data }));
        } catch {}
    }
};

const saveImageForever = (malId, url) => {
    if (!url) return;
    try {
        const existing = JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || '{}');
        existing[malId] = { url }; // no timestamp — stored forever
        localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(existing));
    } catch {
        try {
            localStorage.removeItem(IMG_CACHE_KEY);
            localStorage.setItem(IMG_CACHE_KEY, JSON.stringify({ [malId]: { url } }));
        } catch {}
    }
};

const persistGenres = (malId, genres) => {
    if (!genres?.length) return;
    try {
        const cache = JSON.parse(localStorage.getItem(GENRE_CACHE_KEY) || '{}');
        cache[String(malId)] = { genres, ts: Date.now() };
        localStorage.setItem(GENRE_CACHE_KEY, JSON.stringify(cache));
    } catch {
        try {
            localStorage.removeItem(GENRE_CACHE_KEY);
            localStorage.setItem(GENRE_CACHE_KEY, JSON.stringify({
                [String(malId)]: { genres, ts: Date.now() }
            }));
        } catch {}
    }
};

// ── Rate-limited detail fetch queue ──

const queue = [];
let processing = false;
const DELAY_MS = 700; // safe gap between requests

const processQueue = async () => {
    if (processing || queue.length === 0) return;
    processing = true;

    while (queue.length > 0) {
        const { malId, resolve } = queue.shift();

        if (memoryCache[malId]) { resolve(memoryCache[malId]); continue; }
        if (isFailedRecently(malId)) { resolve(null); continue; }

        try {
            const res = await fetch(`${PROXY_BASE}/proxy/anime/${malId}`);
            if (!res.ok) {
                markAsFailed(malId);
                resolve(null);
                await new Promise(r => setTimeout(r, DELAY_MS));
                continue;
            }

            const data = await res.json();
            memoryCache[malId] = data;
            saveToSessionCache(malId, data);
            persistGenres(malId, data.genres);

            const imgUrl = data.image_medium || data.image_large || null;
            if (imgUrl) {
                imageCache[malId] = imgUrl;
                saveImageForever(malId, imgUrl); // permanent storage
            }

            resolve(data);
        } catch (err) {
            console.error('MAL proxy fetch error:', err);
            markAsFailed(malId);
            resolve(null);
        }

        if (queue.length > 0) await new Promise(r => setTimeout(r, DELAY_MS));
    }

    processing = false;
};

// Initialize caches from storage on module load
loadLocalCache();
loadSessionCache();

// ── Public API ──

// Returns cached genre strings for a malId, or null if not cached.
export const getCachedGenres = (malId) => {
    try {
        const cache = JSON.parse(localStorage.getItem(GENRE_CACHE_KEY) || '{}');
        const entry = cache[String(malId)];
        if (entry && Date.now() - entry.ts < GENRE_EXPIRY_MS) return entry.genres;
    } catch {}
    return null;
};

// Returns full detail object for a malId (used by AnimeDetailModal).
export const getAnimeDetails = (malId) => {
    if (!malId) return Promise.resolve(null);
    if (memoryCache[malId]) return Promise.resolve(memoryCache[malId]);
    if (isFailedRecently(malId)) return Promise.resolve(null);

    // Deduplicate: chain onto an existing pending request if already queued
    const existing = queue.find(item => item.malId === malId);
    if (existing) {
        const prev = existing.resolve;
        return new Promise(resolve => {
            existing.resolve = (data) => { prev(data); resolve(data); };
        });
    }

    return new Promise(resolve => {
        queue.push({ malId, resolve });
        processQueue();
    });
};

// Returns cover image URL — resolves instantly from cache when available.
export const getImageUrl = (malId) => {
    if (!malId) return Promise.resolve(null);
    if (memoryCache[malId]) return Promise.resolve(
        memoryCache[malId]?.image_medium ?? memoryCache[malId]?.image_large ?? null
    );
    if (imageCache[malId]) return Promise.resolve(imageCache[malId]);
    if (isFailedRecently(malId)) return Promise.resolve(null);
    return getAnimeDetails(malId).then(
        data => data?.image_medium ?? data?.image_large ?? null
    );
};

// Synchronous — returns details only if already in memory.
export const getCachedDetails = (malId) => memoryCache[malId] || null;

// ── Anime Search ──

// Searches for anime by name. Returns array shaped to match what AnimeForm expects.
export const searchAnime = async (term, tab = 'series') => {
    if (!term || term.length < 2) return [];
    try {
        const res = await fetch(
            `${PROXY_BASE}/proxy/search?q=${encodeURIComponent(term.trim())}&tab=${tab}`
        );
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('MAL search error:', err);
        return [];
    }
};

// ── Airing Schedule ──

// Returns one day's airing schedule with localStorage caching.
// dayIndex: 0=Sunday, 1=Monday, ..., 6=Saturday (matches JS getDay())
export const getSchedule = async (dayIndex) => {
    const cacheKey = `day_${dayIndex}`;

    try {
        const raw = localStorage.getItem(SCHEDULE_CACHE_KEY);
        if (raw) {
            const cache = JSON.parse(raw);
            const cached = cache[cacheKey];
            if (cached && Date.now() - cached.timestamp < SCHEDULE_EXPIRY_MS) {
                return cached.data;
            }
        }
    } catch {}

    try {
        const res = await fetch(`${PROXY_BASE}/proxy/schedule?day=${dayIndex}`);
        if (!res.ok) return [];

        const results = await res.json();

        // Persist to localStorage
        try {
            const raw = localStorage.getItem(SCHEDULE_CACHE_KEY);
            const cache = raw ? JSON.parse(raw) : {};
            cache[cacheKey] = { data: results, timestamp: Date.now() };
            localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(cache));
        } catch {}

        // Warm up image cache
        results.forEach(a => {
            if (a.mal_id && a.image && !imageCache[a.mal_id]) {
                imageCache[a.mal_id] = a.image;
                saveImageForever(a.mal_id, a.image);
            }
        });

        return results;
    } catch (err) {
        console.error('MAL schedule error:', err);
        return [];
    }
};
