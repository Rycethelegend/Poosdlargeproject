import { useEffect, useState } from "react";
import { fetchMyScores, formatTime, type MyScores, type ScoreSort } from "../scoresApi";
import { getUser } from "../tokenStorage";
import { useDebounced } from "../useDebounced";

const SORTS: { value: ScoreSort; label: string }[] = [
    { value: 'date', label: 'Newest first' },
    { value: 'score', label: 'Highest score' },
];

const Profile = () => {

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounced(search);
    const [sort, setSort] = useState<ScoreSort>('date');
    const [data, setData] = useState<MyScores | null>(null);
    const [error, setError] = useState('');
    // The search + sort the shown results belong to; while it differs, a request is in flight
    const requestKey = `${sort}|${debouncedSearch}`;
    const [loadedKey, setLoadedKey] = useState<string | null>(null);
    const loading = loadedKey !== requestKey;

    useEffect(() => {
        let cancelled = false;
        fetchMyScores(debouncedSearch, sort)
            .then((result) => { if (!cancelled) { setData(result); setError(''); } })
            .catch((err) => { if (!cancelled) setError((err as Error).message); })
            .finally(() => { if (!cancelled) setLoadedKey(`${sort}|${debouncedSearch}`); });
        return () => { cancelled = true; };
    }, [debouncedSearch, sort]);

    const username = data?.username ?? getUser()?.username ?? '';

    return (
        <div className="feltPanel p-4 sm:p-6 flex flex-col gap-4">

            <div className="flex flex-wrap items-end justify-between gap-4">
                <p className="text-3xl sm:text-4xl font-semibold break-all">{username}</p>
                <div className="flex gap-3">
                    <div className="bg-cream/80 rounded-2xl px-4 py-2 text-center">
                        <p className="text-sm uppercase tracking-wide">Best score</p>
                        <p className="text-2xl font-semibold">{(data?.bestScore ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-cream/80 rounded-2xl px-4 py-2 text-center">
                        <p className="text-sm uppercase tracking-wide">Games</p>
                        <p className="text-2xl font-semibold">{data?.gamesPlayed ?? 0}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="font-semibold">Sort by</span>
                <div className="flex rounded-2xl overflow-hidden" role="group" aria-label="Sort your scores">
                    {SORTS.map((option) => (
                        <button
                            key={option.value}
                            aria-pressed={sort === option.value}
                            className={`px-4 py-2 font-semibold transition-colors ${sort === option.value ? 'bg-wood' : 'bg-wood-light hover:bg-wood'}`}
                            onClick={() => setSort(option.value)}>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <input
                className="feltInput"
                type="search"
                aria-label="Search your scores by date"
                placeholder="Search by date, e.g. 2026-11 or 2026-11-05"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {error && <p role="alert" className="formError">{error}</p>}

            <div className="bg-cream/80 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 font-semibold border-b-2 border-felt-edge/40">
                    <span>Date</span>
                    <span className="text-right">Score</span>
                    <span className="text-right w-14">Table</span>
                </div>

                <ul className={`max-h-[50vh] overflow-y-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
                    {data?.scores.map((entry) => (
                        <li key={entry.date} className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 odd:bg-black/5">
                            <span>{entry.day} <span className="opacity-60">{formatTime(entry.date)}</span></span>
                            <span className="text-right font-semibold tabular-nums">{entry.score.toLocaleString()}</span>
                            <span className="text-right w-14 tabular-nums">{entry.table}</span>
                        </li>
                    ))}
                </ul>

                {data && data.scores.length === 0 && (
                    <p className="px-4 py-6 text-center">
                        {search.trim() ? `No scores matching "${search.trim()}".` : 'No scores yet. Finish a Singleplayer run to see it here.'}
                    </p>
                )}
            </div>
        </div>
    );
}

export default Profile;
