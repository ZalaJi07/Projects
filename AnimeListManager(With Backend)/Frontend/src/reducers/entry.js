export default (animes = [] , action) => {
    switch (action.type) {
        case "FETCH_ALL":
            return action.payload;
        case "CREATE":
            return [...animes, action.payload];
        default:
            return animes;
    }
}