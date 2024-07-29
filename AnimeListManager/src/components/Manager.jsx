import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid';

const Manager = () => {

    const [list, setList] = useState({ name: "", status: "", episodes: "", movies: "" });
    const [animeArray, setAnimeArray] = useState([])

    useEffect(() => {
        let animes = localStorage.getItem("animes");
        if (animes) {
            setAnimeArray(JSON.parse(animes))
        }
    }, [])


    const saveAnime = () => {
        if (list.name.length > 1 && list.status && list.episodes.length !== 0 && list.movies.length !== 0) {
            setAnimeArray([...animeArray, { ...list, id: uuidv4() }]);
            localStorage.setItem("animes", JSON.stringify([...animeArray, { ...list, id: uuidv4() }]));
            setList({ name: "", status: "", episodes: "", movies: "" });
            
            let animes = localStorage.getItem("animes");
            const animesArray = animes ? JSON.parse(animes) : [];

            const lengthOfAnimes = animesArray.length;

            console.log(lengthOfAnimes);
        }
    }

    const editAnime = (id) => {
        setList(animeArray.filter(item => item.id === id)[0]);
        setAnimeArray(animeArray.filter(item => item.id !== id));
    }

    const deleteAnime = (id) => {
        setAnimeArray(animeArray.filter(item => item.id !== id));
        localStorage.setItem("animes", JSON.stringify(animeArray.filter(item => item.id !== id)));
    }

    const decreaseEp = (id) => {
        const updatedArray = animeArray.map(item => {
            if (item.id === id) {
                const updatedEpisodes = parseInt(item.episodes) - 1;
                return { ...item, episodes: updatedEpisodes.toString() };
            }
            return item;
        });
        setAnimeArray(updatedArray);
        localStorage.setItem("animes", JSON.stringify(updatedArray));
    }

    const increaseEp = (id) => {
        const updatedArray = animeArray.map(item => {
            if (item.id === id) {
                const updatedEpisodes = parseInt(item.episodes) + 1;
                return { ...item, episodes: updatedEpisodes.toString() };
            }
            return item;
        });
        setAnimeArray(updatedArray);
        localStorage.setItem("animes", JSON.stringify(updatedArray));
    }

    const handelChange = (e) => {
        setList({ ...list, [e.target.name]: e.target.value })
    }


    return (
        <>

            <div className="flex justify-center bg-[#ECF0F1] flex-grow">
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
                {/* <div className="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]"></div>  */}


                <div className='w-[90vw] md:w-[60vw]' >
                    <div className="heading m-4">
                        <h1 className='text-4xl font-bold text-center'>
                            <span className='text-[#E67E22]'>Anime</span><span>ListManager</span>
                        </h1>

                        <p className='text-[#f48729] text-lg text-center'>Create Your Anime List</p>
                    </div>

                    <div className="input pb-4">
                        <input value={list.name} onChange={handelChange} type="text" name="name" id="" placeholder='Anime Name' className='hover:duration-500 hover:scale-105 w-full rounded-xl px-2 py-1 my-4' autoComplete="off" />

                        <div className="select flex flex-col md:flex-row justify-between gap-4 md:gap-0">
                            <select value={list.status} onChange={handelChange} id="status" name="status" required className='hover:duration-500 hover:scale-105 rounded-xl px-2 py-1 md:w-[32%]' defaultValue="">
                                <option value="" disabled>Status</option>
                                <option value="Finished">Finished</option>
                                <option value="CaughtUp">CaughtUp</option>
                                <option value="Watching">Watching</option>
                                <option value="OnHold">OnHold</option>
                                <option value="Pendinng">Pendinng</option>
                                <option value="Dropped">Dropped</option>
                            </select>

                            <input value={list.episodes} onChange={handelChange} type="number" name="episodes" id="episode" placeholder='Episodes' className='hover:duration-500 hover:scale-105 rounded-xl px-2 py-1 md:w-[32%]' autoComplete="off" />

                            <input value={list.movies} onChange={handelChange} type="number" name="movies" id="movies" placeholder='Movies' className='hover:duration-500 hover:scale-105 rounded-xl px-2 py-1 md:w-[32%]' autoComplete="off" />
                        </div>

                        <button onClick={saveAnime} className='bg-[#E67E22] hover:duration-500 hover:scale-105 active:bg-[#e49148] rounded-full my-4 px-8 py-2 w-full border border-[#bc5e0d] text-white flex justify-center items-center gap-1 font-bold'><span className="material-symbols-outlined">save</span>SAVE</button>
                    </div>

                    <div className="body overflow-auto">
                        {animeArray.length === 0 && <div>No List! Please! Add your Anime</div>}
                        {animeArray.length !== 0 && <table className="table-auto border border-collapse rounded-lg overflow-hidden w-full text-black border-black mb-8">
                            <thead className="bg-[#E67E22] text-white">
                                <tr>
                                    <th className="border border-white p-2">NAME</th>
                                    <th className="border border-white p-2">STATUS</th>
                                    <th className="border border-white p-2">EPISODE</th>
                                    <th className="border border-white p-2">MOVIE</th>
                                    <th className="border border-white p-2">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className='bg-orange-100'>
                                {animeArray.map((item, index) => {
                                    return <tr key={index}>
                                        <td className="text-center border border-white py-1 break-words min-w-[18vw] max-w-[25vw]">{item.name}</td>

                                        <td className="text-center border border-white py-1 break-words">{item.status}</td>

                                        <td className="text-center border border-white py-1 break-words px-2">
                                            <div className="flex justify-between items-center">
                                                <span className="material-symbols-outlined cursor-pointer" onClick={() => decreaseEp(item.id)}>remove</span>
                                                {item.episodes}
                                                <span className="material-symbols-outlined cursor-pointer" onClick={() => increaseEp(item.id)}>add</span>
                                            </div>
                                        </td>

                                        <td className="text-center border border-white py-1 break-words">{item.movies}</td>

                                        <td className="text-center border py-1 px-2">
                                            <div className="flex gap-1 justify-center">
                                                <span className="material-symbols-outlined text-[#ec7c19] hover:duration-500 hover:scale-110 cursor-pointer" onClick={() => editAnime(item.id)}>edit</span>
                                                <span className="material-symbols-outlined text-[#ec7c19] hover:duration-500 hover:scale-110 cursor-pointer" onClick={() => deleteAnime(item.id)}>delete</span>
                                            </div>
                                        </td>
                                    </tr>
                                })}

                            </tbody>
                        </table>}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Manager