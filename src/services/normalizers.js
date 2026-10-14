import { languages } from "../components/challenge/LanguageSelect";

const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

export function getChallengeWords(challenge) {
  const words = challenge?.words ?? challenge?.challenge_words ?? challenge?.items;
  return Array.isArray(words) ? words : [];
}

function findTranslation(word, language) {
  const translations = word?.translations ?? word?.translation ?? word?.localized ?? word?.localizations;

  if (Array.isArray(translations)) {
    return translations.find((item) =>
      [item.language, item.language_code, item.code, item.locale].some(
        (code) => String(code ?? "").toLowerCase() === language.toLowerCase()
      )
    );
  }

  if (translations && typeof translations === "object") {
    return translations[language] ?? translations[language.toUpperCase()];
  }

  return null;
}


  
export function normalizeWord(word, selectedLanguage = "en") {
  if (!word || typeof word !== "object") {
    return {
      id: undefined,
      english: "",
      translated: "",
      transliteration: "",
      englishMeaning: "",
      meaningNote: "",
      language: selectedLanguage,
      raw: word,
    };
  }

  const english =
    word.englishWord ??
    word.english_word ??
    word.english ??
    word.word ??
    "";

  // The backend uses "translatedWord" for the selected translation.
  const translated =
    word.translatedWord ??
    word.translated_word ??
    word.translated ??
    word.translation ??
    "";

  return {
    id: word.id ?? word.position,
    english,
    translated,
    transliteration:
      word.transliteration ?? word.transliterationText ?? "",
    englishMeaning:
      word.englishMeaning ?? word.english_meaning ?? "",
    meaningNote: word.meaningNote ?? word.meaning_note ?? "",
    language: word.language ?? selectedLanguage,
    raw: word,
  };
}



export function getLanguageName(code) {
  return languages.find((language) => language.code === code)?.name ?? code;
}


export function normalizeProgress(progress) {
  if (!progress) {
    return {
      streak: 0,
      totalXp: 0,
      challengesWon: 0,
      bestScore: 0,
      attemptsRemaining: 2,
      attemptsUsed: 0,
      completed: false,
      xpEarnedToday: 0,
    };
  }

  return {
    ...progress,
    streak:
      progress.currentStreak ??
      progress.current_streak ??
      progress.streak ??
      0,
    totalXp:
      progress.totalXp ??
      progress.total_xp ??
      0,
    challengesWon:
      progress.challengesWon ??
      progress.challenges_won ??
      0,
    bestScore:
      progress.bestScore ??
      progress.best_score ??
      0,
    attemptsRemaining:
      progress.attemptsRemaining ??
      progress.attempts_remaining ??
      2,
    attemptsUsed:
      progress.attemptsUsed ??
      progress.attempts_used ??
      0,
    completed: progress.completed ?? false,
    xpEarnedToday:
      progress.xpEarnedToday ??
      progress.xp_earned_today ??
      0,
  };
}


export function normalizeSubmission(result) {
  const data = result?.submission && typeof result.submission === "object"
    ? { ...result, ...result.submission }
    : result ?? {};
  return {
    raw: result,
    score: Number(first(data.score, data.total_score, data.evaluation_score, data.rating, 0)),
    passed: Boolean(first(data.passed, data.is_passed, data.success, false)),
    xpAwarded: Number(first(data.xp_awarded, data.xpAwarded, data.earned_xp, data.xp_earned, data.xpEarned, 0)),
    feedback: String(first(data.feedback, data.overall_feedback, data.message, data.explanation, "Your recording has been evaluated.")),
    transcript: String(first(data.transcript, data.transcription, data.recognized_text, data.language)),
    attemptsRemaining: first(data.attempts_remaining, data.attemptsRemaining, null),
    submissionId: first(data.id, data.submission_id, data.submissionId, null),
    bestScore: first(data.best_score, data.bestScore, null),
  };
}
