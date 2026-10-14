import { useEffect, useState } from "react";
import { Crown, Medal, Trophy, RefreshCw } from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { getLeaderboard } from "../services/api";
import { getDatabaseUserId } from "../services/auth";

function RankIcon({ rank }) {
  if (rank === 1) return <Crown size={20} className="text-amber-500" />;
  if (rank === 2) return <Medal size={20} className="text-stone-400" />;
  if (rank === 3) return <Medal size={20} className="text-orange-600" />;
  return <span className="w-5 text-center text-sm font-semibold">{rank}</span>;
}

export default function LeaderboardPage() {
  const userId = getDatabaseUserId();
  const [period, setPeriod] = useState("weekly");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLeaderboard(selectedPeriod = period) {
    try {
      setLoading(true);
      setError("");

      const result = await getLeaderboard(userId, selectedPeriod);
      setData(result);
    } catch (err) {
      setError(err.message || "Could not load the leaderboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard(period);
  }, [period, userId]);

  const leaders = data?.leaders ?? [];
  const currentUser = data?.currentUser;

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              LEARN TOGETHER
            </p>
            <h1 className="mt-1 text-3xl font-bold text-stone-900">
              Leaderboard
            </h1>
            <p className="mt-2 text-stone-600">
              Earn XP, practise daily, and climb the rankings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadLeaderboard(period)}
            aria-label="Refresh leaderboard"
            className="rounded-xl border border-stone-200 p-3 hover:bg-stone-50"
          >
            <RefreshCw size={18} />
          </button>
        </header>

        <div className="flex gap-2 rounded-xl bg-stone-100 p-1">
          {[
            { value: "weekly", label: "Last 7 days" },
            { value: "all-time", label: "All time" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                period === option.value
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {currentUser && (
          <section className="rounded-2xl bg-emerald-800 p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 text-emerald-100">
              <Trophy size={18} />
              <span className="text-sm font-medium">Your position</span>
            </div>

            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-bold">
                  {currentUser.rank == null
                    ? "Unranked"
                    : `#${currentUser.rank}`}
                </p>
                <p className="mt-1 text-sm text-emerald-100">
                  {period === "weekly" ? "Last 7 days" : "All-time"} rank
                </p>
              </div>
              <p className="text-2xl font-bold">
                {currentUser.totalXp}{" "}
                <span className="text-sm font-medium text-emerald-100">
                  XP
                </span>
              </p>
            </div>
          </section>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              onClick={() => loadLeaderboard(period)}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 className="font-semibold text-stone-900">Top learners</h2>
            <p className="mt-1 text-sm text-stone-500">
              Ranked by XP earned
            </p>
          </div>

          {loading ? (
            <p className="p-8 text-center text-stone-500">
              Loading rankings…
            </p>
          ) : leaders.length === 0 ? (
            <p className="p-8 text-center text-stone-500">
              No players to rank yet. Be the first to earn XP!
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {leaders.map((player) => {
                const isCurrentUser =
                  player.userId === userId;

                return (
                  <div
                    key={player.userId}
                    className={`flex items-center gap-3 px-5 py-4 ${
                      isCurrentUser ? "bg-emerald-50" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100">
                      <RankIcon rank={player.rank} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-stone-900">
                        {player.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-semibold text-emerald-700">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-stone-500">
                        Rank #{player.rank}
                      </p>
                    </div>

                    <p className="shrink-0 font-bold text-amber-700">
                      {player.totalXp} XP
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}