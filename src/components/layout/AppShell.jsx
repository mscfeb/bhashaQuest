import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Brand from "../ui/Brand";
import BottomNav from "./BottomNav";
import { invalidateApiCache } from "../../services/api";

export default function AppShell({ children }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("user");
    invalidateApiCache();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <Brand />
        <button
          type="button"
          onClick={handleLogout}
          className="grid size-10 place-items-center rounded-full border border-line bg-white"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={19} />
        </button>
      </header>
      <main className="mx-auto w-full max-w-5xl px-5 pb-28 sm:px-8 sm:pb-12">{children}</main>
      <BottomNav />
    </div>
  );
}
