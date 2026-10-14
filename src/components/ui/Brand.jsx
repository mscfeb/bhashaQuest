import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-2xl bg-forest text-white"><Sparkles size={21} /></span>
      <span className="text-lg font-black tracking-tight text-ink">bhasha<span className="text-gold-deep">quest</span></span>
    </Link>
  );
}
