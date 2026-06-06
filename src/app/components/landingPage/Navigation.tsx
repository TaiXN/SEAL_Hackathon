import { Command } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Navigation() {
  const navigate = useNavigate();
  return (
    <nav className="w-full border-b border-zinc-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-900">
          <Command className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight">SEAL</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
          <a href="#about" className="hover:text-zinc-900 transition-colors">
            About
          </a>
          <a href="#timeline" className="hover:text-zinc-900 transition-colors">
            Timeline
          </a>
          <a href="#tracks" className="hover:text-zinc-900 transition-colors">
            Tracks
          </a>
          <a href="#prizes" className="hover:text-zinc-900 transition-colors">
            Prizes
          </a>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <button
            className="font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
          <button
            className="px-5 py-2.5 font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors"
            onClick={() => navigate("/login")}
          >
            Sign up
          </button>
        </div>
      </div>
    </nav>
  );
}
