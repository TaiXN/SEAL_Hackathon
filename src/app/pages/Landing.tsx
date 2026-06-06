import { Navigation } from "../components/landingPage/Navigation";
import { Hero } from "../components/landingPage/Hero";
import { TimelineSection } from "../components/landingPage/TimelineSection";
import { TracksSection } from "../components/landingPage/TracksSection";
import { PrizesSection } from "../components/landingPage/PrizesSection";

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200">
      <Navigation />
      <main>
        <Hero />
        <TimelineSection />
        <TracksSection />
        <PrizesSection />
      </main>

      {/* Minimalist Footer */}
      <footer className="w-full border-t border-zinc-200 bg-zinc-50 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-sm text-zinc-500">
          <p>© 2026 SEAL Hackathon. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-zinc-900 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-zinc-900 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-zinc-900 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
