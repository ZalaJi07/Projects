import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as api from '../api/index.js';
import { getAnimeDetails, getCachedDetails } from '../utils/jikanCache.js';

// ── Status colour palette ────────────────────────────────────────────────────
const STATUS_CFG = {
  Finished: { color: '#22c55e', label: 'Finished' },
  CaughtUp: { color: '#a855f7', label: 'Caught Up' },
  Watching: { color: '#3b82f6', label: 'Watching' },
  OnHold: { color: '#eab308', label: 'On Hold' },
  Pending: { color: '#94a3b8', label: 'Pending' },
  Dropped: { color: '#ef4444', label: 'Dropped' },
};

// ── SVG Donut chart ──────────────────────────────────────────────────────────
const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const donutPath = (cx, cy, outerR, innerR, start, end) => {
  const s = polar(cx, cy, outerR, start);
  const e = polar(cx, cy, outerR, end);
  const si = polar(cx, cy, innerR, end);
  const ei = polar(cx, cy, innerR, start);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${e.x} ${e.y}`,
    `L ${si.x} ${si.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ei.x} ${ei.y}`,
    'Z',
  ].join(' ');
};

const DonutChart = ({ statusCounts, total }) => {
  const SIZE = 148; const cx = 74; const cy = 74;
  const outerR = 60; const innerR = 38;

  if (!total) return (
    <div className="w-[148px] h-[148px] rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
      <span className="text-xs text-gray-300">No data</span>
    </div>
  );

  let angle = 0;
  const segments = Object.entries(STATUS_CFG)
    .map(([key, { color }]) => {
      const count = statusCounts[key] || 0;
      const sweep = (count / total) * 360;
      const start = angle;
      angle += sweep;
      return { key, color, count, sweep, start, end: angle };
    })
    .filter(s => s.sweep > 0.5);

  return (
    <svg width={SIZE} height={SIZE} className="flex-shrink-0 drop-shadow-sm">
      {segments.map(s => (
        <path
          key={s.key}
          d={donutPath(cx, cy, outerR, innerR, s.start, s.sweep >= 359.5 ? s.end - 0.1 : s.end)}
          fill={s.color}
          className="transition-all duration-500"
        />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="700" fill="#1f2937">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fill="#9ca3af">series</text>
    </svg>
  );
};

// ── Episode bar chart (CSS) ──────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-36 pt-4">
      {data.map(({ month, label, count }) => (
        <div key={month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          {count > 0 && <span className="text-[10px] text-gray-400 font-medium">{count}</span>}
          <div
            className="w-full rounded-t-lg transition-all duration-700"
            style={{
              height: `${Math.max((count / max) * 100, count > 0 ? 6 : 2)}%`,
              background: count > 0
                ? 'linear-gradient(to top, var(--primary), var(--primary-light))'
                : '#e5e7eb',
            }}
          />
          <span className="text-[10px] text-gray-400">{label}</span>
        </div>
      ))}
    </div>
  );
};

// ── Metric card ──────────────────────────────────────────────────────────────
const MetricCard = ({ icon, label, value, sub, gradient }) => (
  <div className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${gradient}`}>
      <span className="material-symbols-outlined text-white text-xl">{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Loading skeleton ─────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />
);

// ── Main component ───────────────────────────────────────────────────────────
const Stats = () => {
  const navigate = useNavigate();
  const profile = JSON.parse(localStorage.getItem('profile') || 'null')?.result;
  const username = profile?.username;
  const userId = profile?._id;

  const [entries, setEntries] = useState([]);
  const [userLog, setUserLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState({});
  const [genreProgress, setGenreProgress] = useState({ loaded: 0, total: 0 });

  // ── Fetch entries + user episodeLog in parallel ──────────────────────────
  useEffect(() => {
    Promise.all([
      api.fetchAllAnimes(),
      api.fetchUserStats(),
    ])
      .then(([animesRes, statsRes]) => {
        setEntries(animesRes.data.data || []);
        setUserLog(statsRes.data.episodeLog || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  // ── Computed stats (pure, derived from entries) ──────────────────────────
  const stats = useMemo(() => {
    if (!entries.length) return null;

    const series = entries.filter(e => e.entryType !== 'movie');
    const movies = entries.filter(e => e.entryType === 'movie');
    const totalEps = series.reduce((s, e) => s + (e.episodes || 0), 0);
    const watchTimeMins = totalEps * 23 + movies.length * 90;
    const watchTimeHours = Math.round(watchTimeMins / 60);

    const ratedEntries = entries.filter(e => e.rating != null);
    const avgRating = ratedEntries.length > 0
      ? (ratedEntries.reduce((s, e) => s + e.rating, 0) / ratedEntries.length).toFixed(1)
      : null;

    // This month's episode count — read directly from userLog
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisMonthEps = Math.max(0, userLog.find(l => l.month === thisMonth)?.count || 0);

    // Status breakdown (series only)
    const statusCounts = Object.fromEntries(Object.keys(STATUS_CFG).map(k => [k, 0]));
    series.forEach(e => { if (statusCounts[e.status] !== undefined) statusCounts[e.status]++; });
    const completed = (statusCounts.Finished || 0) + (statusCounts.CaughtUp || 0);
    const completionRate = series.length > 0 ? Math.round((completed / series.length) * 100) : 0;

    // Build last 6 months from the server-side log — NOT computed from entries
    // (entries don't track when each episode was watched, only the running total)
    const monthlyEps = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const month = d.toISOString().slice(0, 7);
      const count = Math.max(0, userLog.find(l => l.month === month)?.count || 0);
      return { month, label: d.toLocaleString('en', { month: 'short' }), count };
    });

    const hasLogData = monthlyEps.some(m => m.count > 0);

    // Top rated
    const topRated = [...entries]
      .filter(e => e.rating != null)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    // Currently watching
    const watching = series.filter(e => e.status === 'Watching');

    // Longest by episodes watched
    const longest = series.reduce((max, e) =>
      (e.episodes || 0) > (max?.episodes || 0) ? e : max, null);

    // Latest addition
    const latest = [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    const daysAgo = (date) => {
      const days = Math.floor((Date.now() - new Date(date)) / 86400000);
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      return `${days} days ago`;
    };

    return {
      series, movies, totalEps, watchTimeHours, avgRating,
      thisMonthEps, statusCounts, completionRate, monthlyEps,
      hasLogData, topRated, watching, longest, latest, daysAgo,
    };
  }, [entries, userLog]);


  // ── Genre background queue ───────────────────────────────────────────────
  // Uses jikanCache's built-in rate-limited queue (400 ms between uncached requests).
  // Cached items resolve instantly; uncached ones trickle in progressively.
  useEffect(() => {
    if (!entries.length) return;

    const malIds = [...new Set(entries.filter(e => e.malId).map(e => e.malId))];
    if (!malIds.length) return;

    setGenreProgress({ loaded: 0, total: malIds.length });

    // Seed with whatever is already in memory (instant, no network)
    const seed = {};
    malIds.forEach(id => {
      const cached = getCachedDetails(id);
      if (cached?.genres) cached.genres.forEach(g => { seed[g.name] = (seed[g.name] || 0) + 1; });
    });
    if (Object.keys(seed).length) setGenres(seed);

    let cancelled = false;
    let loaded = 0;

    // Async IIFE so we can use await inside useEffect
    (async () => {
      for (const malId of malIds) {
        if (cancelled) break; // cleanup on unmount
        const details = await getAnimeDetails(malId); // rate limiting handled by jikanCache queue
        if (details?.genres) {
          setGenres(prev => {
            const next = { ...prev };
            details.genres.forEach(g => { next[g.name] = (next[g.name] || 0) + 1; });
            return next;
          });
        }
        loaded++;
        setGenreProgress({ loaded, total: malIds.length });
      }
    })();

    return () => { cancelled = true; };
  }, [entries]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex-1 bg-[var(--bg)] overflow-y-auto">
      <div className="bg-[var(--surface)] h-20" />
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    </div>
  );

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!entries.length || entries.length < 3) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg)] p-8 text-center gap-3">
      <span className="material-symbols-outlined text-6xl text-gray-300">bar_chart</span>
      <h2 className="text-xl font-bold text-gray-600">Not enough data yet</h2>
      <p className="text-gray-400 text-sm">Add at least 3 anime to your list to see your stats.</p>
      <button
        onClick={() => navigate('/')}
        className="mt-2 bg-[var(--primary)] text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition"
      >
        Go to my list
      </button>
    </div>
  );

  const {
    series, movies, totalEps, watchTimeHours, avgRating,
    thisMonthEps, statusCounts, completionRate, monthlyEps,
    hasLogData, topRated, watching, longest, latest, daysAgo,
  } = stats;

  const sortedGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxGenreCount = sortedGenres[0]?.[1] || 1;
  const MEDAL = ['🥇', '🥈', '🥉'];

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg)]">

      {/* ── Header ── */}
      <div className="bg-[var(--surface)] px-4 sm:px-8 py-6 shadow-md">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">bar_chart</span>
              Stats Dashboard
            </h1>
            <p className="text-white/50 text-sm mt-0.5">{username}'s watching breakdown</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const id = userId || username;
                const url = `${window.location.origin}/list/${id}/stats`;
                navigator.clipboard.writeText(url)
                  .then(() => toast.success('Stats link copied!'))
                  .catch(() => toast(url, { duration: 5000 }));
              }}
              className="flex items-center gap-1.5 text-sm bg-white/10 px-3 py-1.5 rounded-full text-white hover:bg-white/20 transition"
              title="Copy public stats link"
            >
              <span className="material-symbols-outlined text-base">share</span>
              Share Stats
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              My List
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* ── Row 1 — Metric cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            icon="video_library"
            label="Total Anime"
            value={series.length}
            sub={`+ ${movies.length} movie${movies.length !== 1 ? 's' : ''}`}
            gradient="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)]"
          />
          <MetricCard
            icon="play_circle"
            label="Episodes Watched"
            value={totalEps.toLocaleString()}
            sub={`≈ ${watchTimeHours.toLocaleString()} hours`}
            gradient="bg-gradient-to-br from-blue-500 to-blue-400"
          />
          <MetricCard
            icon="task_alt"
            label="Completion Rate"
            value={`${completionRate}%`}
            sub={`${(statusCounts.Finished || 0) + (statusCounts.CaughtUp || 0)} of ${series.length} finished`}
            gradient="bg-gradient-to-br from-green-500 to-green-400"
          />
          <MetricCard
            icon="calendar_today"
            label="This Month"
            value={thisMonthEps}
            sub={hasLogData ? 'episodes this month' : 'tracked from now on'}
            gradient="bg-gradient-to-br from-purple-500 to-purple-400"
          />
        </div>

        {/* ── Row 2 — Donut + Bar chart ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Status Donut */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Status Breakdown</h2>
            <div className="flex items-center gap-5">
              <DonutChart statusCounts={statusCounts} total={series.length} />
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {Object.entries(STATUS_CFG).map(([key, { color, label }]) => {
                  const count = statusCounts[key] || 0;
                  if (!count) return null;
                  const pct = Math.round((count / series.length) * 100);
                  return (
                    <div key={key} className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-sm text-gray-600 flex-1 min-w-0 truncate">{label}</span>
                      <span className="text-sm font-semibold text-gray-800">{count}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Episode activity */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Episodes / Month</h2>
              {!hasLogData && (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  tracking from now on
                </span>
              )}
            </div>
            <BarChart data={monthlyEps} />
          </div>
        </div>

        {/* ── Row 3 — Fun stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Longest Series</p>
            {longest?.episodes > 0 ? (
              <>
                <p className="font-semibold text-gray-700 text-sm truncate mb-1">{longest.name}</p>
                <p className="text-3xl font-bold text-[var(--primary)]">{longest.episodes.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">episodes watched</p>
              </>
            ) : <p className="text-sm text-gray-400">No data yet</p>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Est. Watch Time</p>
            <p className="text-3xl font-bold text-[var(--primary)]">{watchTimeHours.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">hours total</p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {series.length} series × 23 min<br />+ {movies.length} movies × 90 min
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Latest Addition</p>
            {latest ? (
              <>
                <p className="font-semibold text-gray-700 text-sm truncate mb-1">{latest.name}</p>
                <p className="text-lg font-bold text-[var(--primary)]">{daysAgo(latest.createdAt)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(latest.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </>
            ) : <p className="text-sm text-gray-400">No data yet</p>}
          </div>
        </div>

        {/* ── Row 4 — Top rated + Currently watching ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Your Top Rated</h2>
            {topRated.length === 0 ? (
              <p className="text-sm text-gray-400">Rate some anime to see your top picks.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topRated.map((e, i) => (
                  <div key={e._id || i} className="flex items-center gap-3 min-w-0">
                    <span className="text-base w-6 text-center flex-shrink-0">
                      {i < 3 ? MEDAL[i] : <span className="text-xs text-gray-400">{i + 1}.</span>}
                    </span>
                    <p className="flex-1 text-sm text-gray-700 truncate">{e.name}</p>
                    <span className="text-sm font-bold text-[var(--primary)] flex-shrink-0">★ {e.rating}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Currently Watching</h2>
              {watching.length > 0 && (
                <span className="text-xs font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                  {watching.length}
                </span>
              )}
            </div>
            {watching.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing marked as Watching right now.</p>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                {watching.map((e, i) => (
                  <div key={e._id || i} className="flex items-center justify-between gap-2 min-w-0">
                    <p className="text-sm text-gray-700 truncate flex-1">{e.name}</p>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
                      Ep {e.episodes}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 5 — Average rating (if rated entries exist) ── */}
        {avgRating && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Rating Overview</h2>
            <div className="flex items-center gap-8 flex-wrap">
              <div className="text-center">
                <p className="text-4xl font-bold text-[var(--primary)]">{avgRating}</p>
                <p className="text-xs text-gray-400 mt-1">avg rating / 10</p>
              </div>
              <div className="flex-1 min-w-0">
                {/* Rating distribution bar for 0–10 */}
                {(() => {
                  const dist = Array.from({ length: 11 }, (_, i) => ({
                    score: i,
                    count: entries.filter(e => e.rating === i).length,
                  }));
                  const maxDist = Math.max(...dist.map(d => d.count), 1);
                  return (
                    <div className="flex items-end gap-1 h-12">
                      {dist.map(({ score, count }) => (
                        <div key={score} className="flex-1 flex flex-col items-center gap-0.5">
                          <div
                            className="w-full rounded-t transition-all duration-500"
                            style={{
                              height: `${Math.max((count / maxDist) * 100, count > 0 ? 10 : 4)}%`,
                              background: count > 0 ? 'var(--primary)' : '#e5e7eb',
                            }}
                          />
                          <span className="text-[9px] text-gray-400">{score}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-400 mt-2">
                  {entries.filter(e => e.rating != null).length} of {entries.length} entries rated
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Row 6 — Genre chart ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Genres</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>{genreProgress.loaded} / {genreProgress.total} entries</span>
              {genreProgress.loaded < genreProgress.total && (
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
              )}
            </div>
          </div>

          {sortedGenres.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[var(--primary)] rounded-full animate-spin flex-shrink-0" />
              Loading genre data… This speeds up as you open anime detail modals.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedGenres.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3 min-w-0">
                  <span className="text-sm text-gray-600 w-28 flex-shrink-0 truncate">{name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-700"
                      style={{ width: `${(count / maxGenreCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}

          {genreProgress.total > 0 && genreProgress.loaded < genreProgress.total && (
            <p className="text-xs text-gray-400 mt-3 italic">
              {genreProgress.total - genreProgress.loaded} entries still loading in background…
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Stats;
