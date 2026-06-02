import axios from "axios";
import toast from "react-hot-toast";


const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Attach JWT token to every request
API.interceptors.request.use((req) => {
    const profile = localStorage.getItem('profile');
    if (profile) {
        const { token } = JSON.parse(profile);
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

// Auto-logout on 401 (expired/invalid token)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't auto-logout for auth routes (wrong password etc.) or if already on auth page
            const url = error.config?.url || '';
            const isAuthRoute = url.includes('/user/signin') || url.includes('/user/signup') || url.includes('/user/googleSignIn');
            if (!isAuthRoute && window.location.pathname !== '/auth') {
                localStorage.removeItem('profile');
                toast.error("Session expired. Please log in again.", { id: "session-expired" });
                setTimeout(() => {
                    window.location.href = '/auth';
                }, 1500);
            }
        }
        return Promise.reject(error);
    }
);

// Anime API (per-user, authenticated, with pagination/search/filter/sort)
export const fetchAnimes = (page = 1, limit = 20, search = '', status = '', sort = 'createdAt', order = 'desc', entryType = 'series') =>
    API.get(`/userAnime?page=${page}&limit=${limit}&search=${search}&status=${status}&sort=${sort}&order=${order}&entryType=${entryType}`);
export const fetchAllAnimes = () => API.get('/userAnime/all');   // for export — no pagination
export const createAnime = (newAnime) => API.post("/userAnime", newAnime);
export const updateAnime = (id, updatedAnime) => API.patch(`/userAnime/${id}`, updatedAnime);
export const deleteAnime = (id) => API.delete(`/userAnime/${id}`);
export const increaseEp = (id) => API.patch(`/userAnime/${id}/increaseEp`);
export const decreaseEp = (id) => API.patch(`/userAnime/${id}/decreaseEp`);

// Auth API
export const signIn = (formData) => API.post("/user/signin", formData);
export const signUp = (formData) => API.post("/user/signup", formData);
export const googleSignIn = (token) => API.post("/user/googleSignIn", { token });
export const updateProfile = (data) => API.patch("/user/profile", data);


// Public list API (no auth needed)
export const fetchPublicList = (username, page = 1, limit = 20, search = '', status = '', sort = 'createdAt', order = 'desc', entryType = 'series') =>
    API.get(`/list/${username}?page=${page}&limit=${limit}&search=${search}&status=${status}&sort=${sort}&order=${order}&entryType=${entryType}`);

// Admin API (admin-only, blocked server-side for non-admins)
export const adminFetchUsers = (page = 1, limit = 20, search = '') =>
    API.get(`/admin/users?page=${page}&limit=${limit}&search=${search}`);
export const adminDisableUser = (id) => API.patch(`/admin/users/${id}/disable`);
export const adminRemoveUser = (id) => API.delete(`/admin/users/${id}`);