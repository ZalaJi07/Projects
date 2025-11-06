import axios from "axios";

const url = "http://localhost:5000/anime";

export const fetchAnimes = () => axios.get(url);
export const createAnime = (newAnime) => axios.post(url, newAnime);
export const updateAnime = (id, updatedAnime) => axios.patch(`${url}/${id}`, updatedAnime);
export const deleteAnime = (id) => axios.delete(`${url}/${id}`);
export const increaseEp = (id) => axios.patch(`${url}/${id}/increaseEp`);