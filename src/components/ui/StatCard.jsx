export default function StatCard({ icon, label, value, detail, color = "bg-sage text-forest" }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-4 sm:p-5">
      <span className={`mb-3 grid size-10 place-items-center rounded-2xl ${color}`}>{icon}</span>
      <p className="text-2xl font-black tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs font-bold text-muted">{label}</p>
      {detail && <p className="mt-2 text-[11px] text-muted-light">{detail}</p>}
    </div>
  );
}
