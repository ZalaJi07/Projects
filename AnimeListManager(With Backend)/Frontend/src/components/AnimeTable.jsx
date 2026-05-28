import { useDispatch } from "react-redux";
import { deleteAnime, increaseEp, decreaseEp } from "../actions/entry.js";
import { useState, useEffect } from "react";
import { getAnimeDetails } from "../utils/jikanCache.js";

// ── Delete Confirmation Modal ──
const DeleteConfirmModal = ({ item, onConfirm, onCancel }) => {
  // Esc key closes the modal
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 animate-[fadeIn_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-red-500 text-xl">delete</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Remove from list?</h3>
            <p className="text-sm text-gray-500 mt-0.5 break-words">"{item.name}"</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const AnimeImage = ({ malId, size = "sm" }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (malId) {
      setImgError(false);
      getAnimeDetails(malId).then((details) => {
        if (details) setImageUrl(details.images?.jpg?.small_image_url);
      });
    }
  }, [malId]);

  const sizeClass = size === "md" ? "w-12 h-16" : "w-8 h-11";

  if (!malId || !imageUrl || imgError) {
    return (
      <div className={`${sizeClass} rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400`}>
        <span className="material-symbols-outlined text-sm">image</span>
      </div>
    );
  }

  return <img src={imageUrl} alt="" className={`${sizeClass} rounded object-cover shadow-sm`} onError={() => setImgError(true)} />;
};

const AnimeDetailModal = ({ anime, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Esc key closes the modal
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

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
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-auto p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 pr-2">{anime.name}</h3>
          <span className="material-symbols-outlined cursor-pointer text-gray-400 hover:text-gray-600 flex-shrink-0" onClick={onClose}>close</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-3 border-[#E67E22] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : details ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 sm:gap-4">
              <img src={details.images?.jpg?.image_url} alt={anime.name} className="w-24 sm:w-28 h-36 sm:h-40 rounded-lg object-cover shadow flex-shrink-0" />
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
          {anime.entryType === "movie" ? (
            <p>Type: <span className="font-semibold">Movie</span></p>
          ) : (
            <p>Your status: <span className="font-semibold">{anime.status}</span> • Ep: {anime.episodes} • Movies: {anime.movies}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colorMap = {
    Finished: "bg-green-100 text-green-600",
    Watching: "bg-blue-100 text-blue-600",
    Dropped: "bg-red-100 text-red-600",
    CaughtUp: "bg-purple-100 text-purple-600",
    OnHold: "bg-yellow-100 text-yellow-600",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${colorMap[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

// ── Mobile card layout ──
const AnimeCard = ({ item, readOnly, setCurrentId, dispatch, onSelect, onDelete, mode }) => {
  const isMovie = mode === "movie";

  return (
    <div
      className="bg-orange-50 rounded-lg p-3 flex gap-3 shadow-sm hover:shadow-md transition cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <AnimeImage malId={item.malId} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
        {!isMovie && (
          <>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={item.status} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <span className="font-medium">Ep:</span>
                {readOnly || (item.status === "Dropped" || item.status === "Finished") ? (
                  <span>{item.episodes}</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-sm cursor-pointer hover:text-[#E67E22]"
                      onClick={() => dispatch(decreaseEp(item._id))}
                    >remove</span>
                    <span className="font-semibold min-w-[1.5rem] text-center">{item.episodes}</span>
                    <span
                      className="material-symbols-outlined text-sm cursor-pointer hover:text-[#E67E22]"
                      onClick={() => dispatch(increaseEp(item._id))}
                    >add</span>
                  </div>
                )}
              </div>
              <span><span className="font-medium">Movies:</span> {item.movies}</span>
            </div>
          </>
        )}
      </div>
      {!readOnly && (
        <div className="flex flex-col gap-1 justify-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <span
            className="material-symbols-outlined text-[#ec7c19] text-xl hover:scale-110 cursor-pointer"
            onClick={() => setCurrentId(item._id)}
          >edit</span>
          <span
            className="material-symbols-outlined text-[#ec7c19] text-xl hover:scale-110 cursor-pointer"
            onClick={() => onDelete(item)}
          >delete</span>
        </div>
      )}
    </div>
  );
};

// ── Desktop table row for Series ──
const SeriesRow = ({ item, readOnly, setCurrentId, dispatch, onSelect, onDelete }) => (
  <tr className="hover:bg-orange-200 transition cursor-pointer" onClick={() => onSelect(item)}>
    <td className="text-center border border-white py-1 px-1 w-[2.8rem]">
      <AnimeImage malId={item.malId} />
    </td>
    <td className="text-center border border-white py-1 break-words min-w-[14vw] max-w-[22vw]">
      {item.name}
    </td>
    <td className="text-center border border-white py-1">
      <StatusBadge status={item.status} />
    </td>
    <td className="text-center border border-white py-1 break-words px-2" onClick={(e) => e.stopPropagation()}>
      {readOnly ? (
        item.episodes
      ) : (
        <div className={`flex items-center ${(item.status !== "Dropped" && item.status !== "Finished") ? "justify-between" : "justify-center"}`}>
          {(item.status !== "Dropped" && item.status !== "Finished") ? <span className="material-symbols-outlined cursor-pointer" onClick={() => dispatch(decreaseEp(item._id))}>remove</span> : null}
          {item.episodes}
          {(item.status !== "Dropped" && item.status !== "Finished") ? <span className="material-symbols-outlined cursor-pointer" onClick={() => dispatch(increaseEp(item._id))}>add</span> : null}
        </div>
      )}
    </td>
    <td className="text-center border border-white py-1 break-words">
      {item.movies}
    </td>
    {!readOnly && (
      <td className="text-center border py-1 px-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1 justify-center">
          <span className="material-symbols-outlined text-[#ec7c19] hover:scale-110 cursor-pointer" onClick={() => setCurrentId(item._id)}>edit</span>
          <span className="material-symbols-outlined text-[#ec7c19] hover:scale-110 cursor-pointer" onClick={() => onDelete(item)}>delete</span>
        </div>
      </td>
    )}
  </tr>
);

// ── Desktop table row for Movies (simpler) ──
const MovieRow = ({ item, readOnly, setCurrentId, dispatch, onSelect, onDelete }) => (
  <tr className="hover:bg-orange-200 transition cursor-pointer" onClick={() => onSelect(item)}>
    <td className="text-center border border-white py-1 px-1 w-[2.8rem]">
      <AnimeImage malId={item.malId} />
    </td>
    <td className="text-center border border-white py-1 break-words">
      {item.name}
    </td>
    {!readOnly && (
      <td className="text-center border py-1 px-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1 justify-center">
          <span className="material-symbols-outlined text-[#ec7c19] hover:scale-110 cursor-pointer" onClick={() => setCurrentId(item._id)}>edit</span>
          <span className="material-symbols-outlined text-[#ec7c19] hover:scale-110 cursor-pointer" onClick={() => onDelete(item)}>delete</span>
        </div>
      </td>
    )}
  </tr>
);

const AnimeTable = ({ animes, setCurrentId, readOnly = false, mode = "series" }) => {
  const dispatch = useDispatch();
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const isMovie = mode === "movie";

  const handleDelete = (item) => setDeleteTarget(item);
  const confirmDeleteAction = () => {
    if (deleteTarget) {
      dispatch(deleteAnime(deleteTarget._id));
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {/* Desktop table — hidden on mobile */}
      <table className="table-auto w-full shadow-lg rounded-lg overflow-hidden mb-2 hidden md:table">
        <thead className="bg-[#E67E22] text-white">
          {isMovie ? (
            <tr>
              <th className="border border-white p-2 w-8"></th>
              <th className="border border-white p-2">NAME</th>
              {!readOnly && <th className="border border-white p-2">ACTION</th>}
            </tr>
          ) : (
            <tr>
              <th className="border border-white p-2 w-8"></th>
              <th className="border border-white p-2">NAME</th>
              <th className="border border-white p-2">STATUS</th>
              <th className="border border-white p-2">EPISODE</th>
              <th className="border border-white p-2">MOVIE</th>
              {!readOnly && <th className="border border-white p-2">ACTION</th>}
            </tr>
          )}
        </thead>
        <tbody className="bg-orange-100">
          {animes.map((item) =>
            isMovie ? (
              <MovieRow
                key={item._id}
                item={item}
                readOnly={readOnly}
                setCurrentId={setCurrentId}
                dispatch={dispatch}
                onSelect={setSelectedAnime}
                onDelete={handleDelete}
              />
            ) : (
              <SeriesRow
                key={item._id}
                item={item}
                readOnly={readOnly}
                setCurrentId={setCurrentId}
                dispatch={dispatch}
                onSelect={setSelectedAnime}
                onDelete={handleDelete}
              />
            )
          )}
        </tbody>
      </table>

      {/* Mobile card list — hidden on desktop */}
      <div className="flex flex-col gap-2 md:hidden">
        {animes.map((item) => (
          <AnimeCard
            key={item._id}
            item={item}
            readOnly={readOnly}
            setCurrentId={setCurrentId}
            dispatch={dispatch}
            onSelect={setSelectedAnime}
            onDelete={handleDelete}
            mode={mode}
          />
        ))}
      </div>

      {selectedAnime && <AnimeDetailModal anime={selectedAnime} onClose={() => setSelectedAnime(null)} />}
      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget}
          onConfirm={confirmDeleteAction}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
};

export default AnimeTable;

