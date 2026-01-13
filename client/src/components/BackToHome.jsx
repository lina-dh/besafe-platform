import { Link } from "react-router-dom";

export default function BackToHome() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
    >
      ← Back to Home
    </Link>
  );
}
