import { useState, useEffect, useRef } from "react";
import ManagerHeader from "./ManagerHeader";
import AnimeForm from "./AnimeForm";
import AnimeTable from "./AnimeTable";

import { useDispatch, shallowEqual } from "react-redux";
import { createAnime, updateAnime } from "../actions/entry";
import { useSelector } from "react-redux";
// import { set } from "mongoose";

const Manager = ({ currentId, setCurrentId }) => {
  const animes = useSelector((state) => state.entry, shallowEqual);
  // console.log(animes);

  const [list, setList] = useState({ name: "", status: "", episodes: "", movies: "" });
  const dispatch = useDispatch();

  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debounceRef = useRef(null);

  const handleSearchChange = (input) => {
    setSearchTerm(input);
  };

  // Debounced API call
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // only search if 2+ chars
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
          // filter for better matching titles
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
    }, 400); // wait 400ms after user stops typing

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
      setList({ name: "", status: "", episodes: "", movies: "" });
    }
  };

  const handelChange = (e) => setList({ ...list, [e.target.name]: e.target.value });

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
        <div className="body overflow-y-auto max-h-[40vh]">
          <AnimeTable
            animes={animes}
            setCurrentId={setCurrentId}
          />
        </div>
      </div>
    </div>
  );
};

export default Manager;
