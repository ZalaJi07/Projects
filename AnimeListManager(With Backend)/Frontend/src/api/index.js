import axios from "axios";

// const url = "https://anime-list-manager-server.onrender.com/anime";
const API = axios.create({ baseURL: 'http://localhost:5000' });

// Attach JWT token to every request
API.interceptors.request.use((req) => {
    const profile = localStorage.getItem('profile');
    if (profile) {
        const { token } = JSON.parse(profile);
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

// Anime API (per-user, authenticated)
export const fetchAnimes = () => API.get("/userAnime");
export const createAnime = (newAnime) => API.post("/userAnime", newAnime);
export const updateAnime = (id, updatedAnime) => API.patch(`/userAnime/${id}`, updatedAnime);
export const deleteAnime = (id) => API.delete(`/userAnime/${id}`);
export const increaseEp = (id) => API.patch(`/userAnime/${id}/increaseEp`);
export const decreaseEp = (id) => API.patch(`/userAnime/${id}/decreaseEp`);

// Auth API
export const signIn = (formData) => API.post("/user/signin", formData);
export const signUp = (formData) => API.post("/user/signup", formData);
export const googleSignIn = (token) => API.post("/user/googleSignIn", { token });