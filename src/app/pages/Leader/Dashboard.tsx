import { useState, useEffect } from "react";
import { Clock, Trophy, Map, ShieldCheck, FileCheck } from "lucide-react";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
// Mock Leaderboard Data
const LEADERBOARD_DATA = [
  { rank: 1, name: "Alpha Coders", score: 9850 },
  { rank: 2, name: "Syntax Errors", score: 9420 },
  { rank: 3, name: "Data Dashers", score: 8900 },
  { rank: 4, name: "Tech Titans", score: 7950 },
  { rank: 5, name: "Pixel Pioneers", score: 7200 },
  { rank: 6, name: "Bug Squashers", score: 6800 },
];

export function Dashboard() {
  const [trackStatus, setTrackStatus] = useState<"selecting" | "approved">(
    "selecting",
  );
  const [selectedTrack, setSelectedTrack] = useState("");

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    isDestructive: boolean;
    hideCancel: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "",
    isDestructive: false,
    hideCancel: false,
    onConfirm: () => {},
  });

  // Mock Data: Track 1 is full, Track 2 has space
  const TRACK_CAPACITIES = {
    track1: { name: "Track 1: Automation & AI", current: 6, max: 6 },
    track2: { name: "Track 2: Web3 & Smart Contracts", current: 3, max: 6 },
  };

  const executeSubmitTrack = () => {
    setTrackStatus("approved");
  };

  const handleSubmitTrack = () => {
    if (!selectedTrack) {
      setModalConfig({
        isOpen: true,
        title: "Track Selection Required",
        description: "Please select a track before submitting.",
        confirmText: "OK",
        isDestructive: true,
        hideCancel: true,
        onConfirm: () => {},
      });
      return;
    }

    const trackInfo =
      TRACK_CAPACITIES[selectedTrack as keyof typeof TRACK_CAPACITIES];

    // Check if the selected track is full
    if (trackInfo && trackInfo.current >= trackInfo.max) {
      setModalConfig({
        isOpen: true,
        title: "Track is Full",
        description:
          "The selected track has reached its maximum capacity. Please choose another track.",
        confirmText: "OK",
        isDestructive: true,
        hideCancel: true,
        onConfirm: () => {},
      });
      return;
    }

    // If not full, proceed to confirmation
    setModalConfig({
      isOpen: true,
      title: "Confirm Track Selection",
      description:
        "Are you sure you want to select this track? Once submitted, it will be finalized and you cannot change it later.",
      confirmText: "Yes, Submit Track",
      isDestructive: false,
      hideCancel: false,
      onConfirm: executeSubmitTrack,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Welcome back, Lap.
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Track registration is currently active. Don't miss the deadline!
        </p>
      </header>

      {/* Grid Layout for Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Countdown & Tracker - Spans 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Top Main Area: Countdown Timer */}
          <div className="bg-primary text-primary-foreground rounded-radius-lg p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white opacity-5 rounded-full blur-xl"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center gap-2 mb-8">
                <Clock className="w-5 h-5 text-primary-foreground/80" />
                <span className="font-bold text-primary-foreground/90 uppercase tracking-wider text-sm">
                  Track Selection Deadline
                </span>
              </div>

              <CountdownTimer
                targetDate={
                  new Date(Date.now() + 1000 * 60 * 60 * 24 + 1000 * 60 * 15)
                }
              />
            </div>
          </div>

          {/* Center Content: Horizontal Status Tracker */}
          <div className="pt-4 pb-2">
            <h2 className="text-xl font-bold mb-6 text-foreground">
              Track Registration Flow
            </h2>
            <div className="flex flex-col md:flex-row gap-6 relative">
              {/* Connecting Line (hidden on small screens) */}
              <div className="hidden md:block absolute top-10 left-10 right-10 h-0.5 bg-border -z-10"></div>

              {/* Step 1: Active or Completed */}
              <div
                className={`flex-1 bg-card border-2 rounded-radius-lg p-6 shadow-sm relative z-10 transition-colors duration-300 ${trackStatus === "selecting" ? "border-primary" : "border-chart-2/50 opacity-90"}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-lg shadow-sm border-2 border-card ${trackStatus === "selecting" ? "bg-primary text-primary-foreground" : "bg-chart-2 text-primary-foreground"}`}
                  >
                    {trackStatus === "selecting" ? (
                      "1"
                    ) : (
                      <FileCheck className="w-5 h-5" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    Select Track
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Map className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select
                      className="w-full pl-9 p-3 bg-input-background border border-border rounded-radius-md text-sm text-foreground font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer disabled:opacity-70"
                      value={selectedTrack}
                      onChange={(e) => setSelectedTrack(e.target.value)}
                      disabled={trackStatus === "approved"}
                    >
                      <option value="" disabled>
                        Choose a track...
                      </option>
                      <option value="track1">
                        Track 1: Automation & AI (
                        {TRACK_CAPACITIES.track1.current}/
                        {TRACK_CAPACITIES.track1.max} Teams - Full)
                      </option>
                      <option value="track2">
                        Track 2: Web3 & Smart Contracts (
                        {TRACK_CAPACITIES.track2.current}/
                        {TRACK_CAPACITIES.track2.max} Teams)
                      </option>
                    </select>
                  </div>
                  {trackStatus === "selecting" ? (
                    <button
                      onClick={handleSubmitTrack}
                      className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-radius-md hover:opacity-90 transition-opacity text-sm shadow-sm"
                    >
                      Submit Track
                    </button>
                  ) : (
                    <div className="w-full bg-chart-2/10 text-chart-2 font-bold py-3 rounded-radius-md text-sm text-center border border-chart-2/20">
                      Track Submitted
                    </div>
                  )}
                  {trackStatus === "selecting" && (
                    <p className="text-xs font-bold text-destructive text-center uppercase tracking-wide">
                      * Requires exactly 5 team members to submit
                    </p>
                  )}
                </div>
              </div>

              {/* Step 2: System Review */}
              <div
                className={`flex-1 border rounded-radius-lg p-6 relative z-10 transition-all duration-300 ${trackStatus === "approved" ? "bg-card border-chart-2/50 opacity-90 shadow-sm" : "bg-muted/10 border-border shadow-none opacity-60 grayscale"}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-lg border-2 border-card ${trackStatus === "approved" ? "bg-chart-2 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}
                  >
                    {trackStatus === "approved" ? (
                      <FileCheck className="w-5 h-5" />
                    ) : (
                      "2"
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    System Review
                  </h3>
                </div>

                <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
                  <ShieldCheck
                    className={`w-8 h-8 ${trackStatus === "approved" ? "text-chart-2" : "text-muted-foreground opacity-50"}`}
                  />
                  <p
                    className={`text-sm font-medium ${trackStatus === "approved" ? "text-chart-2" : "text-muted-foreground"}`}
                  >
                    {trackStatus === "approved"
                      ? "Auto-Approved (Test Mode)"
                      : "Pending approval"}
                  </p>
                </div>
              </div>

              {/* Step 3: Final Status */}
              <div
                className={`flex-1 border rounded-radius-lg p-6 relative z-10 transition-all duration-300 ${trackStatus === "approved" ? "bg-chart-2/5 border-chart-2 shadow-sm" : "bg-muted/10 border-border shadow-none opacity-60 grayscale"}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-lg border-2 border-card ${trackStatus === "approved" ? "bg-chart-2 text-primary-foreground shadow-sm" : "bg-muted-foreground/20 text-muted-foreground"}`}
                  >
                    3
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    Final Status
                  </h3>
                </div>

                <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
                  <FileCheck
                    className={`w-8 h-8 ${trackStatus === "approved" ? "text-chart-2" : "text-muted-foreground opacity-50"}`}
                  />
                  <p
                    className={`text-sm font-medium ${trackStatus === "approved" ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {trackStatus === "approved"
                      ? "Status: Accepted"
                      : "Approved / Rejected with reason"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Leaderboard - Spans 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-radius-lg flex flex-col h-full overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
                <Trophy className="w-5 h-5 text-primary" />
                Live Rankings
              </h2>
            </div>

            <div className="flex-1 p-6 space-y-4 flex flex-col">
              {/* Table Header */}
              <div className="flex text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 border-b border-border/50 pb-2">
                <div className="w-12">Rank</div>
                <div className="flex-1">Team Name</div>
                <div className="text-right w-20">Score</div>
              </div>

              {/* Rows */}
              <div className="space-y-1">
                {LEADERBOARD_DATA.map((team) => (
                  <div
                    key={team.rank}
                    className={`flex items-center p-3 rounded-radius-md transition-colors ${
                      team.rank === 1
                        ? "bg-primary/5 border border-primary/20"
                        : team.rank === 2
                          ? "bg-muted/50 border border-transparent"
                          : team.rank === 3
                            ? "bg-muted/30 border border-transparent"
                            : "hover:bg-muted/20 border border-transparent"
                    }`}
                  >
                    <div className="w-12 font-bold">
                      {team.rank === 1 ? (
                        <span className="text-chart-2">#1</span>
                      ) : team.rank === 2 ? (
                        <span className="text-muted-foreground">#2</span>
                      ) : team.rank === 3 ? (
                        <span className="text-destructive/70">#3</span>
                      ) : (
                        <span className="text-muted-foreground">
                          #{team.rank}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 font-semibold text-foreground text-sm">
                      {team.name}
                    </div>
                    <div className="text-right w-20 font-mono text-sm font-bold text-primary">
                      {team.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border text-center bg-muted/10">
              <button className="text-sm text-primary hover:underline font-bold transition-colors">
                View All Team Names
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText={modalConfig.confirmText}
        isDestructive={modalConfig.isDestructive}
        hideCancel={modalConfig.hideCancel}
      />
    </div>
  );
}

// --- Helper Components ---

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +targetDate - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-4 sm:gap-8 items-center">
      <TimeUnit value={timeLeft.days} label="Days" />
      <TimeDivider />
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <TimeDivider />
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <TimeDivider hiddenOnSmall />
      <TimeUnit value={timeLeft.seconds} label="Seconds" hiddenOnSmall />
    </div>
  );
}

function TimeUnit({
  value,
  label,
  hiddenOnSmall = false,
}: {
  value: number;
  label: string;
  hiddenOnSmall?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center ${hiddenOnSmall ? "hidden sm:flex" : "flex"}`}
    >
      <span className="text-5xl sm:text-7xl font-bold font-mono tracking-tighter drop-shadow-sm">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-primary-foreground/80 text-sm font-bold mt-1 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

function TimeDivider({ hiddenOnSmall = false }: { hiddenOnSmall?: boolean }) {
  return (
    <div
      className={`text-4xl sm:text-6xl font-light text-primary-foreground/30 -mt-6 ${hiddenOnSmall ? "hidden sm:block" : "block"}`}
    >
      :
    </div>
  );
}
