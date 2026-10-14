import { useEffect, useState } from "react";
import { Flame, Trophy, Target, Star, RefreshCw } from "lucide-react";

import AppShell from "../components/layout/AppShell";
import StatCard from "../components/ui/StatCard";
import XpChart from "../components/progress/XpChart";
import { getProgressHistory } from "../services/api";
import { getDatabaseUserId } from "../services/auth";

export default function ProgressPage() {
  const userId = getDatabaseUserId();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProgress() {
    try {
      setError("");
      setLoading(true);

      const result = await getProgressHistory(userId, 7);
      setData(result);
    } catch (err) {
      setError(err.message || "Could not load your progress.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const history = data?.history ?? [];
  const completed = data?.challengesCompleted ?? 0;
  const totalXp = data?.periodXp ?? 0;

  // Consecutive-day activity is not necessarily the same as your
  // current streak. Do not label this as a streak.
  const activeDays = history.filter(
    (item) => item.challengesCompleted > 0
  ).length;

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              YOUR LEARNING JOURNEY
            </p>
            <h1 className="mt-1 text-3xl font-bold text-stone-900">
              My Progress
            </h1>
            <p className="mt-2 text-stone-600">
              Small steps every day lead to confident speaking.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProgress}
            aria-label="Refresh progress"
            className="rounded-xl border border-stone-200 p-3 text-stone-700 hover:bg-stone-50"
          >
            <RefreshCw size={18} />
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              onClick={loadProgress}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-stone-500 shadow-sm">
            Loading your progress…
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="XP this week"
                value={totalXp}
                icon={<Star size={20} />}
              />
              <StatCard
                label="Challenges won"
                value={completed}
                icon={<Trophy size={20} />}
              />
              <StatCard
                label="Active days"
                value={activeDays}
                icon={<Flame size={20} />}
              />
              <StatCard
                label="Daily goal"
                value={`${Math.min(completed, 1)}/1`}
                icon={<Target size={20} />}
              />
            </section>

            <XpChart history={history} />

            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-stone-900">
                Daily activity
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Challenges completed during the last seven days.
              </p>

              <div className="mt-4 divide-y divide-stone-100">
                {history.map((item) => (
                  <div
                    key={item.date}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium text-stone-800">
                        {item.label}
                      </p>
                      <p className="text-xs text-stone-500">
                        {item.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-700">
                        +{item.xp} XP
                      </p>
                      <p className="text-xs text-stone-500">
                        {item.challengesCompleted} completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}