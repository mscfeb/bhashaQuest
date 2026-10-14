
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Flame,
  Sparkles,
  Trophy,
  Zap,
  AlertCircle,
  RefreshCw,
  Target,
  CheckCircle2,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";

import { getTodayProgress } from "../services/api";
import { getDatabaseUserId } from "../services/auth";
import {
  normalizeProgress,
  normalizeSubmission,
} from "../services/normalizers";

export default function ResultsPage() {
  const location = useLocation();

  const [progress, setProgress] = useState(null);
  const [progressError, setProgressError] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const resultState = location.state;
  const result = resultState?.result;
  const evaluation = normalizeSubmission(result);

  const challenge = resultState?.challenge;
  const language = resultState?.language;

  const userId = getDatabaseUserId();

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      if (!userId) {
        setProgressError("No authenticated database user ID was found.");
        setLoadingProgress(false);
        return;
      }

      setLoadingProgress(true);
      setProgressError("");

      try {
        const data = await getTodayProgress(userId, { force: true });

        if (!cancelled) {
          setProgress(normalizeProgress(data));
        }
      } catch (error) {
        if (!cancelled) {
          setProgressError(
            error.message || "Unable to refresh your progress."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProgress(false);
        }
      }
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  if (!result) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg pt-8">
          <section className="rounded-[2rem] border border-line bg-white p-6 text-center">
            <AlertCircle
              className="mx-auto text-[#A56B0A]"
              size={36}
            />

            <h1 className="mt-4 text-2xl font-black">
              No result to display
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted">
              Open this page after submitting a recording so we can
              show the evaluation returned by the backend.
            </p>

            <Button to="/dashboard" className="mt-5 w-full">
              Back to dashboard
            </Button>
          </section>
        </div>
      </AppShell>
    );
  }

  const score = Math.max(
    0,
    Math.min(
      10,
      Number.isFinite(evaluation.score)
        ? evaluation.score
        : 0
    )
  );

  const passed = evaluation.passed === true;
  const xp = Number(evaluation.xpAwarded) || 0;

  const streak = progress?.streak;
  const totalXp = progress?.totalXp;
  const challengesWon = progress?.challengesWon;
  const bestScore = progress?.bestScore;

  const challengeTitle =
    challenge?.title ||
    challenge?.topic ||
    "Today's speaking challenge";

  const progressStats = [
    {
      key: "streak",
      icon: <Flame size={20} />,
      label: "Current streak",
      value:
        streak !== undefined && streak !== null
          ? `${streak} ${streak === 1 ? "day" : "days"}`
          : "—",
      color: "bg-[#FFF0C8] text-[#A56B0A]",
    },
    {
      key: "xp",
      icon: <Zap size={20} />,
      label: "Total XP",
      value:
        totalXp !== undefined && totalXp !== null
          ? totalXp
          : "—",
      color: "bg-sage text-forest",
    },
    {
      key: "completed",
      icon: <Trophy size={20} />,
      label: "Challenges won",
      value:
        challengesWon !== undefined && challengesWon !== null
          ? challengesWon
          : "—",
      color: "bg-[#FFF0C8] text-[#A56B0A]",
    },
    {
      key: "best",
      icon: <Target size={20} />,
      label: "Best score",
      value:
        bestScore !== undefined && bestScore !== null
          ? `${bestScore}/10`
          : "—",
      color: "bg-sage text-forest",
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-lg pt-5 pb-6">
        {/* Evaluation summary */}
        <section className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-9 text-center text-white">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/[0.05]" />
          <div className="absolute -bottom-10 -left-6 size-36 rounded-full bg-white/[0.05]" />

          <div className="relative mx-auto grid size-16 place-items-center rounded-3xl bg-gold text-[#4D3B16]">
            {passed ? (
              <Trophy size={32} />
            ) : (
              <Sparkles size={32} />
            )}
          </div>

          <p className="relative mt-5 text-xs font-black uppercase tracking-[0.2em] text-sage">
            {passed ? "Quest completed" : "Keep practising"}
          </p>

          <h1 className="relative mt-2 text-3xl font-black">
            {passed
              ? "Look at you go!"
              : "Every try helps you grow."}
          </h1>

          <p className="relative mt-2 text-sm leading-6 text-white/75">
            {passed
              ? "You're one step closer to speaking confidently."
              : "Review your feedback and keep building your speaking skills."}
          </p>

          <div
            className="relative mx-auto mt-7 grid size-36 place-items-center rounded-full border-[7px] border-gold/35 bg-white/[0.08]"
            aria-label={`Score: ${score} out of 10`}
          >
            <div>
              <p className="text-5xl font-black">{score}</p>
              <p className="mt-1 text-sm font-bold text-white/75">
                out of 10
              </p>
            </div>
          </div>

          <div className="relative mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-black text-[#493514]">
            <Zap size={19} />
            {xp > 0 ? `+${xp} XP earned` : "No XP awarded"}
          </div>

          <p className="relative mt-4 text-xs text-white/65">
            {challengeTitle}
            {language ? ` · ${language.toUpperCase()}` : ""}
          </p>
        </section>

        {/* Evaluation feedback */}
        <section className="mt-4 rounded-[2rem] border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage text-forest">
              <Sparkles size={22} />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="font-black">Your feedback</h2>

              <p className="mt-1 text-sm leading-6 text-muted">
                {evaluation.feedback ||
                  "Your evaluation is complete. Keep practising to build confidence."}
              </p>
            </div>
          </div>

          {evaluation.transcript && (
            <div className="mt-4 rounded-2xl bg-cream p-4">
              <p className="text-xs font-black uppercase tracking-wider text-muted">
                Recognized speech
              </p>

              <p className="mt-2 break-words text-sm leading-6">
                {evaluation.transcript}
              </p>
            </div>
          )}

          <div
            className={`mt-4 flex items-start gap-2 rounded-2xl p-3 text-sm ${
              passed
                ? "bg-sage text-forest"
                : "bg-[#FFF0C8] text-[#79530C]"
            }`}
          >
            {passed ? (
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <Target size={18} className="mt-0.5 shrink-0" />
            )}

            <p>
              {passed
                ? "Challenge passed! Your XP reward is shown above."
                : "Use the feedback to improve your next attempt. Your remaining attempts depend on your progress status."}
            </p>
          </div>
        </section>

        {/* Overall learning progress */}
        <section className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#678269]">
                Your learning journey
              </p>

              <h2 className="mt-1 text-xl font-black">
                Overall progress
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loadingProgress}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-forest transition hover:bg-sage disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loadingProgress ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {loadingProgress && !progress ? (
            <div
              role="status"
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-line bg-white p-6 text-sm text-muted"
            >
              <LoaderCircle size={18} className="animate-spin" />
              Loading your progress...
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {progressStats.map((stat) => (
                <StatCard
                  key={stat.key}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  color={stat.color}
                />
              ))}
            </div>
          )}

          {progressError && (
            <div
              role="alert"
              className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
            >
              <p className="flex items-start gap-2 text-xs leading-5 text-amber-900">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0"
                />
                <span>
                  Your evaluation is available, but your overall
                  progress could not be refreshed: {progressError}
                </span>
              </p>

              <button
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                className="mt-2 text-xs font-black text-amber-900 underline"
              >
                Try again
              </button>
            </div>
          )}
        </section>

        {/* Next action */}
        <section className="mt-6 rounded-[2rem] border border-line bg-white p-5">
          <h2 className="font-black">Keep your momentum going</h2>

          <p className="mt-1 text-sm leading-6 text-muted">
            Small daily practice sessions help you build vocabulary
            and speak with greater confidence.
          </p>

          <Button to="/dashboard" className="mt-4 w-full">
            Back to dashboard
            <ArrowRight size={18} />
          </Button>
        </section>

        <p className="mt-4 text-center text-xs text-muted-light">
          Keep learning, one challenge at a time.
        </p>
      </div>
    </AppShell>
  );
}
