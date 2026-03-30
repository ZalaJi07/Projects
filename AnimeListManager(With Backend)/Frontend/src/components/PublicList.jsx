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
    const searchDebounceRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchPublicList(username, page, 20, listSearch, filterStatus === "All" ? "" : filterStatus, sortField, sortOrder)
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
    }, [username, page, listSearch, filterStatus, sortField, sortOrder]);

    useEffect(() => {
        setPage(1);
    }, [listSearch, filterStatus, sortField, sortOrder]);

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
        <div className="flex justify-center bg-[#ECF0F1] flex-grow relative max-h-[83.6vh]">
            <div className="w-[90vw] md:w-[60vw]">
                {/* Header */}
                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E67E22] flex items-center justify-center font-bold text-white uppercase text-lg">
                            {username[0]}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">{username}'s Anime List</h2>
                            <p className="text-xs text-gray-500">{totalItems} anime</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">Read Only</span>
                </div>

                {/* Search, Filter & Sort */}
                <div className="flex flex-wrap items-center gap-2 my-2">
                    <div className="flex items-center gap-1 flex-1 min-w-[150px]">
                        <span className="material-symbols-outlined text-[#E67E22] text-xl">search</span>
                        <input
                            type="text"
                            placeholder="Search this list..."
                            onChange={handleListSearchChange}
                            className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm w-full shadow-sm hover:border-[#E67E22] focus:outline-none focus:ring-2 focus:ring-[#E67E22] transition"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[#E67E22] text-xl">filter_alt</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm shadow-sm hover:border-[#E67E22] focus:outline-none focus:ring-2 focus:ring-[#E67E22] transition"
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
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[#E67E22] text-xl">sort</span>
                        {["name", "episodes", "createdAt"].map((field) => (
                            <button
                                key={field}
                                onClick={() => toggleSort(field)}
                                className={`px-2 py-1 text-xs rounded-lg border transition ${sortField === field ? "bg-[#E67E22] text-white border-[#E67E22]" : "bg-white border-gray-300 hover:border-[#E67E22]"}`}
                            >
                                {field === "createdAt" ? "Date" : field.charAt(0).toUpperCase() + field.slice(1)} {sortField === field && (sortOrder === "asc" ? "↑" : "↓")}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table — more height since no form above */}
                <div className="body overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-4 border-[#E67E22] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : animes.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-lg font-medium">
                                {listSearch || filterStatus !== "All" ? "No anime matches the search" : "This list is empty"}
                            </p>
                        </div>
                    ) : (
                        <AnimeTable animes={animes} setCurrentId={() => {}} readOnly={true} />
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 py-2">
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
                )}
            </div>
        </div>
    );
};

export default PublicList;
