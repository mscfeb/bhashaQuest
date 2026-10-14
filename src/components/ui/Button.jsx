
import { Link } from "react-router-dom";

const variants = {
  primary: "bg-forest text-white hover:bg-forest-dark",
  secondary: "border border-line bg-white text-ink hover:bg-cream",
  gold: "bg-gold text-[#332B19] hover:bg-[#EAB03B]",
  soft: "bg-sage text-forest hover:bg-sage-dark",
};

export default function Button({
  children,
  onClick,
  to,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
  ...props
}) {
  const classes = [
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition",
    variants[variant] ?? variants.primary,
    disabled
      ? "cursor-not-allowed opacity-50 pointer-events-none"
      : "active:scale-[0.98]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Navigation button: don't render a clickable Link when disabled.
  if (to && disabled) {
    return (
      <span
        className={classes}
        aria-disabled="true"
        {...props}
      >
        {children}
      </span>
    );
  }

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        onClick={onClick}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
