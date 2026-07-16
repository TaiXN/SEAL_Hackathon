import {
  Hexagon,
  ArrowRight,
  Code,
  Trophy,
  Users,
  Calendar,
  Zap,
  Layout,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo(0, 0)}
          >
            <Hexagon className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
            <span className="font-black text-xl tracking-tight">
              SEAL Hackathon
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() =>
                navigate("/login", { state: { view: "register" } })
              }
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
            >
              Register Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-8">
          <Zap size={16} /> <span>Summer 2026 Registration is Open</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 max-w-4xl">
          Build the Future of <br />{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Technology Today.
          </span>
        </h1>
        <p className="text-xl text-slate-500 mb-12 max-w-2xl font-medium leading-relaxed">
          Join the most prestigious university hackathon. Collaborate, innovate,
          and compete for massive prizes across multiple cutting-edge tracks.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("/login", { state: { view: "register" } })}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-full hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            Join the Hackathon <ArrowRight size={20} />
          </button>
          <button
            onClick={() =>
              document
                .getElementById("tracks")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-8 py-4 bg-white text-slate-700 border border-slate-200 text-lg font-bold rounded-full hover:bg-slate-50 transition-all"
          >
            View Tracks
          </button>
        </div>
      </section>

      {/* Stats / Info */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: Users, label: "Participants", value: "500+" },
            { icon: Code, label: "Lines of Code", value: "1M+" },
            { icon: Trophy, label: "Prize Pool", value: "$50,000" },
            { icon: Calendar, label: "Hours to Build", value: "48H" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-6"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <stat.icon size={32} />
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-2">
                {stat.value}
              </h3>
              <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tracks Section */}
      <section id="tracks" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Competition Tracks</h2>
          <p className="text-lg text-slate-500 font-medium">
            Choose your domain and build something extraordinary.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Web Development",
              icon: Layout,
              color: "text-blue-500",
              bg: "bg-blue-50",
              desc: "Build scalable, responsive, and beautiful web applications solving real-world problems.",
            },
            {
              title: "Artificial Intelligence",
              icon: Zap,
              color: "text-amber-500",
              bg: "bg-amber-50",
              desc: "Leverage machine learning and LLMs to create intelligent, automated solutions.",
            },
            {
              title: "Internet of Things",
              icon: Code,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
              desc: "Connect hardware and software to build smart devices for a sustainable future.",
            },
          ].map((track, idx) => (
            <div
              key={idx}
              className="p-8 bg-white rounded-3xl border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${track.bg} ${track.color} flex items-center justify-center mb-6`}
              >
                <track.icon size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3">{track.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                {track.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center">
        <p className="text-slate-500 font-bold text-sm">
          © 2026 SEAL Hackathon System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
