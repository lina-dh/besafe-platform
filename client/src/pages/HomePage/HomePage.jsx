import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-6">
      <h1 className="text-5xl font-extrabold gradient-text">PrivacyShield</h1>

      <p className="text-slate-700 max-w-xl">
        AI-powered tools to help you stay safe online.
      </p>

      <div className="flex gap-4">
        <Link to="/staysafe" className="btn-primary">
          StaySafe Scanner
        </Link>
        <Link to="/consult-ai" className="btn-secondary">
          Consult AI
        </Link>
      </div>
    </div>
  );
}
