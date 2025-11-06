import { useDispatch } from "react-redux";
import { deleteAnime, increaseEp } from "../actions/entry.js";

const AnimeTable = ({ animes, decreaseEp, editAnime, deletedAnime, setCurrentId }) => {
  const dispatch = useDispatch();

  if (animes.length === 0)
    return <div>No List! Please add your Anime 😊</div>;

  return (
    <table className="table-auto w-full shadow-lg rounded-lg overflow-hidden mb-8">
      <thead className="bg-[#E67E22] text-white">
        <tr>
          <th className="border border-white p-2">NAME</th>
          <th className="border border-white p-2">STATUS</th>
          <th className="border border-white p-2">EPISODE</th>
          <th className="border border-white p-2">MOVIE</th>
          <th className="border border-white p-2">ACTION</th>
        </tr>
      </thead>
      <tbody className="bg-orange-100">
        {animes.map((item) => (
          <tr key={item._id} className="hover:bg-orange-200 transition">
            <td className="text-center border border-white py-1 break-words min-w-[18vw] max-w-[25vw]">
              {item.name}
            </td>
            <td className="text-center border border-white py-1">
              <span
                className={`px-2 py-1 text-xs rounded-full font-semibold ${
                  item.status === "Finished"
                    ? "bg-green-100 text-green-600"
                    : item.status === "Watching"
                    ? "bg-blue-100 text-blue-600"
                    : item.status === "Dropped"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {item.status}
              </span>
            </td>
            <td className="text-center border border-white py-1 break-words px-2">
              <div className="flex justify-between items-center">
                <span
                  className="material-symbols-outlined cursor-pointer"
                  onClick={() => decreaseEp(item.id)}
                >
                  remove
                </span>
                {item.episodes}
                <span
                  className="material-symbols-outlined cursor-pointer"
                  onClick = {() => dispatch(increaseEp(item._id))}
                  // onClick={() => increaseEp(item.id)}
                >
                  add
                </span>
              </div>
            </td>
            <td className="text-center border border-white py-1 break-words">
              {item.movies}
            </td>
            <td className="text-center border py-1 px-2">
              <div className="flex gap-1 justify-center">
                <span
                  className="material-symbols-outlined text-[#ec7c19] hover:scale-110 cursor-pointer"
                  // onClick={() => editAnime(item.id)}
                  onClick={() => setCurrentId(item._id)}
                >
                  edit
                </span>
                <span
                  className="material-symbols-outlined text-[#ec7c19] hover:scale-110 cursor-pointer"
                  onClick={() => dispatch(deleteAnime(item._id))}
                  // onClick={() => deleteAnime(item.id)}
                >
                  delete
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AnimeTable;
