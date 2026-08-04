import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { getSchedule } from '../utils/jikanCache';
import { createAnime } from '../actions/entry';

// Day definitions — order matches JS getDay() starting Sunday
const DAYS = [
    { key: 'sunday', label: 'Sun' },
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
];

// Map today's local weekday index to the DAYS array
const localDayIndex = () => new Date().getDay(); // 0 = Sunday

const AiringCalendar = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Current local day selected by default
    const [activeDay, setActiveDay] = useState(localDayIndex());
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(false);

    // Track in-progress quick-add per mal_id
    const [adding, setAdding] = useState({});

    // Build a Set of mal_ids already in the user's list for O(1) lookup
    const animes = useSelector(state => state.entry.animes);
    const myMalIds = useRef(new Set());
    useEffect(() => {
        myMalIds.current = new Set(
            animes.filter(a => a.malId).map(a => String(a.malId))
        );
    }, [animes]);

    // Also check entire stored list across pages — we only have the current page in Redux,
    // so we supplement with a localStorage snapshot of the full mal_id set built on login.
    // For now, the Redux current-page check is good enough (covers what's visible).
    // Users with large lists will see "In my list" refresh as they navigate pages normally.

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setSchedule([]);
        const data = await getSchedule(activeDay);
            if (!cancelled) {
                setSchedule(data);
                setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [activeDay]);

    const isInList = (malId) => myMalIds.current.has(String(malId));

    const handleQuickAdd = async (anime) => {
        if (!anime.mal_id || isInList(anime.mal_id)) return;
        setAdding(prev => ({ ...prev, [anime.mal_id]: true }));
        await dispatch(createAnime({
            name: anime.title_english || anime.title,
            malId: anime.mal_id,
            status: 'Pending',
            entryType: 'series',
            episodes: 0,
        }));
        setAdding(prev => ({ ...prev, [anime.mal_id]: false }));
        // Update local set immediately so the badge appears without waiting for Redux cycle
        myMalIds.current.add(String(anime.mal_id));
    };

    const todayIndex = localDayIndex();

    return (
        <div className="flex-1 overflow-y-auto bg-[#ECF0F1]">

            {/* Header */}
            <div className="bg-[#2C3E50] px-4 sm:px-6 pt-5 pb-0 shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-white">Airing Calendar</h1>
                        <p className="text-xs text-white/50 mt-0.5">Currently airing anime, updated daily</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        My List
                    </button>
                </div>

                {/* Day tabs */}
                <div className="flex gap-1 overflow-x-auto pb-0 hide-scrollbar">
                    {DAYS.map((day, idx) => {
                        const isActive = idx === activeDay;
                        const isToday = idx === todayIndex;
                        return (
                            <button
                                key={day.key}
                                onClick={() => setActiveDay(idx)}
                                className={`
                                    relative flex-shrink-0 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all
                                    ${isActive
                                        ? 'bg-[#ECF0F1] text-[#E67E22]'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }
                                `}
                            >
                                {day.label}
                                {isToday && (
                                    <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#E67E22]' : 'bg-[#E67E22]/70'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content area */}
            <div className="p-4 sm:p-6">

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
                        <span className="w-8 h-8 border-2 border-gray-300 border-t-[#E67E22] rounded-full animate-spin" />
                        <span className="text-sm">Loading schedule...</span>
                    </div>
                ) : schedule.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
                        <span className="material-symbols-outlined text-5xl">calendar_today</span>
                        <p className="text-sm">No anime scheduled for {DAYS[activeDay].label}.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-xs text-gray-400 mb-4">
                            {schedule.length} anime airing on {DAYS[activeDay].label === DAYS[todayIndex].label ? 'today (' + DAYS[activeDay].label + ')' : DAYS[activeDay].label}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {schedule.map((anime, idx) => {
                                const inList = isInList(anime.mal_id);
                                const isAdding = adding[anime.mal_id];

                                return (
                                    <div
                                        key={`${anime.mal_id}-${idx}`}
                                        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                                    >
                                        {/* Cover image */}
                                        <div className="relative aspect-[3/4] bg-gray-100 flex-shrink-0 overflow-hidden">
                                            {anime.image ? (
                                                <img
                                                    src={anime.image}
                                                    alt={anime.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-3xl text-gray-300">image_not_supported</span>
                                                </div>
                                            )}

                                            {/* Score badge */}
                                            {anime.score && (
                                                <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-[#E67E22]" style={{ fontSize: '11px' }}>star</span>
                                                    {anime.score}
                                                </div>
                                            )}

                                            {/* In my list badge */}
                                            {inList && (
                                                <div className="absolute top-1.5 right-1.5 bg-[#E67E22] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-tight">
                                                    In list
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-2.5 flex flex-col flex-1">
                                            <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 mb-1.5 flex-1">
                                                {anime.title_english || anime.title}
                                            </p>

                                            {/* Genres */}
                                            {anime.genres.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {anime.genres.slice(0, 2).map(g => (
                                                        <span key={g} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Broadcast time */}
                                            {anime.broadcast && (
                                                <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>schedule</span>
                                                    {anime.broadcast}
                                                </p>
                                            )}

                                            {/* Add button */}
                                            {inList ? (
                                                <div className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-orange-50 text-[#E67E22] text-[11px] font-semibold">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
                                                    In my list
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleQuickAdd(anime)}
                                                    disabled={isAdding}
                                                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#2C3E50] hover:bg-[#E67E22] text-white text-[11px] font-semibold transition-colors disabled:opacity-60"
                                                >
                                                    {isAdding ? (
                                                        <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>add</span>
                                                            Add
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-center text-xs text-gray-400 mt-6">
                            Showing top 25 entries. Data from MyAnimeList via Jikan API. Schedule times are in JST.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AiringCalendar;
