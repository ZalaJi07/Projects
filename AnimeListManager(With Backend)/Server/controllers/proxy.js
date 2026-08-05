// Uses native Node.js fetch (built-in since Node 18 — no extra package needed)

const MAL_BASE = 'https://api.myanimelist.net/v2';

// All MAL requests share these headers
const malHeaders = () => ({
    'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID,
});

// Common fields requested on every anime object
const BASE_FIELDS = 'id,title,alternative_titles,main_picture,mean,num_episodes,media_type,status,start_season,genres';
const DETAIL_FIELDS = `${BASE_FIELDS},synopsis,studios,rank,broadcast`;

// ── Search ──
// GET /proxy/search?q=naruto&tab=series
export const search = async (req, res) => {
    const { q, tab } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);

    try {
        const url = new URL(`${MAL_BASE}/anime`);
        url.searchParams.set('q', q.trim());
        url.searchParams.set('limit', '10');
        url.searchParams.set('fields', BASE_FIELDS);
        url.searchParams.set('nsfw', 'false');

        const response = await fetch(url.toString(), { headers: malHeaders() });
        if (!response.ok) return res.status(response.status).json({ error: 'MAL API error' });

        const json = await response.json();
        let results = (json.data || []).map(({ node: a }) => ({
            mal_id:        a.id,
            title:         a.title,
            title_english: a.alternative_titles?.en || a.title,
            image:         a.main_picture?.medium || null,
            type:          mediaTypeLabel(a.media_type),
            episodes:      a.num_episodes || null,
            score:         a.mean || null,
        }));

        // Movie tab shows only movies; series tab shows everything
        if (tab === 'movie') {
            results = results.filter(a => a.type === 'Movie');
        }

        res.json(results);
    } catch (err) {
        console.error('MAL search error:', err);
        res.status(500).json({ error: 'Failed to fetch from MAL' });
    }
};

// ── Single anime detail (used by detail modal and image fetch) ──
// GET /proxy/anime/:malId
export const getAnime = async (req, res) => {
    const { malId } = req.params;
    if (!malId) return res.status(400).json({ error: 'malId required' });

    try {
        const url = `${MAL_BASE}/anime/${malId}?fields=${DETAIL_FIELDS}`;
        const response = await fetch(url, { headers: malHeaders() });
        if (!response.ok) return res.status(response.status).json({ error: 'MAL API error' });

        const a = await response.json();
        res.json({
            mal_id:        a.id,
            title:         a.title,
            title_english: a.alternative_titles?.en || a.title,
            image_medium:  a.main_picture?.medium || null,
            image_large:   a.main_picture?.large  || null,
            score:         a.mean || null,
            rank:          a.rank || null,
            type:          mediaTypeLabel(a.media_type),
            episodes:      a.num_episodes || null,
            status:        statusLabel(a.status),
            year:          a.start_season?.year || null,
            synopsis:      a.synopsis || null,
            genres:        (a.genres || []).map(g => g.name),
            broadcast:     a.broadcast
                ? `${capitalise(a.broadcast.day_of_the_week)}s at ${a.broadcast.start_time} JST`
                : null,
        });
    } catch (err) {
        console.error('MAL detail error:', err);
        res.status(500).json({ error: 'Failed to fetch from MAL' });
    }
};

// ── Airing schedule — current season, grouped by weekday ──
// GET /proxy/schedule?day=0   (0=Sun, 1=Mon, ..., 6=Sat)
export const getSchedule = async (req, res) => {
    const dayIndex = parseInt(req.query.day, 10);
    if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
        return res.status(400).json({ error: 'day must be 0–6' });
    }

    const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const targetDay = DAY_NAMES[dayIndex];

    try {
        // Get current season
        const now = new Date();
        const year = now.getFullYear();
        const season = getSeason(now.getMonth());

        const url = new URL(`${MAL_BASE}/anime/season/${year}/${season}`);
        url.searchParams.set('limit', '500');
        url.searchParams.set('fields', `${BASE_FIELDS},broadcast`);
        url.searchParams.set('nsfw', 'false');

        const response = await fetch(url.toString(), { headers: malHeaders() });
        if (!response.ok) return res.status(response.status).json({ error: 'MAL API error' });

        const json = await response.json();
        const results = (json.data || [])
            .filter(({ node: a }) => a.broadcast?.day_of_the_week === targetDay)
            .map(({ node: a }) => ({
                mal_id:        a.id,
                title:         a.title,
                title_english: a.alternative_titles?.en || a.title,
                image:         a.main_picture?.medium || null,
                score:         a.mean || null,
                episodes:      a.num_episodes || null,
                genres:        (a.genres || []).map(g => g.name).slice(0, 3),
                broadcast:     a.broadcast?.start_time
                    ? `${capitalise(a.broadcast.day_of_the_week)}s at ${a.broadcast.start_time} JST`
                    : null,
            }));

        res.json(results);
    } catch (err) {
        console.error('MAL schedule error:', err);
        res.status(500).json({ error: 'Failed to fetch from MAL' });
    }
};

// ── Helpers ──

const getSeason = (month) => {
    if (month <= 2)  return 'winter';
    if (month <= 5)  return 'spring';
    if (month <= 8)  return 'summer';
    return 'fall';
};

const capitalise = (str) => str ? str[0].toUpperCase() + str.slice(1) : '';

const mediaTypeLabel = (type) => {
    const map = { tv: 'TV', ova: 'OVA', movie: 'Movie', special: 'Special',
                  ona: 'ONA', music: 'Music', tv_special: 'Special', unknown: 'Unknown' };
    return map[type] || type || 'Unknown';
};

const statusLabel = (status) => {
    const map = {
        finished_airing:    'Finished',
        currently_airing:   'Airing',
        not_yet_aired:      'Upcoming',
    };
    return map[status] || status || 'Unknown';
};
