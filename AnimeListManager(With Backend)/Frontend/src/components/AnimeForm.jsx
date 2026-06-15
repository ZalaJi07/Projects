import { useState, useEffect, forwardRef } from "react";
import { useSelector } from "react-redux";

const AnimeForm = forwardRef(function AnimeForm({ list, handelChange, saveAnime, setList, currentId, searchResults, handleSearchChange, setSearchResults, activeTab = "series" }, ref) {

    const anime = useSelector((state) => currentId ? state.entry.animes.find((anime) => anime._id === currentId) : null);

    useEffect(() => {
        if (anime) setList(anime);
    }, [anime]);

    const isMovie = activeTab === "movie";

    return (
        <div className="input pb-4 relative">
            <input
                ref={ref}
                value={list.name}
                onChange={(e) => {
                    handleSearchChange(e.target.value);
                    setList({ ...list, name: e.target.value, malId: null });
                }}
                type="text"
                name="name"
                placeholder={isMovie ? "Movie Name" : "Anime Name"}
                autoComplete="off"
                className="hover:duration-500 hover:scale-105 border border-gray-300 rounded-lg px-3 py-2 my-3 w-full focus:ring-2 focus:ring-[var(--primary)] outline-none transition"
            />

            {/* Search Result Dropdown */}
            {searchResults.length > 0 && (
                <ul className="absolute top-[100%] left-0 right-0 bg-[var(--bg)] border border-gray-300 rounded-xl shadow-md max-h-64 overflow-auto z-20 backdrop-blur-sm">
                    {searchResults.map((anime, index) => (
                        <li
                            key={index}
                            onClick={() => {
                                setList({
                                    ...list,
                                    name: anime.title_english || anime.title,
                                    malId: anime.mal_id,
                                });
                                setSearchResults([]);
                            }}
                            className="flex items-center gap-3 p-2 cursor-pointer hover:bg-[var(--primary)]/10 transition-all"
                        >
                            <img
                                src={anime.images.jpg.image_url}
                                alt={anime.title_english || anime.title}
                                className="w-10 h-14 rounded-md object-cover shadow-sm"
                            />
                            <div className="flex flex-col">
                                <p className="font-semibold text-gray-800">
                                    {anime.title_english || anime.title}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {anime.type} • {anime.episodes || "?"} eps • ⭐ {anime.score || "N/A"}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {!isMovie && (
                <div className="select flex flex-col md:flex-row justify-between gap-4 md:gap-0">
                    <div className="relative w-full md:w-[32%]">
                        <select
                            value={list.status}
                            onChange={handelChange}
                            name="status"
                            required
                            className="hover:duration-500 hover:scale-105 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--primary)] outline-none transition w-full bg-white text-gray-800 appearance-none cursor-pointer"
                        >
                            <option value="" disabled>
                                Status
                            </option>
                            <option value="Finished">Finished</option>
                            <option value="CaughtUp">CaughtUp</option>
                            <option value="Watching">Watching</option>
                            <option value="OnHold">OnHold</option>
                            <option value="Pending">Pending</option>
                            <option value="Dropped">Dropped</option>
                        </select>
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 material-symbols-outlined pointer-events-none">
                            expand_more
                        </span>
                    </div>

                    <input
                        value={list.episodes}
                        onChange={handelChange}
                        type="number"
                        name="episodes"
                        placeholder="Episodes"
                        className="hover:duration-500 hover:scale-105 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--primary)] outline-none transition w-full md:w-[32%]"
                        autoComplete="off"
                    />

                    <input
                        value={list.movies}
                        onChange={handelChange}
                        type="number"
                        name="movies"
                        placeholder="Movies"
                        className="hover:duration-500 hover:scale-105 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--primary)] outline-none transition w-full md:w-[32%]"
                        autoComplete="off"
                    />
                </div>
            )}

            <button
                onClick={saveAnime}
                className="hover:duration-500 hover:scale-105 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] hover:opacity-90 transition rounded-full my-4 px-8 py-2 w-full text-white flex justify-center items-center gap-1 font-bold shadow-md"
            >
                <span className="material-symbols-outlined">save</span>SAVE
            </button>
        </div>
    );
});

export default AnimeForm;
