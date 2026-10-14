import { Volume2 } from "lucide-react";

export default function WordCard({ word, index, onPlayAudio }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-black text-gold">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{word.english}</p>
        <p className="mt-1 text-sm text-white/75">{word.translated}</p>
        {word.pronunciation && (
          <p className="mt-1 text-xs text-white/55">{word.pronunciation}</p>
        )}
      </div>
      <button
        type="button"
        aria-label={`Hear ${word.english}`}
        onClick={() => onPlayAudio?.(word)}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white"
      >
        <Volume2 size={19} className="pointer-events-none" />
      </button>
    </div>
  );
}
