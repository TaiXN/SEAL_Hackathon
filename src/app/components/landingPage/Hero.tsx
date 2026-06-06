import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();
  return (
    <section
      id="about"
      className="relative w-full py-24 md:py-32 flex flex-col items-center justify-center text-center border-b border-zinc-200 bg-zinc-50"
    >
      {/* Subtle Tech Geometric Pattern (Dot Grid) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, #a1a1aa 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-4xl px-6 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6 leading-tight">
          Innovate the Future:
          <br className="hidden md:block" /> SEAL Hackathon 2026
        </h1>

        <p className="text-lg md:text-xl text-zinc-600 mb-10 max-w-2xl">
          Build scalable, real-world software solutions. Join top engineering
          talent to collaborate, create, and solve tomorrow's challenges today.
        </p>

        <button
          className="px-8 py-4 text-base font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors w-full sm:w-auto"
          onClick={() => navigate("/login")}
        >
          Join the Hackathon
        </button>
      </div>
    </section>
  );
}
