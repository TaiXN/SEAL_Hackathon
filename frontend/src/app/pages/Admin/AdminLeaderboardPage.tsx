import { useState, useEffect } from "react";
import { BarChart2, Filter, Loader2, Medal, Trophy } from "lucide-react";
import Swal from "sweetalert2";
import { eventApi } from "../../lib/api/eventApi";
import { roundApi } from "../../lib/api/roundApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { leaderboardApi } from "../../lib/api/leaderboardApi";

export function AdminLeaderboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");

  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch initial events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventApi.getAllEvents();
        setEvents(res || []);
      } catch (err) {
        console.error("Error loading events", err);
      }
    };
    fetchEvents();
  }, []);

  // 2. Load Rounds & Tracks when Event changes
  useEffect(() => {
    if (!selectedEventId) return;
    const fetchDetails = async () => {
      try {
        const [allRounds, allTracks] = await Promise.all([
          roundApi.getAllRounds(),
          trackTopicApi.getAllTracks(),
        ]);

        const filteredRounds = allRounds.filter(
          (r: any) => String(r.eventId || r.eventID) === selectedEventId,
        );
        const filteredTracks = allTracks.filter(
          (t: any) => String(t.eventId || t.eventID) === selectedEventId,
        );

        setRounds(filteredRounds);
        setTracks(filteredTracks);

        // Reset lower selections
        setSelectedRoundId("");
        setSelectedTrackId("");
        setLeaderboardData([]);
      } catch (error) {
        console.error("Error loading details", error);
      }
    };
    fetchDetails();
  }, [selectedEventId]);

  // 3. Call Leaderboard API when Round & Track are selected
  useEffect(() => {
    if (!selectedRoundId || !selectedTrackId) return;

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const data = await leaderboardApi.getLeaderboardByRoundAndTrack(
          selectedRoundId,
          selectedTrackId,
        );
        setLeaderboardData(data || []);
      } catch (error: any) {
        Swal.fire("Error", "Failed to fetch leaderboard data!", "error");
        setLeaderboardData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedRoundId, selectedTrackId]);

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER TITLE */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart2 size={32} className="text-blue-500" />
            Tournament Leaderboard
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            View real-time scores and rankings of teams across all tracks.
          </p>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 items-end">
          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">
              1. Select Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="" disabled>
                -- Choose an Event --
              </option>
              {events.map((e) => {
                const eId = e.eventID || e.eventId || e.id;
                return (
                  <option key={eId} value={eId}>
                    {e.name || e.eventName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">
              2. Select Round
            </label>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              disabled={!selectedEventId}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <option value="" disabled>
                -- Choose a Round --
              </option>
              {rounds.map((r) => {
                const rId = r.roundID || r.roundId || r.id;
                return (
                  <option key={rId} value={rId}>
                    {r.roundName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">
              3. Select Track
            </label>
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              disabled={!selectedRoundId}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <option value="" disabled>
                -- Choose a Track --
              </option>
              {tracks.map((t) => {
                const tId = t.trackID || t.trackId || t.id;
                return (
                  <option key={tId} value={tId}>
                    {t.trackName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* LEADERBOARD RESULT */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 my-20">
              <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
              <p className="font-bold">Calculating scores...</p>
            </div>
          ) : !selectedRoundId || !selectedTrackId ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 my-20">
              <Filter size={56} className="mb-5 opacity-20" />
              <p className="font-medium text-slate-500">
                Please select Event, Round, and Track to view the leaderboard.
              </p>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 my-20 bg-slate-50 mx-8 rounded-2xl border-2 border-dashed border-slate-200">
              <Medal size={56} className="mb-4 text-slate-300" />
              <p className="font-bold text-slate-500 text-lg">
                No teams have been graded in this track yet!
              </p>
              <p className="text-sm mt-1">
                Please wait for the judges to complete their evaluations.
              </p>
            </div>
          ) : (
            <div className="w-full">
              {/* BEAUTIFUL SOFTER HEADER */}
              <div className="flex items-center bg-slate-50/80 border-b border-slate-200 px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-24 text-center">Rank</div>
                <div className="flex-1 px-6">Team Name</div>
                <div className="w-36 text-center">Total Score</div>
              </div>

              {/* LIST OF TEAMS */}
              <div className="divide-y divide-slate-100/60">
                {[...leaderboardData]
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((team, index) => {
                    // STYLING LOGIC FOR TOP 3
                    let rankIcon = null;
                    let rowClass =
                      "hover:bg-slate-50 bg-white transition-colors";
                    let rankTextClass = "text-slate-400 font-bold";
                    let scoreBgClass =
                      "bg-slate-100 text-slate-600 border border-slate-200";

                    if (index === 0) {
                      rankIcon = (
                        <Trophy
                          size={28}
                          className="text-amber-400 drop-shadow-md mb-1"
                        />
                      );
                      rowClass =
                        "bg-gradient-to-r from-amber-50/50 to-white hover:from-amber-50 transition-colors";
                      rankTextClass = "text-amber-600 font-black";
                      scoreBgClass =
                        "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md shadow-amber-200 border-none";
                    } else if (index === 1) {
                      rankIcon = (
                        <Medal
                          size={28}
                          className="text-slate-400 drop-shadow-sm mb-1"
                        />
                      );
                      rowClass =
                        "bg-gradient-to-r from-slate-50/80 to-white hover:from-slate-100 transition-colors";
                      rankTextClass = "text-slate-500 font-black";
                      scoreBgClass =
                        "bg-slate-200 text-slate-700 border border-slate-300";
                    } else if (index === 2) {
                      rankIcon = (
                        <Medal
                          size={28}
                          className="text-amber-700/80 drop-shadow-sm mb-1"
                        />
                      );
                      rowClass =
                        "bg-gradient-to-r from-orange-50/50 to-white hover:from-orange-50 transition-colors";
                      rankTextClass = "text-amber-800 font-black";
                      scoreBgClass =
                        "bg-orange-100 text-amber-900 border border-orange-200";
                    }

                    return (
                      <div
                        key={team.teamInRoundId || index}
                        className={`flex items-center px-8 py-5 ${rowClass}`}
                      >
                        {/* COLUMN 1: RANK */}
                        <div className="w-24 flex flex-col items-center justify-center">
                          {rankIcon ? (
                            <>
                              {rankIcon}
                              <span
                                className={`text-[10px] mt-0.5 ${rankTextClass}`}
                              >
                                TOP {index + 1}
                              </span>
                            </>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg shadow-sm">
                              {index + 1}
                            </div>
                          )}
                        </div>

                        {/* COLUMN 2: TEAM NAME (ID Removed for UI/UX) */}
                        <div className="flex-1 px-6 flex items-center">
                          <p
                            className={`font-bold text-lg ${index < 3 ? "text-slate-800" : "text-slate-600"}`}
                          >
                            {team.teamName || "Anonymous Team"}
                          </p>
                        </div>

                        {/* COLUMN 3: SCORE */}
                        <div className="w-36 flex justify-center">
                          <div
                            className={`px-4 py-2 rounded-2xl font-black text-xl flex flex-col items-center min-w-[100px] justify-center ${scoreBgClass}`}
                          >
                            <span>{Number(team.score || 0).toFixed(2)}</span>
                            <span
                              className={`text-[9px] uppercase tracking-widest -mt-1 font-bold ${
                                index === 0
                                  ? "text-amber-100"
                                  : "text-slate-400"
                              }`}
                            >
                              Points
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
