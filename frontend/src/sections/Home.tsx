import { useState } from "react";
import { useNavigate } from "react-router";

import Singleplayer from './Singleplayer.tsx';
import Multiplayer from "./Multiplayer.tsx";
import Profile from "./Profile.tsx";
import Leaderboard from "./Leaderboard.tsx";
import { clearToken } from "../tokenStorage.ts";
import { getTheme, setTheme, type Theme } from "../theme.ts";
import CreditsPanel from "../components/CreditsPanel.tsx";


// IT WAS MISSING 12.5 THE ENTIRE TIMEEEEE
const percentOffsetX: number = 12.5;
const percentOffsetY: number = 12.5;


const Home = () => {

    const navigate = useNavigate();

    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [scale, setScale] = useState(1);
    const [settingsWindow, setSettingsWindow] = useState<boolean>(true);
    const [titleVisible, setTitleVisible] = useState<boolean>(true);
    const [theme, setThemeState] = useState<Theme>(getTheme());
    const [showCredits, setShowCredits] = useState(false);

    // True - Render game windows in a screen overlay (better for mobile)
    // False - Render games directly on the table (looks cooler on desktop)
    const [overlayMode, setOverlayMode] = useState<boolean>(false);

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
    function toggleOverlayMode() {
        setOverlayMode(!overlayMode);
    }

    function logout() {
        clearToken();
        navigate('/login', { replace: true });
    }

    return (

        <div className="relative overflow-hidden w-screen h-screen bg-cream text-ink">

            <div className="absolute left-0 top-8 bottom-8 w-80 flex items-center">

                <div className={`relative flex w-full h-[30%] min-h-80 rounded-r-2xl transition-transform duration-300 z-10 overflow-hidden ${settingsWindow ? '-translate-x-74' : ''}`}>

                    <div className="bg-wood w-full flex flex-col p-4 gap-4">
                        <p className="hidden text-2xl font-semibold px-2">Settings</p>

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
                            role="switch"
                            aria-checked={overlayMode}
                            className="w-full flex items-center justify-between px-3 bg-wood-light rounded-2xl py-2 text-2xl hover:bg-black/10"
                            onClick={toggleOverlayMode}>
                            <span>Overlay mode</span>
                            <span className={`relative w-12 h-7 rounded-full transition-colors ${overlayMode ? 'bg-felt-edge' : 'bg-cream'}`}>
                                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-ink transition-transform ${overlayMode ? 'translate-x-5' : ''}`} />
                            </span>
                        </button>

                        <button
                            className="w-full text-left px-3 bg-wood-light rounded-2xl py-2 text-2xl hover:bg-black/10"
                            aria-haspopup="dialog"
                            onClick={() => setShowCredits(true)}>
                            Credits
                        </button>

                        <button
                            className="w-full text-left px-3 bg-wood-light rounded-2xl py-2 text-2xl hover:bg-black/10 mt-auto"
                            onClick={logout}>
                            Log out
                        </button>
                    </div>

                    <button
                        className="relative h-full w-6 bg-wood-light z-20"
                        aria-label={settingsWindow ? 'Open settings' : 'Close settings'}
                        onClick={toggleSettingsWindow}>
                        <p className="text-xl -rotate-90">
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

                <div className="absolute top-4 left-4 z-10">
                    <button
                        className="bg-cream/90 hover:bg-cream lg:text-2xl px-4 py-2 rounded-2xl shadow-md"
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
                    {titleVisible && (
                        <div className="grid grid-cols-2 grid-rows-2 z-10 w-full h-full">
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
                    )}

                    {!overlayMode && (

                        // The zoomed-in quarter is the backdrop; the section itself is drawn
                        // full size in the layer below so it isn't scaled up 4×.
                        <div className="relative w-full h-full">

                            {openWindow === 1 && (
                                <div className="absolute top-0 left-0 origin-top-left w-[200%] h-[200%] scale-25 overflow-y-auto flex animate-[fadeIn_0.1s_ease-out_0.1s_both]">
                                    <div className="mx-auto w-full max-w-5xl p-8">
                                        <Singleplayer />
                                    </div>
                                </div>
                            )}
                            {openWindow === 2 && (
                                <div className="absolute top-0 right-0 origin-top-right w-[200%] h-[200%] scale-25 overflow-y-auto flex animate-[fadeIn_0.1s_ease-out_0.1s_both]">
                                    <div className="mx-auto w-full max-w-5xl p-8">
                                        <Multiplayer />
                                    </div>
                                </div>
                            )}
                            {openWindow === 3 && (
                                <div className="absolute bottom-0 left-0 origin-bottom-left w-[200%] h-[200%] scale-25 overflow-y-auto flex animate-[fadeIn_0.1s_ease-out_0.1s_both]">
                                    <div className="mx-auto w-full max-w-5xl pt-24 p-8">
                                        <Profile />
                                    </div>
                                </div>

                            )}
                            {openWindow === 4 && (
                                <div className="absolute bottom-0 right-0 origin-bottom-right w-[200%] h-[200%] scale-25 overflow-y-auto flex animate-[fadeIn_0.1s_ease-out_0.1s_both]">
                                    <div className="mx-auto w-full max-w-5xl pt-24 p-8">
                                        <Leaderboard />
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                </div>

            </div>

            {(overlayMode && openWindow !== 0) && (

                <div className="absolute inset-0 z-5 overflow-y-auto animate-[fadeIn_0.4s_ease-out_0.8s_both] flex justify-center">

                    {openWindow === 1 && (
                        <div className="pt-24 pl-24 pr-8 w-full max-w-5xl">
                            <Singleplayer />
                        </div>
                    )}
                    {openWindow === 2 && (
                        <div className="pt-24 pl-8 pr-24 w-full max-w-5xl">
                            <Multiplayer />
                        </div>
                    )}
                    {openWindow === 3 && (
                        <div className="pt-20 pb-24 pl-24 pr-8 w-full max-w-5xl">
                            <Profile />
                        </div>
                    )}
                    {openWindow === 4 && (
                        <div className="pt-20 pb-24 pl-8 pr-24 w-full max-w-5xl">
                            <Leaderboard />
                        </div>
                    )}
                </div>
            )}

            {showCredits && <CreditsPanel onClose={() => setShowCredits(false)} />}
        </div>

    );
}

export default Home;
