import { useState, useEffect, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import ManagerHeader from "./ManagerHeader";
import AnimeForm from "./AnimeForm";
import AnimeTable from "./AnimeTable";

import { useDispatch, shallowEqual } from "react-redux";
import { createAnime, updateAnime } from "../actions/entry";
import { useSelector } from "react-redux";

import { getAnimes } from "../actions/entry";

const Manager = () => {
  const user = JSON.parse(localStorage.getItem("profile"));

  const { animes, currentPage, totalPages, totalItems } = useSelector((state) => state.entry, shallowEqual);
  const [loading, setLoading] = useState(true);

  const [list, setList] = useState({ name: "", status: "", episodes: "", movies: "", malId: null });
  const dispatch = useDispatch();

  const [currentId, setCurrentId] = useState(null);

  // Tab state: "series" or "movie" — persisted
  const [activeTab, setActiveTabState] = useState(() => {
    const saved = localStorage.getItem("activeTab");
    return saved === "movie" ? "movie" : "series";
  });
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem("activeTab", tab);
  };

  // Search, filter, sort, pagination state
  const [page, setPage] = useState(1);
  const [listSearch, setListSearch] = useState("");
  const [listSearchDisplay, setListSearchDisplay] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const searchDebounceRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const nameInputRef = useRef(null);

  // Scroll to top when page changes
  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Global keyboard shortcut: N = focus add form; ← / → = paginate
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't fire when typing inside any interactive element
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.key === 'n' || e.key === 'N') && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        nameInputRef.current?.focus();
        nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (e.key === 'ArrowLeft' && !isTyping) {
        setPage((prev) => Math.max(1, prev - 1));
        return;
      }

      if (e.key === 'ArrowRight' && !isTyping) {
        setPage((prev) => Math.min(totalPages, prev + 1));
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  // Fetch animes with current filters + tab type
  useEffect(() => {
    if (user) {
      setLoading(true);
      dispatch(getAnimes(page, 20, listSearch, filterStatus === "All" ? "" : filterStatus, sortField, sortOrder, activeTab))
        .then(() => { setLoading(false); scrollToTop(); })
        .catch(() => setLoading(false));
    }
  }, [page, listSearch, filterStatus, sortField, sortOrder, currentId, activeTab, dispatch, scrollToTop]);

  // Reset to page 1 when search/filter/sort/tab changes
  useEffect(() => {
    setPage(1);
  }, [listSearch, filterStatus, sortField, sortOrder, activeTab]);

  // Reset form when switching tabs
  useEffect(() => {
    setList({ name: "", status: "", episodes: "", movies: "", malId: null });
    setCurrentId(null);
    setSearchResults([]);
    setFilterStatus("All");
    setListSearch("");
    setListSearchDisplay("");
  }, [activeTab]);

  // Debounced list search
  const handleListSearchChange = (e) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const value = e.target.value;
    setListSearchDisplay(value);
    searchDebounceRef.current = setTimeout(() => {
      setListSearch(value);
    }, 400);
  };

  // Jikan API search for adding anime
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debounceRef = useRef(null);

  const handleSearchChange = (input) => {
    setSearchTerm(input);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        // Build Jikan URL: SFW + type filter based on active tab
        let url = `https://api.jikan.moe/v4/anime?q=${searchTerm}&limit=10&sfw=true`;
        if (activeTab === "movie") {
          url += "&type=movie";
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        if (data && data.data) {
          let filteredResults = data.data;

          // For series tab: exclude movies from results
          if (activeTab === "series") {
            filteredResults = filteredResults.filter((anime) => anime.type !== "Movie");
          }

          setSearchResults(filteredResults.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, activeTab]);

  const saveAnime = async (e) => {
    // For edits, preserve original entryType; for new entries, use activeTab
    const entryType = currentId && list.entryType ? list.entryType : (activeTab === "movie" ? "movie" : "series");

    if (entryType === "movie") {
      // Movies only need a name
      if (!list.name) return;
      e.preventDefault();
      const movieData = { ...list, status: "Finished", episodes: 0, movies: 0, entryType: "movie" };
      if (currentId) {
        await dispatch(updateAnime(currentId, movieData));
        setCurrentId(null);
      } else {
        await dispatch(createAnime(movieData));
      }
    } else {
      // Series needs all fields
      if (!(list.name && list.status && list.episodes && list.movies)) return;
      e.preventDefault();
      const seriesData = { ...list, entryType: "series" };
      if (currentId) {
        await dispatch(updateAnime(currentId, seriesData));
        setCurrentId(null);
      } else {
        await dispatch(createAnime(seriesData));
      }
    }
    setList({ name: "", status: "", episodes: "", movies: "", malId: null });
    dispatch(getAnimes(page, 20, listSearch, filterStatus === "All" ? "" : filterStatus, sortField, sortOrder, activeTab));
  };

  const handelChange = (e) => setList({ ...list, [e.target.name]: e.target.value });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div ref={scrollContainerRef} className="flex justify-center bg-[#ECF0F1] flex-grow overflow-auto">
      <div className="w-[95vw] md:w-[60vw] flex flex-col py-2 px-1 sm:px-0">
        <ManagerHeader />

        {/* ── Series / Movies Tab Toggle ── */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-3 self-center">
          <button
            onClick={() => setActiveTab("series")}
            className={`px-5 sm:px-8 py-2 text-sm font-semibold transition ${activeTab === "series"
              ? "bg-[#E67E22] text-white"
              : "bg-white text-gray-600 hover:bg-orange-50"
              }`}
          >
            Series
          </button>
          <button
            onClick={() => setActiveTab("movie")}
            className={`px-5 sm:px-8 py-2 text-sm font-semibold transition ${activeTab === "movie"
              ? "bg-[#E67E22] text-white"
              : "bg-white text-gray-600 hover:bg-orange-50"
              }`}
          >
            Movies
          </button>
        </div>

        <AnimeForm
          ref={nameInputRef}
          list={list}
          handelChange={handelChange}
          saveAnime={saveAnime}
          searchResults={searchResults}
          handleSearchChange={handleSearchChange}
          setSearchResults={setSearchResults}
          setList={setList}
          currentId={currentId}
          activeTab={activeTab}
        />

        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 my-2">
          {/* Search in your list */}
          <div className="flex items-center gap-1 w-full sm:flex-1 sm:min-w-[150px]">
            <span className="material-symbols-outlined text-[#E67E22] text-xl">search</span>
            <input
              key={activeTab}
              type="text"
              placeholder={activeTab === "movie" ? "Search your movies..." : "Search your list..."}
              value={listSearchDisplay}
              onChange={handleListSearchChange}
              className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm w-full
                     shadow-sm hover:border-[#E67E22] focus:outline-none focus:ring-2 
                     focus:ring-[#E67E22] transition"
            />
          </div>

          {/* Filter by Status — only for series */}
          {activeTab === "series" && (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[#E67E22] text-xl">filter_alt</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 bg-white rounded-lg px-2 sm:px-3 py-1.5 text-sm
                       shadow-sm hover:border-[#E67E22] focus:outline-none focus:ring-2 
                       focus:ring-[#E67E22] transition"
              >
                <option value="All">All</option>
                <option value="Finished">Finished</option>
                <option value="CaughtUp">CaughtUp</option>
                <option value="Watching">Watching</option>
                <option value="OnHold">OnHold</option>
                <option value="Pending">Pending</option>
                <option value="Dropped">Dropped</option>
              </select>
            </div>
          )}

          {/* Sort buttons */}
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[#E67E22] text-xl hidden sm:inline">sort</span>
            <button
              onClick={() => toggleSort("name")}
              className={`px-2 py-1 text-xs rounded-lg border transition ${sortField === "name" ? "bg-[#E67E22] text-white border-[#E67E22]" : "bg-white border-gray-300 hover:border-[#E67E22]"
                }`}
            >
              Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            {activeTab === "series" && (
              <button
                onClick={() => toggleSort("episodes")}
                className={`px-2 py-1 text-xs rounded-lg border transition ${sortField === "episodes" ? "bg-[#E67E22] text-white border-[#E67E22]" : "bg-white border-gray-300 hover:border-[#E67E22]"
                  }`}
              >
                Ep {sortField === "episodes" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            )}
            <button
              onClick={() => toggleSort("createdAt")}
              className={`px-2 py-1 text-xs rounded-lg border transition ${sortField === "createdAt" ? "bg-[#E67E22] text-white border-[#E67E22]" : "bg-white border-gray-300 hover:border-[#E67E22]"
                }`}
            >
              Date {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          </div>

          {/* Item count */}
          <span className="text-xs text-gray-500 ml-auto">
            {totalItems} {activeTab === "movie" ? "movie" : "anime"}{totalItems !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table area */}
        <div className="min-h-[60vh] md:min-h-0 overflow-y-auto md:flex-1">
          {loading ? (
            <div className="space-y-0">
              {/* Skeleton shimmer rows */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 bg-orange-50 border-b border-orange-100 animate-pulse">
                  <div className="w-8 h-11 rounded bg-orange-200/60 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-orange-200/60 rounded-full w-[60%]"></div>
                    <div className="h-2.5 bg-orange-200/40 rounded-full w-[35%]"></div>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                    <div className="h-3 bg-orange-200/40 rounded-full w-16"></div>
                    <div className="h-3 bg-orange-200/40 rounded-full w-10"></div>
                    <div className="h-3 bg-orange-200/40 rounded-full w-10"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : animes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              {listSearch || filterStatus !== "All" ? (
                <>
                  <div className="flex justify-center mb-4">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="30" stroke="#E67E22" strokeWidth="4" strokeOpacity="0.3" fill="#FFF7ED" />
                      <line x1="72" y1="72" x2="100" y2="100" stroke="#E67E22" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.3" />
                      <line x1="38" y1="38" x2="62" y2="62" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5" />
                      <line x1="62" y1="38" x2="38" y2="62" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-500">No results found</p>
                  <p className="text-sm mt-1">Try a different search or filter</p>
                </>
              ) : activeTab === "movie" ? (
                <>
                  <div className="flex justify-center mb-4">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="20" y="25" width="80" height="60" rx="8" fill="#FFF7ED" stroke="#E67E22" strokeWidth="3" strokeOpacity="0.4" />
                      <rect x="25" y="30" width="10" height="10" rx="2" fill="#E67E22" fillOpacity="0.2" />
                      <rect x="25" y="45" width="10" height="10" rx="2" fill="#E67E22" fillOpacity="0.2" />
                      <rect x="25" y="60" width="10" height="10" rx="2" fill="#E67E22" fillOpacity="0.2" />
                      <rect x="85" y="30" width="10" height="10" rx="2" fill="#E67E22" fillOpacity="0.2" />
                      <rect x="85" y="45" width="10" height="10" rx="2" fill="#E67E22" fillOpacity="0.2" />
                      <rect x="85" y="60" width="10" height="10" rx="2" fill="#E67E22" fillOpacity="0.2" />
                      <polygon points="52,42 52,68 72,55" fill="#E67E22" fillOpacity="0.4" />
                      <circle cx="85" cy="95" r="12" fill="#FFF7ED" stroke="#E67E22" strokeWidth="2" strokeOpacity="0.3" />
                      <rect x="81" y="85" width="8" height="5" rx="1" fill="#E67E22" fillOpacity="0.3" />
                      <circle cx="82" cy="93" r="1.5" fill="#E67E22" fillOpacity="0.4" />
                      <circle cx="88" cy="93" r="1.5" fill="#E67E22" fillOpacity="0.4" />
                      <circle cx="85" cy="97" r="1.5" fill="#E67E22" fillOpacity="0.4" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-500">No movies yet</p>
                  <p className="text-sm mt-1">Search and add your favorite anime movies above! 🍿</p>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="30" y="40" width="50" height="65" rx="4" fill="#FDBA74" fillOpacity="0.15" stroke="#E67E22" strokeWidth="2.5" strokeOpacity="0.3" transform="rotate(-6 30 40)" />
                      <rect x="35" y="35" width="50" height="65" rx="4" fill="#FFF7ED" stroke="#E67E22" strokeWidth="2.5" strokeOpacity="0.4" />
                      <line x1="45" y1="50" x2="75" y2="50" stroke="#E67E22" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
                      <line x1="45" y1="58" x2="70" y2="58" stroke="#E67E22" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.2" />
                      <line x1="45" y1="66" x2="72" y2="66" stroke="#E67E22" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.2" />
                      <line x1="45" y1="74" x2="65" y2="74" stroke="#E67E22" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.15" />
                      <circle cx="85" cy="35" r="16" fill="#FFF7ED" stroke="#E67E22" strokeWidth="2.5" strokeOpacity="0.4" />
                      <line x1="85" y1="28" x2="85" y2="42" stroke="#E67E22" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
                      <line x1="78" y1="35" x2="92" y2="35" stroke="#E67E22" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-500">Your anime list is empty</p>
                  <p className="text-sm mt-1">Start building your collection — add your first anime above! ✨</p>
                </>
              )}
            </div>
          ) : (
            <AnimeTable
              animes={animes}
              setCurrentId={setCurrentId}
              mode={activeTab}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (() => {
          const buildPages = (current, total) => {
            if (total <= 5) {
              // Show all pages — no ellipsis needed
              return Array.from({ length: total }, (_, i) => i + 1);
            }

            // Always include: first, last, current, and neighbours
            const core = new Set([
              1,
              total,
              current,
              current - 1,
              current + 1,
            ]);

            // If we have fewer than 4 unique pages, pad outward
            if (core.size < 4) {
              for (let p = 2; core.size < 4 && p < total; p++) core.add(p);
            }

            // Sort and insert ellipsis where gap > 1
            const sorted = [...core].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
            const items = [];
            for (let i = 0; i < sorted.length; i++) {
              if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push("...");
              items.push(sorted[i]);
            }
            return items;
          };

          const items = buildPages(currentPage, totalPages);

          return (
            <div className="flex justify-center items-center gap-1.5 py-3 flex-shrink-0">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 
                 hover:border-[#E67E22] hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>

              {items.map((item, idx) =>
                item === "..." ? (
                  <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">
                    ···
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition
              ${currentPage === item
                        ? "bg-[#E67E22] text-white shadow-sm"
                        : "border border-gray-300 text-gray-600 hover:border-[#E67E22] hover:bg-orange-50"
                      }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 
                 hover:border-[#E67E22] hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Manager;
