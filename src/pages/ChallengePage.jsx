
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  CircleHelp,
  Mic,
  Zap,
  LoaderCircle,
  Square,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import WordCard from "../components/challenge/WordCard";
import LanguageSelect, {
  languages,
} from "../components/challenge/LanguageSelect";

import {
  getTodayChallenge,
  getTodayProgress,
  submitAudio,
} from "../services/api";
import { getDatabaseUserId } from "../services/auth";

import {
  getChallengeWords,
  normalizeWord,
  normalizeProgress,
} from "../services/normalizers";

export default function ChallengePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const requestedLanguage = searchParams.get("language");

  const initialLanguage = languages.some(
    (item) => item.code === requestedLanguage
  )
    ? requestedLanguage
    : "hi";

  const [language, setLanguage] = useState(initialLanguage);

  const [challenge, setChallenge] = useState(() =>
    location.state?.language === initialLanguage
      ? location.state?.challenge ?? null
      : null
  );

  const [stats, setStats] = useState(() =>
    normalizeProgress(null)
  );

  const [loading, setLoading] = useState(!challenge);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [challengeError, setChallengeError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const aliveRef = useRef(true);
  const sessionRef = useRef(0);

  const userId = getDatabaseUserId();

  const words = getChallengeWords(challenge).map((word) =>
    normalizeWord(word, language)
  );

  const challengeId = challenge?.id ?? challenge?.challengeId;

  const completed = stats.completed === true;
  const attemptsRemaining = Math.max(
    0,
    Number(stats.attemptsRemaining ?? 2)
  );

  const canStartRecording =
    !loading &&
    !loadingProgress &&
    !challengeError &&
    Boolean(challengeId) &&
    !submitting &&
    !completed &&
    attemptsRemaining > 0;

  // Load the selected language's challenge.
  useEffect(() => {
    let cancelled = false;
    setSpeechError(()=>"");

    async function loadChallenge() {
      const cachedChallenge =
        location.state?.language === language
          ? location.state?.challenge
          : null;

      if (cachedChallenge && retryKey === 0) {
        setChallenge(cachedChallenge);
        setChallengeError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setChallengeError("");

      try {
        const data = await getTodayChallenge(language, {
          force: retryKey > 0,
        });

        if (!cancelled) {
          setChallenge(data);
        }
      } catch (error) {
        if (!cancelled) {
          setChallengeError(
            error.message || "Unable to load today's challenge."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadChallenge();

    return () => {
      cancelled = true;
    };
  }, [language, retryKey, location.state]);

  // Load attempts and completion once when the page mounts.
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
        const data = await getTodayProgress(userId);

        if (!cancelled) {
          setStats(normalizeProgress(data));
        }
      } catch (error) {
        if (!cancelled) {
          setProgressError(
            error.message || "Unable to load your attempts."
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
  }, [userId]);

  // Clean up the microphone and timer on unmount.
  useEffect(() => {
    aliveRef.current = true;

    return () => {
      aliveRef.current = false;
      sessionRef.current += 1;

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const recorder = recorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  const stopStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    streamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    streamRef.current = null;
    recorderRef.current = null;

    if (aliveRef.current) {
      setRecording(false);
    }
  }, []);

  // Merge only fields actually supplied by the submission response.
  function updateProgressFromSubmission(result) {
    const raw = result?.progress ?? result;

    const field = (...keys) => {
      for (const key of keys) {
        if (raw?.[key] !== undefined && raw[key] !== null) {
          return raw[key];
        }
      }
      return undefined;
    };

    const patch = {
      streak: field("currentStreak", "current_streak", "streak"),
      totalXp: field("totalXp", "total_xp"),
      challengesWon: field("challengesWon", "challenges_won"),
      bestScore: field("bestScore", "best_score"),
      attemptsRemaining: field(
        "attemptsRemaining",
        "attempts_remaining"
      ),
      attemptsUsed: field("attemptsUsed", "attempts_used"),
      completed: field("completed"),
      xpEarnedToday: field("xpEarnedToday", "xp_earned_today"),
    };

    // Avoid overwriting existing stats with defaults when a field
    // isn't present in the submission response.
    Object.keys(patch).forEach((key) => {
      if (patch[key] === undefined) {
        delete patch[key];
      }
    });

    setStats((current) => ({
      ...current,
      ...patch,
    }));
  }

  async function startRecording() {
    setRecordingError("");

    if (!challengeId) {
      setRecordingError("Today's challenge has not loaded yet.");
      return;
    }

    if (!userId) {
      setRecordingError("No authenticated database user ID was found.");
      return;
    }

    if (completed || attemptsRemaining <= 0) {
      setRecordingError(
        completed
          ? "You have already completed today's challenge."
          : "You have no attempts remaining today."
      );
      return;
    }

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setRecordingError(
        "Audio recording requires a supported browser and localhost or HTTPS."
      );
      return;
    }

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (!aliveRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const supportedType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

      const session = ++sessionRef.current;

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      setSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        if (aliveRef.current) {
          setRecordingError("A microphone recording error occurred.");
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        if (streamRef.current === stream) {
          streamRef.current = null;
        }

        if (recorderRef.current === recorder) {
          recorderRef.current = null;
        }

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (
          !aliveRef.current ||
          session !== sessionRef.current
        ) {
          return;
        }

        const audio = new Blob(chunksRef.current, {
          type: recorder.mimeType || supportedType || "audio/webm",
        });

        chunksRef.current = [];
        setRecording(false);

        if (!audio.size) {
          setRecordingError(
            "No audio was captured. Please try recording again."
          );
          return;
        }

        setSubmitting(true);
        setRecordingError("");

        try {
          // One submission request per recording.
          const result = await submitAudio({
            challengeId,
            language,
            userId,
            audio,
          });

          if (!aliveRef.current) return;

          updateProgressFromSubmission(result);

          const submissionId =
            result?.submission_id ??
            result?.submissionId ??
            result?.id ??
            "latest";

          navigate(
            `/results/${encodeURIComponent(submissionId)}`,
            {
              state: {
                result,
                challenge,
                language,
              },
            }
          );
        } catch (error) {
          if (aliveRef.current) {
            setRecordingError(
              error.message || "Submission failed. Please try again."
            );
          }
        } finally {
          if (aliveRef.current) {
            setSubmitting(false);
          }
        }
      };

      recorder.start();
      setRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((current) => {
          if (current + 1 >= 60) {
            if (recorder.state === "recording") {
              recorder.stop();
            }
            return 60;
          }

          return current + 1;
        });
      }, 1000);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      stopStream();

      setRecordingError(
        error.name === "NotAllowedError"
          ? "Microphone permission was denied. Allow access in your browser settings."
          : error.message || "Could not start recording."
      );
    }
  }

  function finishRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function changeLanguage(nextLanguage) {
    if (recording || submitting || nextLanguage === language) {
      return;
    }

    setLanguage(nextLanguage);

    const cachedChallenge =
      location.state?.language === nextLanguage
        ? location.state.challenge
        : null;

    setChallenge(cachedChallenge ?? null);
    setChallengeError("");

    navigate(`/challenge?language=${nextLanguage}`, {
      replace: true,
      state: cachedChallenge
        ? {
            challenge: cachedChallenge,
            language: nextLanguage,
          }
        : null,
    });
  }

  async function playWordAudio(selected) {
    setSpeechError("");

    if (!("speechSynthesis" in window)) {
      setSpeechError("Speech playback is not supported by this browser.");
      return;
    }

    const synthesis = window.speechSynthesis;
    let voices = synthesis.getVoices();

    if (voices.length === 0) {
      voices = await new Promise((resolve) => {
        const finish = () => {
          window.clearTimeout(timeoutId);
          synthesis.removeEventListener("voiceschanged", onVoicesChanged);
          resolve(synthesis.getVoices());
        };
        const onVoicesChanged = () => finish();
        const timeoutId = window.setTimeout(finish, 1200);
        synthesis.addEventListener("voiceschanged", onVoicesChanged, {
          once: true,
        });
      });
    }

    const voiceLanguage = {
      hi: "hi-IN",
      kn: "kn-IN",
      te: "te-IN",
      mr: "mr-IN",
      en: "en-IN",
    }[language] || language;
    const matchingVoice = voices.find(
      (voice) => voice.lang.toLowerCase() === voiceLanguage.toLowerCase(),
    ) || voices.find(
      (voice) => voice.lang.toLowerCase().startsWith(`${language}-`),
    );

    if (!matchingVoice) {
      setSpeechError(
        `No ${languages.find((item) => item.code === language)?.name ?? language} speech voice is available in this browser. Install a matching system speech voice, then try again.`,
      );
      return;
    }

    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      selected.translated || selected.english,
    );
    utterance.lang = voiceLanguage;
    utterance.voice = matchingVoice;
    utterance.onerror = () => {
      setSpeechError("The selected speech voice could not play this word.");
    };
    synthesis.speak(utterance);
  }

  console.table(
  window.speechSynthesis.getVoices().map((voice) => ({
    name: voice.name,
    language: voice.lang,
    default: voice.default,
  })),
);
  const formattedDuration = `${String(
    Math.floor(seconds / 60)
  ).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <AppShell>
      <div className="pt-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>

        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#678269]">
              Today's challenge
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Make it yours.
            </h1>

            <p className="mt-2 text-sm text-muted">
              Say one sentence using all three words.
            </p>
          </div>

          <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFF0C8] px-3 py-2 text-xs font-black text-[#8A5D0D]">
            <Zap size={14} />
            +10 XP
          </span>
        </div>

        {loading && (
          <div
            role="status"
            className="mt-5 flex items-center gap-2 rounded-2xl bg-white p-4 text-sm text-muted"
          >
            <LoaderCircle size={18} className="animate-spin" />
            Loading challenge...
          </div>
        )}

        {challengeError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p className="flex items-center gap-2 font-bold">
              <AlertCircle size={18} />
              Could not load challenge
            </p>

            <p className="mt-2">{challengeError}</p>

            <Button
              className="mt-3"
              onClick={() => setRetryKey((key) => key + 1)}
            >
              <RefreshCw size={16} />
              Retry
            </Button>
          </div>
        )}

        <section className="mt-6 rounded-[2rem] bg-forest p-5 text-white sm:p-7">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white/80">
              Your required words
            </span>

            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              {words.length || 3} words
            </span>
          </div>

          {words.length > 0 ? (
            <div className="mt-4 space-y-3">
              {words.map((word, index) => (
                <WordCard
                  key={word.id ?? index}
                  word={word}
                  index={index}
                  onPlayAudio={playWordAudio}
                />
              ))}
            </div>
          ) : !loading && !challengeError ? (
            <p className="mt-4 text-sm text-white/75">
              No words are available for this challenge.
            </p>
          ) : null}
          {speechError && (
            <p role="status" className="mt-3 text-xs leading-5 text-white/75">
              {speechError}
            </p>
          )}
        </section>

        <section className="mt-5 rounded-[2rem] border border-line bg-white p-5 sm:p-7">
          <label
            htmlFor="challenge-language"
            className="text-xs font-black uppercase tracking-wider text-muted"
          >
            Your speaking language
          </label>

          <LanguageSelect
            id="challenge-language"
            value={language}
            onChange={changeLanguage}
          />

          {/* Live attempts and completion state */}
          <div className="my-6 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">Your attempts</p>

              <p className="mt-1 text-xs text-muted">
                {loadingProgress
                  ? "Checking your attempts..."
                  : progressError
                    ? "Attempt status unavailable"
                    : completed
                      ? "You completed today's challenge!"
                      : attemptsRemaining > 0
                        ? `${attemptsRemaining} ${
                            attemptsRemaining === 1 ? "try" : "tries"
                          } remaining`
                        : "No attempts remaining today"}
              </p>
            </div>

            <div
              className="flex gap-2"
              aria-label={`${attemptsRemaining} attempts remaining`}
            >
              {[0, 1].map((index) => (
                <span
                  key={index}
                  className={`size-3 rounded-full ${
                    index < attemptsRemaining
                      ? "bg-forest"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {progressError && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
            >
              {progressError}
              <button
                type="button"
                className="ml-2 font-bold underline"
                onClick={async () => {
                  if (!userId) return;

                  setLoadingProgress(true);
                  setProgressError("");

                  try {
                    const data = await getTodayProgress(userId);
                    setStats(normalizeProgress(data));
                  } catch (error) {
                    setProgressError(
                      error.message || "Unable to load attempts."
                    );
                  } finally {
                    setLoadingProgress(false);
                  }
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex flex-col items-center rounded-3xl bg-cream px-4 py-6 text-center">
            <button
              type="button"
              disabled={
                submitting ||
                loading ||
                loadingProgress ||
                Boolean(challengeError) ||
                !challengeId ||
                (!recording && !canStartRecording)
              }
              onClick={recording ? finishRecording : startRecording}
              className={`grid size-20 place-items-center rounded-full text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                recording
                  ? "animate-pulse bg-[#B84D40]"
                  : "bg-forest"
              }`}
              aria-label={
                recording ? "Stop recording" : "Start recording"
              }
            >
              {submitting ? (
                <LoaderCircle size={31} className="animate-spin" />
              ) : completed && !recording ? (
                <CheckCircle2 size={31} />
              ) : recording ? (
                <Square size={27} fill="currentColor" />
              ) : (
                <Mic size={31} />
              )}
            </button>

            <p className="mt-4 font-black">
              {submitting
                ? "Evaluating your speech..."
                : completed
                  ? "Challenge completed!"
                  : attemptsRemaining <= 0
                    ? "No attempts remaining"
                    : recording
                      ? "Recording your sentence"
                      : "Ready when you are"}
            </p>

            <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
              {submitting
                ? "Sending your recording for evaluation. This may take a moment."
                : completed
                  ? "You've already completed today's challenge."
                  : attemptsRemaining <= 0
                    ? "Come back when your next challenge is available."
                    : recording
                      ? `Tap to stop · ${formattedDuration} / 01:00`
                      : "Allow microphone access, then speak clearly and naturally."}
            </p>
          </div>

          {recordingError && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {recordingError}
            </div>
          )}
        </section>

        <div className="mt-4 flex items-start gap-2 px-1 text-xs leading-5 text-muted">
          <CircleHelp size={17} className="mt-0.5 shrink-0" />
          <p>
            Your sentence must include all three words. Your score and reward
            appear after evaluation.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
