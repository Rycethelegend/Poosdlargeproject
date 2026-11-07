import { useState } from "react";
import { useNavigate } from "react-router";

import Singleplayer from './Singleplayer.tsx';
import Multiplayer from "./Multiplayer.tsx";
import Profile from "./Profile.tsx";
import Leaderboard from "./Leaderboard.tsx";
import { clearToken } from "../tokenStorage.ts";
import { getTheme, setTheme, type Theme } from "../theme.ts";

const percentOffsetX = 12;
const percentOffsetY = 12;

const Home = () => {

    const navigate = useNavigate();

    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [scale, setScale] = useState(1);
    const [settingsWindow, setSettingsWindow] = useState<boolean>(true);
    const [titleVisible, setTitleVisible] = useState<boolean>(true);
    const [theme, setThemeState] = useState<Theme>(getTheme());

    // GAMEPLAY WINDOWS
    const [openWindow, setOpenWindow] = useState<number>(0);

    function topLeft() {
        setTitleVisible(false);
        setOffsetX(percentOffsetX);
        setOffsetY(percentOffsetY);
        setScale(4);
        setOpenWindow(1);
    }
    function topRight() {
        setTitleVisible(false);
        setOffsetX(-percentOffsetX);
        setOffsetY(percentOffsetY);
        setScale(4);
        setOpenWindow(2);
    }
    function bottomLeft() {
        setTitleVisible(false);
        setOffsetX(percentOffsetX);
        setOffsetY(-percentOffsetY);
        setScale(4);
        setOpenWindow(3);
    }
    function bottomRight() {
        setTitleVisible(false);
        setOffsetX(-percentOffsetX);
        setOffsetY(-percentOffsetY);
        setScale(4);
        setOpenWindow(4);
    }

    function zoomOut() {
        setTitleVisible(true);
        setOffsetX(0);
        setOffsetY(0);
        setScale(1);
        setOpenWindow(0);
    }

    function toggleSettingsWindow() {
        setSettingsWindow(!settingsWindow);
    }

    function toggleTheme() {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        setThemeState(next);
    }

    function logout() {
        clearToken();
        navigate('/login', { replace: true });
    }

    return (

        <div className="relative overflow-hidden w-screen h-screen bg-cream text-ink">

            <div className="absolute left-0 top-8 bottom-8 w-80 flex items-center">

                <div className={`relative flex w-full h-[50%] min-h-64 rounded-r-2xl transition-transform duration-300 z-10 overflow-hidden ${settingsWindow ? '-translate-x-72' : ''}`}>

                    <div className="bg-wood w-full flex flex-col p-4 gap-4">
                        <p className="text-2xl font-semibold px-2">Settings</p>

                        <button
                            role="switch"
                            aria-checked={theme === 'dark'}
                            className="w-full flex items-center justify-between px-3 bg-wood-light rounded-2xl py-2 text-2xl hover:bg-black/10"
                            onClick={toggleTheme}>
                            <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
                            <span className={`relative w-12 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-felt-edge' : 'bg-cream'}`}>
                                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-ink transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`} />
                            </span>
                        </button>

                        <button
                            className="w-full text-left px-3 bg-wood-light rounded-2xl py-2 text-2xl hover:bg-black/10 mt-auto"
                            onClick={logout}>
                            Log out
                        </button>
                    </div>

                    <button
                        className="relative h-full w-8 bg-wood-light z-20"
                        aria-label={settingsWindow ? 'Open settings' : 'Close settings'}
                        onClick={toggleSettingsWindow}>
                        <p className="text-2xl -rotate-90">
                            Settings
                        </p>
                    </button>
                </div>


            </div>

            {titleVisible ? (
                <div className="relative w-full h-full p-16">
                    <p className="title text-center font-playfair">
                        Poosdalatro
                    </p>
                </div>

            ) : (

                <div className="absolute top-8 left-10 z-10">
                    <button
                        className="bg-cream/90 hover:bg-cream text-2xl px-4 py-2 rounded-2xl shadow-md"
                        onClick={zoomOut}>

                        Go back
                    </button>
                </div>
            )}

            <div
                style={{ transform: `translateX(${offsetX}%) translateY(${offsetY}%)`, scale: `${scale}` }}
                className="inset-0 w-full h-full flex items-center justify-center absolute transition-transform duration-1000">

                <div className="relative w-[50%] h-[50%] bg-felt rounded-4xl border-16 border-felt-edge">

                    <div className="absolute pointer-events-none w-full rounded-2xl h-full bg-black/5 mask-size-[40px] mask-[url(/patterns/parkay-floor.svg)]">

                    </div>
                    {titleVisible ? (
                        <div className="grid grid-cols-2 grid-rows-2 z-10 w-full h-full p-4">
                            <div className="w-full h-full">
                                <button
                                    className="w-full h-full font-semibold truncate text-xl sm:text-3xl hover:bg-white/20 rounded-tl-4xl"
                                    onClick={topLeft}>
                                    SINGLEPLAYER
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <button
                                    className="w-full h-full font-semibold truncate text-xl sm:text-3xl hover:bg-white/20 rounded-tr-4xl"
                                    onClick={topRight}>
                                    MULTIPLAYER
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <button
                                    className="w-full h-full font-semibold truncate text-xl sm:text-3xl hover:bg-white/20 rounded-bl-4xl"
                                    onClick={bottomLeft}>
                                    PROFILE
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <button
                                    className="w-full h-full font-semibold truncate text-xl sm:text-3xl hover:bg-white/20 rounded-br-4xl"
                                    onClick={bottomRight}>
                                    LEADERBOARD
                                </button>
                            </div>

                        </div>

                    ) : (

                        // The zoomed-in quarter is the backdrop; the section itself is drawn
                        // full size in the layer below so it isn't scaled up 4×.
                        <div className="grid grid-cols-2 grid-rows-2 z-10 w-full h-full">
                            <div className="bg-red-500/20">

                            </div>
                            <div className='bg-blue-500/20'>

                            </div>
                            <div className='bg-green-500/20'>

                            </div>
                            <div className='bg-yellow-500/20'>

                            </div>
                        </div>
                    )}

                </div>

            </div>

            {openWindow !== 0 && (
                <div
                    className={`absolute inset-0 z-5 overflow-y-auto transition-opacity duration-500 ${openWindow !== 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'} `}>
                    <div className="mx-auto max-w-5xl">
                        {openWindow === 1 && <Singleplayer />}
                        {openWindow === 2 && <Multiplayer />}
                        {openWindow === 3 && <Profile />}
                        {openWindow === 4 && <Leaderboard />}
                    </div>
                </div>
            )}

        </div>

    );
}

export default Home;
