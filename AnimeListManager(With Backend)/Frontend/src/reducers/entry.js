export default (animes = [] , action) => {
    switch (action.type) {
        case "FETCH_ALL":
            return action.payload;
        case "CREATE":
            return [...animes, action.payload];
        case "INCREASE_EP":
        case "UPDATE":
            return animes.map((anime) => (anime._id === action.payload._id ? action.payload : anime));
        case "DELETE":
            return animes.filter((anime) => anime._id !== action.payload)
        default:
            return animes;
    }
}