// Browser-side cache for AniList API responses
//
// AniList GraphQL API — no key required, 90 req/min limit
// Endpoint: POST https://graphql.anilist.co
//
// localStorage (al_img_cache):
//   Compact, persistent. Stores only { url, timestamp } per malId.
//   Survives page reloads so table images appear instantly.
//
// memoryCache (in-process):
//   Full AniList detail objects. Fast, no storage limit concerns.
//   Resets on page reload — only needed for detail modals.

const ANILIST_URL = 'https://graphql.anilist.co';

const IMG_CACHE_KEY = 'al_img_cache';
const IMG_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const GENRE_CACHE_KEY = 'al_genre_cache';
const GENRE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const SESSION_DETAIL_KEY = 'al_session_details';

const SCHEDULE_CACHE_KEY = 'al_schedule_v1';
const SCHEDULE_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours

const FAILED_CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const memoryCache = {};   // { [malId]: AniList media object }
const imageCache  = {};   // { [malId]: imageUrl string }
const failedCache = {};   // { [malId]: timestamp }

// ── GraphQL query helpers ──

const gql = (query, variables = {}) =>
    fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
    }).then(r => r.json());

// ── Failure tracking ──

const isFailedRecently = (malId) => {
    const ts = failedCache[malId];
    if (!ts) return false;
    if (Date.now() - ts < FAILED_CACHE_EXPIRY_MS) return true;
    delete failedCache[malId];
    return false;
};

const markAsFailed = (malId) => { failedCache[malId] = Date.now(); };

// ── localStorage / sessionStorage helpers ──

const loadLocalCache = () => {
    try {
        // Remove old Jikan cache keys so they don't waste storage
        ['jikan_cache', 'jikan_img_cache', 'jikan_genre_cache',
         'jikan_session_details', 'jikan_schedual_cache', 'jikan_schedule_v2',
         'jikan_schedual-v2'].forEach(k => { try { localStorage.removeItem(k); } catch {} });
    } catch {}

    try {
        const raw = localStorage.getItem(IMG_CACHE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const now = Date.now();
        const cleaned = {};
        for (const [key, entry] of Object.entries(parsed)) {
            if (now - entry.timestamp < IMG_EXPIRY_MS) {
                cleaned[key] = entry;
                imageCache[key] = entry.url;
            }
        }
        if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
            localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(cleaned));
        }
    } catch {}
};

const stripHtml = (str) => {
    if (!str) return str;
    return str.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
};

const loadSessionCache = () => {
    try {
        const raw = sessionStorage.getItem(SESSION_DETAIL_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        // Strip HTML from synopsis in case it was cached before the fix
        for (const entry of Object.values(parsed)) {
            if (entry?.synopsis) entry.synopsis = stripHtml(entry.synopsis);
        }
        Object.assign(memoryCache, parsed);
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

const saveImageToLocalCache = (malId, url) => {
    if (!url) return;
    try {
        const existing = JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || '{}');
        existing[malId] = { url, timestamp: Date.now() };
        localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(existing));
    } catch {
        try {
            localStorage.removeItem(IMG_CACHE_KEY);
            localStorage.setItem(IMG_CACHE_KEY, JSON.stringify({ [malId]: { url, timestamp: Date.now() } }));
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
const DELAY_MS = 700; // ~1.4 req/sec — well within AniList's 90 req/min

// GraphQL query for a single anime detail by MAL ID
const DETAIL_QUERY = `
query ($malId: Int) {
    Media(idMal: $malId, type: ANIME) {
        idMal
        title { romaji english }
        coverImage { large medium }
        meanScore
        episodes
        format
        status
        genres
        synopsis: description(asHtml: false)
        studios(isMain: true) { nodes { name } }
        season
        seasonYear
        airingSchedule(notYetAired: false) { nodes { episode airingAt } }
    }
}`;

const processQueue = async () => {
    if (processing || queue.length === 0) return;
    processing = true;

    while (queue.length > 0) {
        const { malId, resolve } = queue.shift();

        if (memoryCache[malId]) { resolve(memoryCache[malId]); continue; }
        if (isFailedRecently(malId)) { resolve(null); continue; }

        try {
            const json = await gql(DETAIL_QUERY, { malId: Number(malId) });

            if (json.errors || !json.data?.Media) {
                markAsFailed(malId);
                resolve(null);
                await new Promise(r => setTimeout(r, DELAY_MS));
                continue;
            }

            const media = json.data.Media;
            // Strip HTML tags from synopsis — AniList returns <br> even with asHtml: false
            if (media.synopsis) media.synopsis = stripHtml(media.synopsis);
            memoryCache[malId] = media;
            saveToSessionCache(malId, media);
            persistGenres(malId, media.genres);

            const imgUrl = media.coverImage?.medium || media.coverImage?.large || null;
            if (imgUrl) imageCache[malId] = imgUrl;
            saveImageToLocalCache(malId, imgUrl);

            resolve(media);
        } catch (err) {
            console.error('AniList fetch error:', err);
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

// Returns full AniList media object for a malId (detail modal, stats genres).
export const getAnimeDetails = (malId) => {
    if (!malId) return Promise.resolve(null);
    if (memoryCache[malId]) return Promise.resolve(memoryCache[malId]);
    if (isFailedRecently(malId)) return Promise.resolve(null);

    // Deduplicate: chain onto existing pending request if queued
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
        memoryCache[malId]?.coverImage?.medium ?? memoryCache[malId]?.coverImage?.large ?? null
    );
    if (imageCache[malId]) return Promise.resolve(imageCache[malId]);
    if (isFailedRecently(malId)) return Promise.resolve(null);
    return getAnimeDetails(malId).then(
        data => data?.coverImage?.medium ?? data?.coverImage?.large ?? null
    );
};

// Synchronous — returns details only if already in memory.
export const getCachedDetails = (malId) => memoryCache[malId] || null;

// ── Anime Search ──

const SEARCH_QUERY = `
query ($search: String, $format: [MediaFormat], $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
        media(search: $search, type: ANIME, format_in: $format, isAdult: false, sort: SEARCH_MATCH) {
            idMal
            id
            title { romaji english }
            coverImage { medium }
            format
            episodes
            meanScore
        }
    }
}`;

// Searches AniList for anime by name, filtered by series or movie tab.
// Returns array of result objects shaped to match what AnimeForm expects.
export const searchAnime = async (term, tab = 'series') => {
    if (!term || term.length < 2) return [];

    // Map app tab to AniList format enum values
    const format = tab === 'movie'
        ? ['MOVIE']
        : ['TV', 'TV_SHORT', 'ONA', 'OVA', 'SPECIAL'];

    try {
        const json = await gql(SEARCH_QUERY, {
            search: term.trim(),
            format,
            perPage: 10,
        });

        if (json.errors || !json.data?.Page?.media) return [];

        return json.data.Page.media
            .filter(m => m.idMal) // skip entries with no MAL ID
            .map(m => ({
                mal_id:       m.idMal,
                title:        m.title.romaji,
                title_english: m.title.english || m.title.romaji,
                images: { jpg: { image_url: m.coverImage?.medium || '' } },
                type:   formatLabel(m.format),
                episodes: m.episodes || null,
                score:  m.meanScore ? (m.meanScore / 10).toFixed(1) : null,
            }));
    } catch (err) {
        console.error('AniList search error:', err);
        return [];
    }
};

// Maps AniList format enum to a human-readable label
const formatLabel = (fmt) => {
    const map = { TV: 'TV', TV_SHORT: 'TV', ONA: 'ONA', OVA: 'OVA',
                  SPECIAL: 'Special', MOVIE: 'Movie', MUSIC: 'Music' };
    return map[fmt] || fmt || 'Unknown';
};

// ── Airing Calendar ──

const SCHEDULE_QUERY = `
query ($start: Int, $end: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
        pageInfo { hasNextPage }
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
            media {
                idMal
                id
                title { romaji english }
                coverImage { medium }
                meanScore
                episodes
                genres
                nextAiringEpisode { airingAt episode }
            }
        }
    }
}`;

// Returns start/end Unix timestamps (seconds) for a given weekday index (0=Sun)
// relative to the current week in JST (UTC+9).
const dayTimestamps = (dayIndex) => {
    const now = new Date();
    // Shift to JST
    const jstOffset = 9 * 60;
    const localOffset = now.getTimezoneOffset();
    const jstNow = new Date(now.getTime() + (jstOffset + localOffset) * 60 * 1000);

    // Find the Monday of this week in JST, then offset to target day
    const currentDay = jstNow.getDay(); // 0=Sun
    const diffToSunday = -currentDay;
    const targetDate = new Date(jstNow);
    targetDate.setDate(jstNow.getDate() + diffToSunday + dayIndex);
    targetDate.setHours(0, 0, 0, 0);

    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // Convert back to UTC seconds for AniList
    const toUtcSeconds = (d) =>
        Math.floor((d.getTime() - (jstOffset + localOffset) * 60 * 1000) / 1000);

    return { start: toUtcSeconds(targetDate), end: toUtcSeconds(endDate) };
};

// Fetches one day's airing schedule from AniList with localStorage caching.
// dayIndex: 0=Sunday, 1=Monday, ..., 6=Saturday (matches JS getDay())
export const getSchedule = async (dayIndex) => {
    const cacheKey = `day_${dayIndex}`;

    // Check localStorage cache first
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

    const { start, end } = dayTimestamps(dayIndex);
    const seen = new Set();
    const results = [];

    try {
        // Paginate through all results for the day (AniList max 50 per page)
        for (let page = 1; page <= 3; page++) {
            const json = await gql(SCHEDULE_QUERY, { start, end, page });
            if (json.errors) break;

            const schedules = json.data?.Page?.airingSchedules || [];
            for (const { media } of schedules) {
                if (!media || !media.idMal || seen.has(media.idMal)) continue;
                seen.add(media.idMal);
                results.push({
                    mal_id:        media.idMal,
                    title:         media.title.romaji,
                    title_english: media.title.english || media.title.romaji,
                    image:         media.coverImage?.medium || null,
                    score:         media.meanScore ? (media.meanScore / 10).toFixed(1) : null,
                    episodes:      media.episodes || null,
                    genres:        (media.genres || []).slice(0, 3),
                    broadcast:     media.nextAiringEpisode
                        ? `Ep ${media.nextAiringEpisode.episode}`
                        : null,
                });
            }

            if (!json.data?.Page?.pageInfo?.hasNextPage) break;
            // Small delay between pagination requests
            await new Promise(r => setTimeout(r, 300));
        }

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
            }
        });

        return results;
    } catch (err) {
        console.error('AniList schedule error:', err);
        return [];
    }
};
