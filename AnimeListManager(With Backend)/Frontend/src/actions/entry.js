import * as api from '../api'

// Action Creators
export const getAnimes = () => async (dispatch) => {
    try {
        const { data } = await api.fetchAnimes();

        dispatch({ type: "FETCH_ALL", payload: data });
    } catch (error) {
        console.log(error.message);
    }

    // const action = { type: "FATCH_ALL", payload: [] }
    // dispatch(action);
}

export const createAnime = (anime) => async (dispatch) => {
    try {
        const { data } = await api.createAnime(anime);

        dispatch({ type: "CREATE", payload: data})
    } catch {
        console.log(error.message);
    }
}

export const updateAnime = (id, anime) => async (dispatch) => {
    try {
        const { data } = await api.updateAnime(id, anime);

        dispatch({ type: "UPDATE", payload: data})
    } catch (error) {
        console.log(error.message);
    }
}  