import { useDispatch } from "react-redux";
import { deleteAnime, increaseEp, decreaseEp } from "../actions/entry.js";
import { useState, useEffect } from "react";
import { getAnimeDetails } from "../utils/jikanCache.js";

const AnimeImage = ({ malId }) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (malId) {
      getAnimeDetails(malId).then((details) => {
        if (details) setImageUrl(details.images?.jpg?.small_image_url);
      });
    }
  }, [malId]);

  if (!malId || !imageUrl) {
    return (
      <div className="w-8 h-11 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">
        ?
      </div>
    );
  }

  return <img src={imageUrl} alt="" className="w-8 h-11 rounded object-cover shadow-sm" />;
};

const AnimeDetailModal = ({ anime, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (anime?.malId) {
      getAnimeDetails(anime.malId).then((data) => {
        setDetails(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [anime]);

  if (!anime) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-800">{anime.name}</h3>
          <span className="material-symbols-outlined cursor-pointer text-gray-400 hover:text-gray-600" onClick={onClose}>close</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-3 border-[#E67E22] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : details ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <img src={details.images?.jpg?.image_url} alt={anime.name} className="w-28 h-40 rounded-lg object-cover shadow" />
              <div className="flex flex-col gap-1 text-sm">
                <p><span className="font-semibold text-gray-600">Score:</span> ⭐ {details.score || "N/A"}</p>
                <p><span className="font-semibold text-gray-600">Rank:</span> #{details.rank || "N/A"}</p>
                <p><span className="font-semibold text-gray-600">Type:</span> {details.type}</p>
                <p><span className="font-semibold text-gray-600">Episodes:</span> {details.episodes || "?"}</p>
                <p><span className="font-semibold text-gray-600">Status:</span> {details.status}</p>
                <p><span className="font-semibold text-gray-600">Year:</span> {details.year || "N/A"}</p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-600 mb-1">Synopsis</p>
              <p className="text-sm text-gray-700 leading-relaxed">{details.synopsis || "No synopsis available."}</p>
            </div>
            {details.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {details.genres.map((g) => (
                  <span key={g.mal_id} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">{g.name}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No additional details available for manually added anime.</p>
        )}

        <div className="mt-4 pt-3 border-t text-sm text-gray-500">
          <p>Your status: <span className="font-semibold">{anime.status}</span> • Ep: {anime.episodes} • Movies: {anime.movies}</p>
        </div>
      </div>
    </div>
  );
};

const AnimeTable = ({ animes, setCurrentId, readOnly = false }) => {
  const dispatch = useDispatch();
  const [selectedAnime, setSelectedAnime] = useState(null);

  return (
    <>
      <table className="table-auto w-full shadow-lg rounded-lg overflow-hidden mb-2">
        <thead className="bg-[#E67E22] text-white">
          <tr>
            <th className="border border-white p-2 w-8"></th>
            <th className="border border-white p-2">NAME</th>
            <th className="border border-white p-2">STATUS</th>
            <th className="border border-white p-2">EPISODE</th>
            <th className="border border-white p-2">MOVIE</th>
            {!readOnly && <th className="border border-white p-2">ACTION</th>}
          </tr>
        </thead>
        <tbody className="bg-orange-100">
          {animes.map((item) => (
            <tr key={item._id} className="hover:bg-orange-200 transition cursor-pointer" onClick={() => setSelectedAnime(item)}>
              <td className="text-center border border-white py-1 px-1">
                <AnimeImage malId={item.malId} />
              </td>
              <td className="text-center border border-white py-1 break-words min-w-[14vw] max-w-[22vw]">
                {item.name}
              </td>
              <td className="text-center border border-white py-1">
                <span
                  className={`px-2 py-1 text-xs rounded-full font-semibold ${item.status === "Finished"
                    ? "bg-green-100 text-green-600"
                    : item.status === "Watching"
                      ? "bg-blue-100 text-blue-600"
                      : item.status === "Dropped"
                        ? "bg-red-100 text-red-600"
                        : item.status === "CaughtUp"
                          ? "bg-purple-100 text-purple-600"
                          : item.status === "OnHold"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {item.status}
                </span>
              </td>
              <td className="text-center border border-white py-1 break-words px-2" onClick={(e) => e.stopPropagation()}>
                {readOnly ? (
                  item.episodes
                ) : (
                  <div className="flex justify-between items-center">
                    <span
                      className="material-symbols-outlined cursor-pointer"
                      onClick={() => dispatch(decreaseEp(item._id))}
                    >
                      remove
                    </span>
                    {item.episodes}
                    <span
                      className="material-symbols-outlined cursor-pointer"
                      onClick={() => dispatch(increaseEp(item._id))}
                    >
                      add
                    </span>
                  </div>
                )}
              </td>
              <td className="text-center border border-white py-1 break-words">
                {item.movies}
              </td>
              {!readOnly && (
                <td className="text-center border py-1 px-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1 justify-center">
                    <span
                      className="material-symbols-outlined text-[#ec7c19] hover:scale-110 cursor-pointer"
                      onClick={() => setCurrentId(item._id)}
                    >
                      edit
                    </span>
                    <span
                      className="material-symbols-outlined text-[#ec7c19] hover:scale-110 cursor-pointer"
                      onClick={() => dispatch(deleteAnime(item._id))}
                    >
                      delete
                    </span>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {selectedAnime && <AnimeDetailModal anime={selectedAnime} onClose={() => setSelectedAnime(null)} />}
    </>
  );
};

export default AnimeTable;
