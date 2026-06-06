import { Clock, Trophy, Shield, FileText } from "lucide-react";
import { useState, useEffect } from "react";

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 0,
    minutes: 14,
    seconds: 49,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
            else {
              hours = 23;
              if (days > 0) days--;
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeBlocks = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HOURS", value: timeLeft.hours },
    { label: "MINUTES", value: timeLeft.minutes },
    { label: "SECONDS", value: timeLeft.seconds },
  ];

  return (
    <div className="bg-[#050505] text-white p-8 shadow-sm mb-10">
      <div className="flex items-center gap-2 mb-8">
        <Clock className="w-4 h-4 text-gray-300" />
        <span className="text-sm font-bold tracking-wider text-gray-100">
          TRACK SELECTION DEADLINE
        </span>
      </div>

      <div className="flex items-start justify-between px-8">
        {timeBlocks.map((block, idx) => (
          <div key={block.label} className="flex items-start gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[64px] leading-none font-bold tracking-tight mb-2">
                {block.value.toString().padStart(2, "0")}
              </span>
              <span className="text-xs font-bold tracking-widest text-gray-400">
                {block.label}
              </span>
            </div>
            {idx < timeBlocks.length - 1 && (
              <span className="text-[56px] leading-none font-light text-gray-600 opacity-50 relative -top-2">
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackRegistrationStepper() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">
        Track Registration Flow
      </h2>

      <div className="grid grid-cols-3 bg-white gap-0">
        {/* Step 1 - Active (View Only) */}
        <div className="border-[3px] border-black p-6 bg-white flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight text-left">
              Select
              <br />
              Track
            </h3>
          </div>

          <div className="mt-auto w-full">
            <div className="bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold p-3 w-full outline-none cursor-not-allowed text-center truncate">
              Fintech & Web3 Innovation
            </div>
            <p className="text-xs font-bold text-gray-500 mt-4 tracking-wide uppercase">
              Selected by Team Leader
            </p>
          </div>
        </div>

        {/* Step 2 - Pending */}
        <div className="border-t border-b border-r border-gray-100 p-6 flex flex-col items-center justify-start text-center">
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center font-bold text-sm mb-3">
            2
          </div>
          <h3 className="text-lg font-bold text-gray-400 leading-tight mb-6">
            System
            <br />
            Review
          </h3>

          <div className="flex flex-col items-center justify-center gap-2 mt-auto text-gray-300">
            <Shield className="w-8 h-8 stroke-[1.5]" />
            <span className="text-sm font-semibold mt-1">Pending approval</span>
          </div>
        </div>

        {/* Step 3 - Final */}
        <div className="border-t border-b border-r border-gray-100 p-6 flex flex-col items-center justify-start text-center bg-gray-50/30">
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center font-bold text-sm mb-3">
            3
          </div>
          <h3 className="text-lg font-bold text-gray-400 leading-tight mb-6">
            Final
            <br />
            Status
          </h3>

          <div className="flex flex-col items-center justify-center gap-2 mt-auto text-gray-300">
            <FileText className="w-8 h-8 stroke-[1.5]" />
            <span className="text-sm font-semibold mt-1">
              Approved /<br />
              Rejected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Leaderboard() {
  const rankings = [
    { rank: 1, team: "Alpha Coders", points: 9850, isCurrent: false },
    { rank: 2, team: "Syntax Errors", points: 9420, isCurrent: false },
    { rank: 3, team: "Data Dashers", points: 8900, isCurrent: false },
    { rank: 4, team: "Tech Titans", points: 7950, isCurrent: false },
    { rank: 5, team: "Pixel Pioneers", points: 7200, isCurrent: true },
    { rank: 6, team: "Bug Squashers", points: 6800, isCurrent: false },
  ];

  return (
    <div className="bg-white border border-gray-200 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-200 flex items-center gap-3 shrink-0">
        <Trophy className="w-5 h-5 text-black" />
        <h2 className="text-lg font-bold text-gray-900">Live Rankings</h2>
      </div>

      <div className="flex-1">
        <div className="grid grid-cols-[50px_1fr_60px] px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
          <div>Rank</div>
          <div>Team Name</div>
          <div className="text-right">Score</div>
        </div>

        <div className="divide-y divide-gray-100">
          {rankings.map((team, index) => (
            <div
              key={team.rank}
              className={`grid grid-cols-[50px_1fr_60px] px-5 py-4 items-center ${
                index < 2 ? "bg-gray-50/50" : ""
              }`}
            >
              <div
                className={`font-bold text-sm ${
                  team.rank === 1
                    ? "text-[#20c997]"
                    : team.rank === 2
                      ? "text-gray-500"
                      : team.rank === 3
                        ? "text-[#ff6b6b]"
                        : "text-gray-700"
                }`}
              >
                #{team.rank}
              </div>
              <div className="font-bold text-sm text-gray-900">{team.team}</div>
              <div className="font-bold text-sm text-gray-900 text-right">
                {team.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <div className="max-w-[1200px] mx-auto flex flex-col h-full">
      <header className="mb-10 flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none mb-3">
            Welcome back, Nguyen.
          </h1>
          <p className="text-gray-500 font-medium">
            Track registration is currently active. Don't miss the deadline!
          </p>
        </div>
      </header>

      <div className="flex gap-12 flex-1">
        {/* Main Content Column */}
        <div className="flex-[2] flex flex-col">
          <CountdownTimer />
          <TrackRegistrationStepper />
        </div>

        {/* Right Sidebar Column */}
        <div className="flex-[1] min-w-[300px]">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
