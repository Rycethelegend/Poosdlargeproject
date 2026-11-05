import { useState } from "react";

const Profile = () => {

    const [firstName, setFirstName] = useState('Firstname');
    const [lastName, setLastName] = useState('Lastname');
    const [roundsWon, setRoundsWon] = useState(0);

    return (
        <div className="relative w-full h-full pt-6 px-2 text-xs">

            <div className="flex flex-col w-full">
                <p>{firstName}, {lastName}</p>

                <p className="mt-2">Rounds won - {roundsWon}</p>
                <p>Games won - {roundsWon}</p>

                <p className="mt-2">Player since - 2024</p>
            </div>
            <button className="absolute top-2 right-2 smallButton bg-black/10">
                Logout
            </button>
        </div>
    );
}

export default Profile;