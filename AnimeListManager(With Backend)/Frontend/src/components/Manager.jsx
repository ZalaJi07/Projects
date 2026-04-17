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

  // Search, filter, sort, pagination state
  const [page, setPage] = useState(1);
  const [listSearch, setListSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const searchDebounceRef = useRef(null);


  // Fetch animes with current filters
  useEffect(() => {
    if (user) {
      setLoading(true);
      dispatch(getAnimes(page, 20, listSearch, filterStatus === "All" ? "" : filterStatus, sortField, sortOrder))
        .then(() => setLoading(false))
        .catch(() => setLoading(false));
    }
  }, [page, listSearch, filterStatus, sortField, sortOrder, currentId, dispatch]);

  // Reset to page 1 when search/filter/sort changes
  useEffect(() => {
    setPage(1);
  }, [listSearch, filterStatus, sortField, sortOrder]);

  // Debounced list search
  const handleListSearchChange = (e) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const value = e.target.value;
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
        const response = await fetch(
          `https://api.jikan.moe/v4/anime?q=${searchTerm}&limit=10`
        );
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        if (data && data.data) {
          const filteredResults = data.data.filter((anime) =>
            anime.title_english
              ? anime.title_english.toLowerCase().includes(searchTerm.toLowerCase())
              : anime.title.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setSearchResults(filteredResults.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  const saveAnime = (e) => {
    if (list.name && list.status && list.episodes && list.movies) {
      e.preventDefault();
      if (currentId) {
        dispatch(updateAnime(currentId, list));
        setCurrentId(null);
      } else {
        dispatch(createAnime(list));
      }
      setList({ name: "", status: "", episodes: "", movies: "", malId: null });
    }
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
    <div className="flex justify-center bg-[#ECF0F1] flex-grow relative max-h-[83.6vh]">
      <div className="w-[90vw] md:w-[60vw]">
        <ManagerHeader />
        <AnimeForm
          list={list}
          handelChange={handelChange}
          saveAnime={saveAnime}
          searchResults={searchResults}
          handleSearchChange={handleSearchChange}
          setSearchResults={setSearchResults}
          setList={setList}
          currentId={currentId}
        />

        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 my-2">
          {/* Search in your list */}
          <div className="flex items-center gap-1 flex-1 min-w-[150px]">
            <span className="material-symbols-outlined text-[#E67E22] text-xl">search</span>
            <input
              type="text"
              placeholder="Search your list..."
              onChange={handleListSearchChange}
              className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm w-full
                     shadow-sm hover:border-[#E67E22] focus:outline-none focus:ring-2 
                     focus:ring-[#E67E22] transition"
            />
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[#E67E22] text-xl">filter_alt</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm
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

          {/* Sort buttons */}
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[#E67E22] text-xl">sort</span>
            <button
              onClick={() => toggleSort("name")}
              className={`px-2 py-1 text-xs rounded-lg border transition ${sortField === "name" ? "bg-[#E67E22] text-white border-[#E67E22]" : "bg-white border-gray-300 hover:border-[#E67E22]"
                }`}
            >
              Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => toggleSort("episodes")}
              className={`px-2 py-1 text-xs rounded-lg border transition ${sortField === "episodes" ? "bg-[#E67E22] text-white border-[#E67E22]" : "bg-white border-gray-300 hover:border-[#E67E22]"
                }`}
            >
              Episodes {sortField === "episodes" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => toggleSort("createdAt")}
              className={`px-2 py-1 text-xs rounded-lg border transition ${sortField === "createdAt" ? "bg-[#E67E22] text-white border-[#E67E22]" : "bg-white border-gray-300 hover:border-[#E67E22]"
                }`}
            >
              Date {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          </div>

          {/* Item count */}
          <span className="text-xs text-gray-500 ml-auto">{totalItems} anime</span>
        </div>

        {/* Table area */}
        <div className="body overflow-y-auto max-h-[35vh]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-[#E67E22] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : animes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium">
                {listSearch || filterStatus !== "All" ? "No anime matches your search" : "Your anime list is empty"}
              </p>
              <p className="text-sm mt-1">
                {listSearch || filterStatus !== "All" ? "Try different filters" : "Add your first anime above to get started!"}
              </p>
            </div>
          ) : (
            <AnimeTable
              animes={animes}
              setCurrentId={setCurrentId}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-2">
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
