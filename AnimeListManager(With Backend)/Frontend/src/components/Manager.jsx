import { useState, useEffect, useRef } from "react";
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

  // Tab state: "series" or "movie"
  const [activeTab, setActiveTab] = useState("series");

  // Search, filter, sort, pagination state
  const [page, setPage] = useState(1);
  const [listSearch, setListSearch] = useState("");
  const [listSearchDisplay, setListSearchDisplay] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const searchDebounceRef = useRef(null);

  // Fetch animes with current filters + tab type
  useEffect(() => {
    if (user) {
      setLoading(true);
      dispatch(getAnimes(page, 20, listSearch, filterStatus === "All" ? "" : filterStatus, sortField, sortOrder, activeTab))
        .then(() => setLoading(false))
        .catch(() => setLoading(false));
    }
  }, [page, listSearch, filterStatus, sortField, sortOrder, currentId, activeTab, dispatch]);

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
    if (activeTab === "movie") {
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
    <div className="flex justify-center bg-[#ECF0F1] flex-grow overflow-auto">
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
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-[#E67E22] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : animes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              {listSearch || filterStatus !== "All" ? (
                <>
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-3 block">search_off</span>
                  <p className="text-lg font-semibold text-gray-500">No results found</p>
                  <p className="text-sm mt-1">Try a different search or filter</p>
                </>
              ) : activeTab === "movie" ? (
                <>
                  <span className="material-symbols-outlined text-6xl text-orange-200 mb-3 block">movie</span>
                  <p className="text-lg font-semibold text-gray-500">No movies yet</p>
                  <p className="text-sm mt-1">Search and add your favorite anime movies above! 🍿</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-6xl text-orange-200 mb-3 block">library_add</span>
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
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-3 flex-shrink-0">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:border-[#E67E22] 
                       disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:border-[#E67E22] 
                       disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Manager;
