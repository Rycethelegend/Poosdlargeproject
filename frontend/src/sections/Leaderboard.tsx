import { useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardEntry } from "../scoresApi";
import { getUser } from "../tokenStorage";
import { useDebounced } from "../useDebounced";

const Leaderboard = () => {

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounced(search);
    const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
    const [error, setError] = useState('');
    // The search the shown rows belong to; while it differs, a request is in flight
    const [loadedSearch, setLoadedSearch] = useState<string | null>(null);
    const loading = loadedSearch !== debouncedSearch;
    const me = getUser()?.username.toLowerCase();

    useEffect(() => {
        let cancelled = false;
        fetchLeaderboard(debouncedSearch)
            .then((result) => { if (!cancelled) { setRows(result); setError(''); } })
            .catch((err) => { if (!cancelled) setError((err as Error).message); })
            .finally(() => { if (!cancelled) setLoadedSearch(debouncedSearch); });
        return () => { cancelled = true; };
    }, [debouncedSearch]);

    return (
        <div className="feltPanel p-4 sm:p-6 flex flex-col gap-4">

            <div>
                <p className="text-3xl sm:text-4xl font-semibold">Leaderboard</p>
                <p className="text-lg">
                    {search.trim() ? `Top scores matching "${search.trim()}"` : 'Top 100 scores of all time'}
                </p>
            </div>

            <input
                className="feltInput"
                type="search"
                aria-label="Search the leaderboard by username or date"
                placeholder="Search a username or a date, e.g. 2026-11-05"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {error && <p role="alert" className="formError">{error}</p>}

            <div className="bg-cream/80 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[2.5rem_1fr_auto_auto] sm:grid-cols-[3rem_1fr_auto_auto_auto] gap-x-4 px-4 py-2 font-semibold border-b-2 border-felt-edge/40">
                    <span>#</span>
                    <span>Player</span>
                    <span className="text-right">Score</span>
                    <span className="text-right w-12">Table</span>
                    <span className="hidden sm:block w-24">Date</span>
                </div>

                <ol className={`max-h-[55vh] overflow-y-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
                    {rows?.map((row, i) => (
                        <li
                            key={`${row.username}-${row.date}`}
                            className={`grid grid-cols-[2.5rem_1fr_auto_auto] sm:grid-cols-[3rem_1fr_auto_auto_auto] gap-x-4 px-4 py-2 odd:bg-black/5 ${row.username.toLowerCase() === me ? 'font-semibold bg-wood-light/50!' : ''}`}>
                            <span className="tabular-nums">{i + 1}</span>
                            <span className="truncate">{row.username}</span>
                            <span className="text-right font-semibold tabular-nums">{row.score.toLocaleString()}</span>
                            <span className="text-right w-12 tabular-nums">{row.table}</span>
                            <span className="hidden sm:block w-24">{row.day}</span>
                        </li>
                    ))}
                </ol>

                {rows && rows.length === 0 && (
                    <p className="px-4 py-6 text-center">
                        {search.trim() ? `No scores matching "${search.trim()}".` : 'No scores yet. Be the first!'}
                    </p>
                )}
            </div>
        </div>
    );
}

export default Leaderboard;
