import { FETCHALL, CREATE, UPDATE, DELETE, INCREASE_EP, DECREASE_EP } from '../constants/actionTypes'

const initialState = {
    animes: [],
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
};

export default (state = initialState, action) => {
    switch (action.type) {
        case FETCHALL:
            return {
                ...state,
                animes: action.payload.data,
                currentPage: action.payload.currentPage,
                totalPages: action.payload.totalPages,
                totalItems: action.payload.totalItems,
            };
        case CREATE:
            return { ...state, animes: [...state.animes, action.payload], totalItems: state.totalItems + 1 };
        case DECREASE_EP:
        case INCREASE_EP:
        case UPDATE:
            return { ...state, animes: state.animes.map((anime) => (anime._id === action.payload._id ? action.payload : anime)) };
        case DELETE: {
            const newTotal = Math.max(0, state.totalItems - 1);
            return {
                ...state,
                animes: state.animes.filter((anime) => anime._id !== action.payload),
                totalItems: newTotal,
                // Recalculate so the pagination bar never shows a page that no longer exists.
                // Page size is fixed at 20 throughout the app.
                totalPages: Math.max(1, Math.ceil(newTotal / 20)),
            };
        }
        case 'LOGOUT':
            return initialState;
        default:
            return state;
    }
}