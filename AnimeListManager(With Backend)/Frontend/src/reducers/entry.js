import { FETCHALL, CREATE, UPDATE, DELETE, INCREASE_EP, DECREASE_EP  } from '../constants/actionTypes'

export default (animes = [] , action) => {
    switch (action.type) {
        case FETCHALL:
            return action.payload;
        case CREATE:
            return [...animes, action.payload];
        case DECREASE_EP:
        case INCREASE_EP:
        case UPDATE:
            return animes.map((anime) => (anime._id === action.payload._id ? action.payload : anime));
        case DELETE:
            return animes.filter((anime) => anime._id !== action.payload)
        default:
            return animes;
    }
}