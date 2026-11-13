import { useOnline } from '../useOnline';

const OfflineBanner = () => {
    const online = useOnline();
    if (online) return null;

    return (
        <div role="status" className="fixed top-0 inset-x-0 z-50 bg-danger text-[#f2e8cf] text-center px-4 py-2 shadow-md">
            <span className="font-semibold">You're offline.</span>{' '}
            Singleplayer still works and your scores are saved once you're back online.
            Profile, Leaderboard and Multiplayer need a connection.
        </div>
    );
}

export default OfflineBanner;
