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
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900 font-sans selection:bg-slate-200">
      {/* ================= NAVIGATION ================= */}
      <nav className="w-full bg-white shadow-sm border-b border-slate-200 fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo(0, 0)}
          >
            <Hexagon className="w-8 h-8 text-[#0a192f]" strokeWidth={2.5} />
            <span className="font-black text-xl tracking-tight text-[#0a192f]">
              SEAL Hackathon
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-[#0a192f] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() =>
                navigate("/login", { state: { view: "register" } })
              }
              className="px-6 py-2.5 bg-[#0a192f] text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md"
            >
              Register Now
            </button>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="pt-40 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-600 text-sm font-bold mb-8 border-2 border-slate-200 shadow-sm">
          <Zap size={16} className="text-[#0a192f]" />{" "}
          <span>Summer 2026 Registration is Open</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 max-w-4xl text-[#0a192f]">
          Build the Future of <br /> Technology Today.
        </h1>

        <p className="text-xl text-slate-500 mb-12 max-w-2xl font-medium leading-relaxed">
          Join the most prestigious university hackathon. Collaborate, innovate,
          and compete for massive prizes across multiple cutting-edge tracks.
        </p>

        <div className="flex flex-col sm:flex-row gap-5">
          {/* Nút bấm 3D Effect - Navy */}
          <button
            onClick={() => navigate("/login", { state: { view: "register" } })}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0a192f] text-white border-2 border-[#0a192f] border-b-[6px] hover:border-b-black hover:bg-slate-900 hover:-translate-y-1 active:border-b-[2px] active:translate-y-1 text-lg font-black rounded-2xl transition-all"
          >
            Join the Hackathon <ArrowRight size={20} />
          </button>

          {/* Nút bấm 3D Effect - White */}
          <button
            onClick={() =>
              document
                .getElementById("tracks")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="flex items-center justify-center px-8 py-4 bg-white text-[#0a192f] border-2 border-slate-200 border-b-[6px] hover:border-slate-300 hover:-translate-y-1 active:border-b-[2px] active:translate-y-1 text-lg font-black rounded-2xl transition-all"
          >
            View Tracks
          </button>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section className="py-20 bg-white border-y border-slate-200 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: Users, label: "Participants", value: "500+" },
            { icon: Code, label: "Lines of Code", value: "1M+" },
            { icon: Trophy, label: "Prize Pool", value: "5,000,000" },
            { icon: Calendar, label: "Hours to Build", value: "48H" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-6 group cursor-default"
            >
              <div className="w-16 h-16 bg-slate-50 text-[#0a192f] border border-slate-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#0a192f] group-hover:text-white transition-all shadow-sm">
                <stat.icon size={32} />
              </div>
              <h3 className="text-4xl font-black text-[#0a192f] mb-2">
                {stat.value}
              </h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TRACKS SECTION (3D CARDS) ================= */}
      <section id="tracks" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4 text-[#0a192f]">
            Competition Tracks
          </h2>
          <p className="text-lg text-slate-500 font-medium">
            Choose your domain and build something extraordinary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Web Development",
              icon: Layout,
              desc: "Build scalable, responsive, and robust web applications solving real-world problems.",
            },
            {
              title: "Artificial Intelligence",
              icon: Zap,
              desc: "Leverage machine learning and LLMs to create intelligent, automated solutions.",
            },
            {
              title: "Internet of Things",
              icon: Code,
              desc: "Connect hardware and software to build smart devices for a sustainable future.",
            },
          ].map((track, idx) => (
            <div
              key={idx}
              className="bg-white rounded-[2rem] border-2 border-slate-200 border-b-[8px] p-10 hover:border-b-[#0a192f] hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col group cursor-default"
            >
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-[#0a192f] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#0a192f] group-hover:text-white transition-colors shadow-sm">
                <track.icon size={30} />
              </div>
              <h3 className="text-2xl font-black mb-4 text-[#0a192f]">
                {track.title}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed flex-1">
                {track.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-10 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0 opacity-50 grayscale">
            <Hexagon className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
            <span className="font-black text-lg tracking-tight text-slate-900">
              SEAL Hackathon
            </span>
          </div>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">
            © 2026 SEAL Hackathon System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
