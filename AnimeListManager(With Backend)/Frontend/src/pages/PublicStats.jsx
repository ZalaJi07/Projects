import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicStats } from '../api/index.js';

// ── Status colour palette ─────────────────────────────────────────────────────
const STATUS_CFG = {
  Finished:  { color: '#22c55e', label: 'Finished'  },
  CaughtUp:  { color: '#a855f7', label: 'Caught Up' },
  Watching:  { color: '#3b82f6', label: 'Watching'  },
  OnHold:    { color: '#eab308', label: 'On Hold'   },
  Pending:   { color: '#94a3b8', label: 'Pending'   },
  Dropped:   { color: '#ef4444', label: 'Dropped'   },
};

// ── SVG Donut ─────────────────────────────────────────────────────────────────
const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};
const donutPath = (cx, cy, outerR, innerR, start, end) => {
  const s = polar(cx, cy, outerR, start), e = polar(cx, cy, outerR, end);
  const si = polar(cx, cy, innerR, end), ei = polar(cx, cy, innerR, start);
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
  const cx = 74, cy = 74, outerR = 60, innerR = 38;
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
      const start = angle; angle += sweep;
      return { key, color, count, sweep, start, end: angle };
    })
    .filter(s => s.sweep > 0.5);
  return (
    <svg width={148} height={148} className="flex-shrink-0 drop-shadow-sm">
      {segments.map(s => (
        <path key={s.key}
          d={donutPath(cx, cy, outerR, innerR, s.start, s.sweep >= 359.5 ? s.end - 0.1 : s.end)}
          fill={s.color} className="transition-all duration-500" />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="700" fill="#1f2937">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fill="#9ca3af">series</text>
    </svg>
  );
};

const MEDAL = ['🥇', '🥈', '🥉'];

// ── Main component ────────────────────────────────────────────────────────────
const PublicStats = () => {
  const { username } = useParams();   // may be _id or username
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicStats(username)
      .then(({ data }) => { setStats(data); setLoading(false); })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load stats.');
        setLoading(false);
      });
  }, [username]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#ECF0F1]">
      <div className="w-10 h-10 border-4 border-[#E67E22] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#ECF0F1] gap-3 text-center p-8">
      <span className="material-symbols-outlined text-6xl text-gray-300">bar_chart</span>
      <p className="text-lg font-semibold text-gray-500">{error}</p>
    </div>
  );

  const {
    username: displayName, totalSeries, totalMovies, totalEpisodes,
    avgRating, statusCounts = {}, topRated = [],
  } = stats;

  const watchTimeHours = Math.round((totalEpisodes * 23 + totalMovies * 90) / 60);
  const totalEntries = totalSeries + totalMovies;
  const completed = (statusCounts.Finished || 0) + (statusCounts.CaughtUp || 0);
  const completionRate = totalSeries > 0 ? Math.round((completed / totalSeries) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#ECF0F1]">

      {/* Header */}
      <div className="bg-[#2C3E50] px-4 sm:px-8 py-6 shadow-md">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#E67E22]">bar_chart</span>
              {displayName}'s Stats
            </h1>
            <p className="text-white/50 text-sm mt-0.5">Public viewing — episode activity is private</p>
          </div>
          <button
            onClick={() => navigate(`/list/${username}`)}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition"
          >
            <span className="material-symbols-outlined text-base">list</span>
            View List
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: 'video_library',  label: 'Anime',           value: totalSeries,  sub: `+ ${totalMovies} movie${totalMovies !== 1 ? 's' : ''}`, grad: 'from-[#E67E22] to-[#f39c12]' },
            { icon: 'play_circle',    label: 'Episodes',        value: totalEpisodes.toLocaleString(), sub: `≈ ${watchTimeHours.toLocaleString()} hrs`, grad: 'from-blue-500 to-blue-400' },
            { icon: 'task_alt',       label: 'Completion',      value: `${completionRate}%`, sub: `${completed} of ${totalSeries} done`, grad: 'from-green-500 to-green-400' },
            { icon: 'star',           label: 'Avg Rating',      value: avgRating ?? '—', sub: avgRating ? 'out of 10' : 'no ratings yet', grad: 'from-purple-500 to-purple-400' },
          ].map(({ icon, label, value, sub, grad }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${grad}`}>
                <span className="material-symbols-outlined text-white text-xl">{icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
                {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Status donut + Top rated */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Status Breakdown</h2>
            <div className="flex items-center gap-5">
              <DonutChart statusCounts={statusCounts} total={totalSeries} />
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {Object.entries(STATUS_CFG).map(([key, { color, label }]) => {
                  const count = statusCounts[key] || 0;
                  if (!count) return null;
                  const pct = Math.round((count / totalSeries) * 100);
                  return (
                    <div key={key} className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-sm text-gray-600 flex-1 truncate">{label}</span>
                      <span className="text-sm font-semibold text-gray-800">{count}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Top Rated</h2>
            {topRated.length === 0 ? (
              <p className="text-sm text-gray-400">No rated entries yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topRated.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 min-w-0">
                    <span className="text-base w-6 text-center flex-shrink-0">
                      {i < 3 ? MEDAL[i] : <span className="text-xs text-gray-400">{i + 1}.</span>}
                    </span>
                    <p className="flex-1 text-sm text-gray-700 truncate">{e.name}</p>
                    <span className="text-sm font-bold text-[#E67E22] flex-shrink-0">★ {e.rating}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Privacy notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-500 text-xl flex-shrink-0 mt-0.5">lock</span>
          <div>
            <p className="text-sm font-semibold text-amber-700">Episode activity is private</p>
            <p className="text-xs text-amber-600 mt-0.5">
              The monthly episode chart is only visible to {displayName}. Everything else shown here is public.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicStats;
