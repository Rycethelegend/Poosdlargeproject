import { useState } from "react";

import Singleplayer from './Singleplayer.tsx';
import Multiplayer from "./Multiplayer.tsx";
import Profile from "./Profile.tsx";
import Leaderboard from "./Leaderboard.tsx";

const percentOffsetX = 12;
const percentOffsetY = 12;

const Home = () => {


    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [scale, setScale] = useState(1);
    const [settingsWindow, setSettingsWindow] = useState<boolean>(true);
    const [titleVisible, setTitleVisible] = useState<boolean>(true);

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

    return (

        <div className="relative overflow-hidden w-screen h-screen bg-[#f2e8cf]">

            <div className="absolute left-0 top-8 bottom-8 w-80 flex items-center">

                <div className={`relative flex w-full h-[50%] rounded-r-2xl transition-transform duration-300 z-10 overflow-hidden ${settingsWindow ? '-translate-x-72' : ''}`}>

                    <div className=" bg-[#bc6c25] w-full flex flex-col p-4 gap-4">
                        <button className="w-full text-left px-2 bg-[#dda15e] rounded-2xl py-2 text-2xl hover:bg-black/10">
                            Option 1
                        </button>
                        <button className="w-full text-left px-2 bg-[#dda15e] rounded-2xl py-2 text-2xl hover:bg-black/10">
                            Option 2
                        </button><button className="w-full text-left px-2 bg-[#dda15e] rounded-2xl py-2 text-2xl hover:bg-black/10">
                            Option 3
                        </button>
                    </div>

                    <button
                        className="relative h-full w-8 bg-[#dda15e] z-20"
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
                        BALATRO
                    </p>
                </div>

            ) : (

                <div className="absolute top-8 left-8 z-10">
                    <button
                        className="clearButton"
                        onClick={zoomOut}>

                        Go back
                    </button>
                </div>
            )}

            <div
                style={{ transform: `translateX(${offsetX}%) translateY(${offsetY}%)`, scale: `${scale}` }}
                className="inset-0 w-full h-full flex items-center justify-center absolute transition-transform duration-1000">

                <div className="relative w-[50%] h-[50%] bg-[#6a994e] rounded-4xl border-16 border-[#386641]">

                    <div className="absolute pointer-events-none w-full rounded-2xl h-full bg-black/5 mask-size-[40px] mask-[url(/patterns/parkay-floor.svg)]">

                    </div>
                    {titleVisible ? (
                        <div className="grid grid-cols-2 grid-rows-2 z-10 w-full h-full p-4">
                            <div className="w-full h-full">
                                <button 
                                    className="w-full h-full font-semibold truncate text-3xl hover:bg-white/20 rounded-tl-4xl"
                                    onClick={topLeft}>
                                    SINGLEPLAYER
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <button
                                    className="w-full h-full font-semibold truncate text-3xl hover:bg-white/20 rounded-tr-4xl"
                                    onClick={topRight}>
                                    MULTIPLAYER
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <button 
                                    className="w-full h-full font-semibold truncate text-3xl hover:bg-white/20 rounded-bl-4xl"
                                    onClick={bottomLeft}>
                                    PROFILE
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <button 
                                    className="w-full h-full font-semibold truncate text-3xl hover:bg-white/20 rounded-br-4xl"
                                    onClick={bottomRight}>
                                    LEADERBOARD
                                </button>
                            </div>

                        </div>

                    ) : (

                        <div className="grid grid-cols-2 grid-rows-2 z-10 w-full h-full">
                            <div className="bg-red-500/20">
                                {openWindow === 1 && (
                                    <Singleplayer />
                                )}
                            </div>
                            <div className="bg-blue-500/20">
                                {openWindow === 2 && (
                                    <Multiplayer />
                                )}
                            </div>
                            <div className="bg-green-500/20">
                                {openWindow === 3 && (
                                    <Profile />
                                )}
                            </div>
                            <div className="bg-yellow-500/20">
                                {openWindow === 4 && (
                                    <Leaderboard />
                                )}
                            </div>
                        </div>
                    )}

                </div>

            </div>


        </div>

    );
}

export default Home;
