export default function XpChart({ history = [] }) {
  const maxXp = Math.max(10, ...history.map((item) => item.xp || 0));

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-stone-900">XP earned</h2>
          <p className="text-sm text-stone-500">Your daily learning activity</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
          Last {history.length} days
        </span>
      </div>

      {history.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">
          No XP history yet. Complete a challenge to get started!
        </p>
      ) : (
        <div
          className="grid min-h-48 items-end gap-2"
          style={{
            gridTemplateColumns: `repeat(${history.length}, minmax(0, 1fr))`,
          }}
        >
          {history.map((item) => {
            const height = Math.max(4, ((item.xp || 0) / maxXp) * 130);

            return (
              <div
                key={item.date}
                className="flex h-full flex-col items-center justify-end gap-2"
                title={`${item.date}: ${item.xp} XP`}
              >
                <span className="text-xs font-medium text-stone-600">
                  {item.xp || 0}
                </span>
                <div
                  className="w-full max-w-8 rounded-t-lg bg-emerald-600 transition-all"
                  style={{ height: `${height}px` }}
                />
                <span className="text-xs text-stone-500">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}