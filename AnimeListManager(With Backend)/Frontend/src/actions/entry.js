import { FETCHALL, CREATE, UPDATE, DELETE, INCREASE_EP, DECREASE_EP  } from '../constants/actionTypes'
import * as api from '../api'
import toast from 'react-hot-toast'

// Action Creators
export const getAnimes = (page, limit, search, status, sort, order, entryType = 'series') => async (dispatch) => {
    try {
        const { data } = await api.fetchAnimes(page, limit, search, status, sort, order, entryType);

        dispatch({ type: FETCHALL, payload: data });
    } catch (error) {
        if (error.response?.status !== 401) {
            toast.error("Failed to load anime list.");
        }
    }
}

export const createAnime = (anime) => async (dispatch) => {
    try {
        const { data } = await api.createAnime(anime);

        dispatch({ type: CREATE, payload: data })
        toast.success(`"${data.name}" added to your list!`);
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to add anime.");
    }
}

export const updateAnime = (id, anime) => async (dispatch) => {
    try {
        const { data } = await api.updateAnime(id, anime);

        dispatch({ type: UPDATE, payload: data })
        toast.success(`"${data.name}" updated!`);
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update anime.");
    }
}  

export const deleteAnime = (id) => async (dispatch) => {
    try {
        await api.deleteAnime(id);

        dispatch({ type: DELETE, payload: id })
        toast.success("Anime removed from your list.");
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete anime.");
    }
}

export const increaseEp = (id) => async (dispatch) => {
    try {
        const { data } = await api.increaseEp(id);

        dispatch({ type: INCREASE_EP, payload: data })
    } catch (error) {
        toast.error("Failed to update episodes.");
    }
}

export const decreaseEp = (id) => async (dispatch) => {
    try {
        const { data } = await api.decreaseEp(id);

        dispatch({ type: DECREASE_EP, payload: data })
    } catch (error) {
        toast.error("Failed to update episodes.");
    }
}