import axios from "axios";

const url = "http://localhost:5000/anime";

export const fetchAnime = () => axios.get(url);