export const languages = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
];

export default function LanguageSelect({
  id = "learning-language",
  value,
  onChange,
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-2xl border border-line bg-[#FCFCF8] px-4 py-3.5 text-sm font-bold outline-none focus:border-forest"
    >
      {languages.map((language) => (
        <option key={language.code} value={language.code}>
          {language.name} — {language.native}
        </option>
      ))}
    </select>
  );
}
