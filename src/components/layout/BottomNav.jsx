import { NavLink } from "react-router-dom";
import { Home, BookOpen, ChartNoAxesCombined, Trophy } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/challenge", label: "Challenge", Icon: BookOpen },
  { to: "/progress", label: "Progress", Icon: ChartNoAxesCombined },
  { to: "/leaderboard", label: "Rankings", Icon: Trophy },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-xl justify-around">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-xs font-medium ${
                isActive
                  ? "text-emerald-700"
                  : "text-stone-500 hover:text-stone-800"
              }`
            }
          >
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}