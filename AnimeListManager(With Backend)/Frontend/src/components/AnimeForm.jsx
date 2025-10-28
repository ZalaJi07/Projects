import { useState } from "react";

const AnimeForm = ({ list, handelChange, handleSearch, saveAnime, searchResults, setList }) => {
    return (
        <div className="input pb-4 relative">
            <input
                value={list.name}
                onChange={(e) => handleSearch(e.target.value)}
                type="text"
                name="name"
                placeholder="Anime Name"
                className="hover:duration-500 hover:scale-105 border border-gray-300 rounded-lg px-3 py-2 my-3 w-full focus:ring-2 focus:ring-[#E67E22] outline-none transition"
            />

            {/* Search Result Dropdown */}
            {searchResults.length > 0 && (
                <ul className="absolute top-[100%] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto z-10">
                    {searchResults.map((anime, index) => (
                        <li
                            key={index}
                            onClick={() => {
                                setList({ ...list, name: anime.title });
                            }}
                            className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100"
                        >
                            <img src={anime.images.jpg.image_url} alt="" className="w-10 h-14 rounded" />
                            <div>
                                <p className="font-semibold">{anime.title}</p>
                                <p className="text-xs text-gray-500">
                                    {anime.type} • {anime.episodes || "?"} eps • ⭐ {anime.score || "N/A"}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <div className="select flex flex-col md:flex-row justify-between gap-4 md:gap-0">
                <div className="relative w-full md:w-[32%]">
                    <select
                        value={list.status}
                        onChange={handelChange}
                        name="status"
                        required
                        defaultValue=""
                        className="hover:duration-500 hover:scale-105 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E67E22] outline-none transition w-full bg-white text-gray-800 appearance-none cursor-pointer"
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
                    className="hover:duration-500 hover:scale-105 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E67E22] outline-none transition w-full md:w-[32%]"
                    autoComplete="off"
                />

                <input
                    value={list.movies}
                    onChange={handelChange}
                    type="number"
                    name="movies"
                    placeholder="Movies"
                    className="hover:duration-500 hover:scale-105 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E67E22] outline-none transition w-full md:w-[32%]"
                    autoComplete="off"
                />
            </div>

            <button
                onClick={saveAnime}
                className="hover:duration-500 hover:scale-105 bg-gradient-to-r from-[#E67E22] to-[#f39c12] hover:opacity-90 transition rounded-full my-4 px-8 py-2 w-full text-white flex justify-center items-center gap-1 font-bold shadow-md"
            >
                <span className="material-symbols-outlined">save</span>SAVE
            </button>
        </div>
    );
};

export default AnimeForm;
