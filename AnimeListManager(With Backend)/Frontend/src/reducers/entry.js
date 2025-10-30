export default (animes = [] , action) => {
    switch (action.type) {
        case "FETCH_ALL":
            return action.payload;
        case "CREATE":
            return [...animes, action.payload];
        case "UPDATE":
            return animes.map((anime) => (anime._id === action.payload._id ? action.payload : anime));
        default:
            return animes;
    }
}