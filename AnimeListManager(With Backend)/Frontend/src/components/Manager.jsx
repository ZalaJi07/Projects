import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import ManagerHeader from "./ManagerHeader";
import AnimeForm from "./AnimeForm";
import AnimeTable from "./AnimeTable";

import { useDispatch } from "react-redux";
import { createAnime } from "../actions/entry";

const Manager = () => {
  const [list, setList] = useState({ name: "", status: "", episodes: "", movies: "" });
  const [animeArray, setAnimeArray] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    let animes = localStorage.getItem("animes");
    if (animes) setAnimeArray(JSON.parse(animes));
  }, []);

  const saveAnime = (e) => {
    e.preventDefault();

    dispatch(createAnime(list));
    // if (list.name && list.status && list.episodes && list.movies) {
    //   const newList = [...animeArray, { ...list, id: uuidv4() }];
    //   setAnimeArray(newList);
    //   localStorage.setItem("animes", JSON.stringify(newList));
      setList({ name: "", status: "", episodes: "", movies: "" });
    // }
  };

  const editAnime = (id) => {
    setList(animeArray.find((item) => item.id === id));
    setAnimeArray(animeArray.filter((item) => item.id !== id));
  };

  const deleteAnime = (id) => {
    const updated = animeArray.filter((item) => item.id !== id);
    setAnimeArray(updated);
    localStorage.setItem("animes", JSON.stringify(updated));
  };

  const decreaseEp = (id) => {
    const updated = animeArray.map((item) =>
      item.id === id ? { ...item, episodes: (parseInt(item.episodes) - 1).toString() } : item
    );
    setAnimeArray(updated);
    localStorage.setItem("animes", JSON.stringify(updated));
  };

  const increaseEp = (id) => {
    const updated = animeArray.map((item) =>
      item.id === id ? { ...item, episodes: (parseInt(item.episodes) + 1).toString() } : item
    );
    setAnimeArray(updated);
    localStorage.setItem("animes", JSON.stringify(updated));
  };

  const handelChange = (e) => setList({ ...list, [e.target.name]: e.target.value });

  const handleSearch = async (input) => {
    setList({ ...list, name: input });
    if (input.length > 0) {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${input}&limit=10`);
        const data = await res.json();
        if (data.data) {
          const filtered = data.data.filter((a) =>
            a.title.toLowerCase().startsWith(input.toLowerCase())
          );
          setSearchResults(filtered.slice(0, 10));
        }
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="flex justify-center bg-[#ECF0F1] flex-grow relative max-h-[83.6vh]">
      <div className="w-[90vw] md:w-[60vw]">
        <ManagerHeader />
        <AnimeForm
          list={list}
          handelChange={handelChange}
          handleSearch={handleSearch}
          saveAnime={saveAnime}
          searchResults={searchResults}
          setList={setList}
        />
        <div className="body overflow-y-auto max-h-[40vh] rounded-lg shadow-inner">
          <AnimeTable
            animeArray={animeArray}
            decreaseEp={decreaseEp}
            increaseEp={increaseEp}
            editAnime={editAnime}
            deleteAnime={deleteAnime}
          />
        </div>
      </div>
    </div>
  );
};

export default Manager;
