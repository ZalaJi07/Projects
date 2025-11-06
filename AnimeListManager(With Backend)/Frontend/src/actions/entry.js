import { FETCHALL, CREATE, UPDATE, DELETE, INCREASE_EP, DECREASE_EP  } from '../constants/actionTypes'
import * as api from '../api'

// Action Creators
export const getAnimes = () => async (dispatch) => {
    try {
        const { data } = await api.fetchAnimes();

        dispatch({ type: FETCHALL, payload: data });
    } catch (error) {
        console.log(error.message);
    }

    // const action = { type: "FATCH_ALL", payload: [] }
    // dispatch(action);
}

export const createAnime = (anime) => async (dispatch) => {
    try {
        const { data } = await api.createAnime(anime);

        dispatch({ type: CREATE, payload: data})
    } catch {
        console.log(error.message);
    }
}

export const updateAnime = (id, anime) => async (dispatch) => {
    try {
        const { data } = await api.updateAnime(id, anime);

        dispatch({ type: UPDATE, payload: data})
    } catch (error) {
        console.log(error.message);
    }
}  

export const deleteAnime = (id) => async (dispatch) => {
    try {
        await api.deleteAnime(id);

        dispatch({ type: DELETE, payload: id})
    } catch (error) {
        console.log(error.message);
    }
}

export const increaseEp = (id) => async (dispatch) => {
    try {
        const { data } = await api.increaseEp(id);

        dispatch({ type: INCREASE_EP, payload: data})
    } catch (error) {
        console.log(error.message);
    }
}

export const decreaseEp = (id) => async (dispatch) => {
    try {
        const { data } = await api.decreaseEp(id);

        dispatch({ type: DECREASE_EP, payload: data})
    } catch (error) {
        console.log(error.message);
    }
}