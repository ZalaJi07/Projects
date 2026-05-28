import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import AnimeTable from "./AnimeTable";
import { fetchPublicList } from "../api";

const PublicList = () => {
    const { username } = useParams();
    const [animes, setAnimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [listSearch, setListSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [activeTab, setActiveTab] = useState("series");
    const searchDebounceRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchPublicList(username, page, 20, listSearch, filterStatus === "All" ? "" : filterStatus, sortField, sortOrder, activeTab)
            .then(({ data }) => {
                setAnimes(data.data);
                setTotalPages(data.totalPages);
                setTotalItems(data.totalItems);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.response?.data?.message || "Failed to load list.");
                setLoading(false);
            });
    }, [username, page, listSearch, filterStatus, sortField, sortOrder, activeTab]);

    useEffect(() => {
        setPage(1);
    }, [listSearch, filterStatus, sortField, sortOrder, activeTab]);

    // Reset filter when switching tabs
    useEffect(() => {
        setFilterStatus("All");
    }, [activeTab]);

    const handleListSearchChange = (e) => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        const value = e.target.value;
        searchDebounceRef.current = setTimeout(() => {
            setListSearch(value);
        }, 400);
    };

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const isMovie = activeTab === "movie";

    if (error) {
        return (
            <div className="flex flex-grow items-center justify-center bg-[#ECF0F1]">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">person_off</span>
                    <p className="text-xl font-semibold text-gray-500">{error}</p>
                    <p className="text-sm text-gray-400 mt-1">Check the username and try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center bg-[#ECF0F1] flex-grow overflow-auto">
            <div className="w-[95vw] md:w-[60vw] flex flex-col py-2 px-1 sm:px-0">
                {/* Header */}
                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E67E22] flex items-center justify-center font-bold text-white uppercase text-lg">
                            {username[0]}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">{username}'s List</h2>
                            <p className="text-xs text-gray-500">
                                {totalItems} {isMovie ? "movie" : "anime"}{totalItems !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">Read Only</span>
                </div>

                {/* Tab Toggle */}
                <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-3 self-center">
                    <button
                        onClick={() => setActiveTab("series")}
                        className={`px-5 sm:px-8 py-2 text-sm font-semibold transition ${activeTab === "series" ? "bg-[#E67E22] text-white" : "bg-white text-gray-600 hover:bg-orange-50"
                            }`}
                    >
                        Series
                    </button>
                    <button
                        onClick={() => setActiveTab("movie")}
                        className={`px-5 sm:px-8 py-2 text-sm font-semibold transition ${activeTab === "movie" ? "bg-[#E67E22] text-white" : "bg-white text-gray-600 hover:bg-orange-50"
                            }`}
                    >
                        Movies
                    </button>
                </div>

                {/* Search, Filter & Sort */}
                <div className="flex flex-wrap items-center gap-2 my-2">
                    <div className="flex items-center gap-1 w-full sm:flex-1 sm:min-w-[150px]">
                        <span className="material-symbols-outlined text-[#E67E22] text-xl">search</span>
                        <input
                            type="text"
                            placeholder={isMovie ? "Search movies..." : "Search this list..."}
                            onChange={handleListSearchChange}
                            className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm w-full shadow-sm hover:border-[#E67E22] focus:outline-none focus:ring-2 focus:ring-[#E67E22] transition"
                        />
                    </div>
                    {!isMovie && (
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[#E67E22] text-xl">filter_alt</span>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="border border-gray-300 bg-white rounded-lg px-2 sm:px-3 py-1.5 text-sm shadow-sm hover:border-[#E67E22] focus:outline-none focus:ring-2 focus:ring-[#E67E22] transition"
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
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[#E67E22] text-xl hidden sm:inline">sort</span>
                        <button
                            onClick={() => toggleSort("name")}
                            className={`px-2 py-1 text-xs rounded-lg border transition ${sortField === "name" ? "bg-[#E67E22] text-white border-[#E67E22]" : "bg-white border-gray-300 hover:border-[#E67E22]"}`}
                        >
                            Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                        </button>
                        {!isMovie && (
                            <button
                                onClick={() => toggleSort("episodes")}
                                className={`px-2 py-1 text-xs rounded-lg border transition ${sortField === "episodes" ? "bg-[#E67E22] text-white border-[#E67E22]" : "bg-white border-gray-300 hover:border-[#E67E22]"}`}
                            >
                                Ep {sortField === "episodes" && (sortOrder === "asc" ? "↑" : "↓")}
                            </button>
                        )}
                        <button
                            onClick={() => toggleSort("createdAt")}
                            className={`px-2 py-1 text-xs rounded-lg border transition ${sortField === "createdAt" ? "bg-[#E67E22] text-white border-[#E67E22]" : "bg-white border-gray-300 hover:border-[#E67E22]"}`}
                        >
                            Date {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="min-h-[60vh] md:min-h-0 overflow-y-auto md:flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-4 border-[#E67E22] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : animes.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-lg font-medium">
                                {listSearch || filterStatus !== "All"
                                    ? "No results match the search"
                                    : isMovie
                                        ? "No movies in this list"
                                        : "This list is empty"}
                            </p>
                        </div>
                    ) : (
                        <AnimeTable animes={animes} setCurrentId={() => { }} readOnly={true} mode={activeTab} />
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (() => {
                    // Build page numbers: always show first, last, and pages around current
                    const pages = [];
                    const addPage = (p) => { if (!pages.includes(p)) pages.push(p); };

                    addPage(1);
                    addPage(totalPages);
                    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                        addPage(i);
                    }
                    pages.sort((a, b) => a - b);

                    // Insert ellipsis markers
                    const items = [];
                    for (let i = 0; i < pages.length; i++) {
                        if (i > 0 && pages[i] - pages[i - 1] > 1) {
                            items.push("...");
                        }
                        items.push(pages[i]);
                    }

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
                      ${page === item
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
                {/* {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 py-3 flex-shrink-0">
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                            className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:border-[#E67E22] disabled:opacity-40 disabled:cursor-not-allowed transition">
                            ← Prev
                        </button>
                        <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                            className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:border-[#E67E22] disabled:opacity-40 disabled:cursor-not-allowed transition">
                            Next →
                        </button>
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default PublicList;
