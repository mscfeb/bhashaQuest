import { useCallback, useEffect, useRef, useState } from "react";
import {
  Flame,
  Star,
  Trophy,
  Zap,
  Check,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import LanguageSelect from "../components/challenge/LanguageSelect";
import {
  getTodayChallenge,
  getTodayProgress,
} from "../services/api";
import { getDatabaseUserId, getStoredUserProfile } from "../services/auth";
import {
  getChallengeWords,
  normalizeProgress,
  normalizeWord,
} from "../services/normalizers";

export default function DashboardPage() {
  const [language, setLanguage] = useState("hi");
  const [challenge, setChallenge] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getStoredUserProfile() ?? {};
  const userId = getDatabaseUserId(user);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const loadDashboard = useCallback(async ({ force = false } = {}) => {
    const requestId = ++requestIdRef.current;
    const isCurrentRequest = () =>
      mountedRef.current && requestIdRef.current === requestId;

    setLoading(true);
    setError("");

    const [challengeResult, progressResult] = await Promise.allSettled([
      Promise.resolve().then(() => getTodayChallenge(language, { force })),
      userId
        ? Promise.resolve().then(() => getTodayProgress(userId, { force }))
        : Promise.reject(new Error("No authenticated database user ID was found.")),
    ]);

    if (!isCurrentRequest()) return;

    const errors = [];
    if (challengeResult.status === "fulfilled") {
      setChallenge(challengeResult.value);
    } else {
      setChallenge(null);
      errors.push(
        challengeResult.reason?.message || "Unable to load today's challenge.",
      );
    }

    if (progressResult.status === "fulfilled") {
      setProgress(normalizeProgress(progressResult.value));
    } else {
      setProgress(normalizeProgress(null));
      errors.push(
        progressResult.reason?.message || "Unable to load your progress.",
      );
    }

    setError(errors.join(" "));
    setLoading(false);
  }, [language, userId]);

  useEffect(() => {
    mountedRef.current = true;
    loadDashboard();
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadDashboard]);

  const words = getChallengeWords(challenge).map((word) =>
    normalizeWord(word, language),
  );

  const stats = progress ?? normalizeProgress(null);
  const challengeTitle =
    challenge?.topic ?? challenge?.title ?? "Your daily quest";

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3 pt-3">
        <div>
          <p className="text-sm font-medium text-muted">Your daily adventure</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            Hey, {user.displayName || "learner"}! 👋
          </h1>
        </div>
      </div>

      {loading && (
        <div
          role="status"
          className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm text-muted"
        >
          <RefreshCw size={18} className="animate-spin" />
          Loading your daily quest...
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-bold">Couldn't load your dashboard</p>
          <p className="mt-1">{error}</p>
          <Button
            className="mt-3"
            onClick={() => loadDashboard({ force: true })}
          >
            Retry
          </Button>
        </div>
      )}

      <section className="mt-6 rounded-[2rem] bg-forest p-5 text-white shadow-xl shadow-green-950/10 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-sage">
              <Flame size={19} className="text-gold" /> YOUR LEARNING STREAK
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-black">{stats.streak}</span>
              <span className="text-lg font-bold">days</span>
            </div>
            <p className="mt-2 text-sm text-sage">
              You're building a great habit!
            </p>
          </div>
          <div className="grid size-16 place-items-center rounded-3xl bg-white/10">
            <Flame size={39} className="text-gold" />
          </div>
        </div>
        {/* <div className="mt-6 grid grid-cols-7 gap-1.5">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
            const active = index < Math.min(Number(stats.streak) || 0, 7);
            return (
              <div key={`${day}-${index}`} className="text-center">
                <div
                  className={`mx-auto grid size-9 place-items-center rounded-full ${active ? "bg-gold text-[#3A3019]" : "bg-white/10 text-white/60"}`}
                >
                  {active ? (
                    <Check size={17} strokeWidth={3} />
                  ) : (
                    <span className="text-xs">{day}</span>
                  )}
                </div>
                <p className="mt-2 text-[10px] font-bold text-white/65">
                  {day}
                </p>
              </div>
            );
          })}
        </div> */}
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Zap size={21} />}
          label="Total XP"
          value={stats.totalXp}
          detail="Keep collecting!"
          color="bg-[#FFF0C8] text-[#A56B0A]"
        />
        {/* <StatCard
          icon={<Trophy size={21} />}
          label="Challenges won"
          value={stats.challengesWon}
          detail="You're on a roll"
        /> */}
        <StatCard
            icon={<Star size={21} />}
            label="Best score"
            value={`${stats.bestScore}/10`}
            detail="Your personal best"
            color="bg-peach text-[#8A5946]"
          />
        {/* <div className="col-span-2 sm:col-span-1">
          
        </div> */}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-black">Ready for today?</h2>
          <span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">
            {stats.completed
              ? "Completed"
              : `${stats.attemptsRemaining} tries left`}
          </span>
        </div>
        <div className="rounded-[2rem] border border-line bg-white p-5 sm:p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0C8] px-3 py-1.5 text-xs font-bold text-[#91641B]">
            <Sparkles size={14} /> DAILY QUEST
          </span>
          <h3 className="mt-4 text-2xl font-black">{challengeTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Use three words in one spoken sentence. Your next 10 XP is waiting.
          </p>
          <label
            htmlFor="learning-language"
            className="mt-5 block text-xs font-bold text-muted"
          >
            I'M PRACTISING
          </label>
          <LanguageSelect
            id="learning-language"
            value={language}
            onChange={setLanguage}
          />

          {words.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {words.map((word, index) => (
                <span
                  key={word.id ?? index}
                  className="rounded-xl bg-sage px-3 py-2 text-sm font-bold text-forest"
                >
                  {word.translated || word.english || "Translation unavailable"}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-cream p-3.5">
            <div>
              <p className="text-sm font-bold">Today's reward</p>
              <p className="mt-1 text-xs text-muted">Complete the challenge</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFF0C8] px-3 py-2 text-sm font-black text-[#8A5D0D]">
              <Zap size={15} />
              +10 XP
            </span>
          </div>
          <Button
            to={`/challenge?language=${language}`}
            className={`mt-5 w-full `}
            disabled={loading || stats.completed || !challenge?.id}
          >
            Start today's quest <ArrowRight size={18} />
          </Button>
          {!loading && !error && !challenge && (
            <p className="mt-3 text-sm text-muted">
              No challenge is published for today yet.
            </p>
          )}
        </div>
      </section>
      <p className="mt-5 text-center text-xs text-muted-light">
        One small step today. A more confident you tomorrow.
      </p>
    </AppShell>
  );
}
