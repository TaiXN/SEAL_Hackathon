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

        setSelectedRoundId("");
        setSelectedTrackId("");
        setLeaderboardData([]);
      } catch (error) {
        console.error("Error loading details", error);
      }
    };
    fetchDetails();
  }, [selectedEventId]);

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
    <main className="w-full bg-[#f4f6f8] min-h-screen p-10 animate-in fade-in duration-500 font-sans selection:bg-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold text-[#0a192f] tracking-tight flex items-center gap-3">
            <BarChart2 size={36} className="text-blue-500" strokeWidth={2.5} />
            Tournament Leaderboard
          </h2>
          <p className="text-slate-500 font-medium mt-2 text-base">
            View real-time scores and rankings of teams across all tracks.
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block px-1">
              1. Select Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[#0a192f] text-sm font-semibold rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              <option value="" disabled>
                -- Choose an Event --
              </option>
              {events.map((e) => (
                <option
                  key={e.eventID || e.eventId || e.id}
                  value={e.eventID || e.eventId || e.id}
                >
                  {e.name || e.eventName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block px-1">
              2. Select Round
            </label>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              disabled={!selectedEventId}
              className="w-full bg-slate-50 border border-slate-200 text-[#0a192f] text-sm font-semibold rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 transition-all cursor-pointer"
            >
              <option value="" disabled>
                -- Choose a Round --
              </option>
              {rounds.map((r) => (
                <option
                  key={r.roundID || r.roundId || r.id}
                  value={r.roundID || r.roundId || r.id}
                >
                  {r.roundName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block px-1">
              3. Select Track
            </label>
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              disabled={!selectedRoundId}
              className="w-full bg-slate-50 border border-slate-200 text-[#0a192f] text-sm font-semibold rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 transition-all cursor-pointer"
            >
              <option value="" disabled>
                -- Choose a Track --
              </option>
              {tracks.map((t) => (
                <option
                  key={t.trackID || t.trackId || t.id}
                  value={t.trackID || t.trackId || t.id}
                >
                  {t.trackName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[400px] flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 my-20">
              <Loader2 size={40} className="animate-spin text-[#0a192f] mb-4" />
              <p className="font-bold">Calculating scores...</p>
            </div>
          ) : !selectedRoundId || !selectedTrackId ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 my-20">
              <Filter size={56} className="mb-5 opacity-20" />
              <p className="font-medium text-slate-500 text-sm">
                Please select Event, Round, and Track to view the leaderboard.
              </p>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 my-20 bg-slate-50/50 mx-10 rounded-3xl border border-dashed border-slate-200">
              <Medal
                size={48}
                className="mb-4 text-slate-300"
                strokeWidth={1.5}
              />
              <p className="font-bold text-slate-500 text-lg">
                No teams have been graded in this track yet!
              </p>
              <p className="text-sm mt-1 font-medium">
                Please wait for the judges to complete their evaluations.
              </p>
            </div>
          ) : (
            <div className="w-full pb-4">
              <div className="flex items-center bg-slate-50/80 border-b border-slate-100 px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                <div className="w-24 text-center">Rank</div>
                <div className="flex-1 px-6">Team Name</div>
                <div className="w-36 text-center">Total Score</div>
              </div>

              <div className="divide-y divide-slate-50/80">
                {[...leaderboardData]
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((team, index) => {
                    let rankIcon = null;
                    let rowClass =
                      "hover:bg-slate-50 bg-white transition-colors";
                    let rankTextClass = "text-slate-400 font-extrabold";
                    let scoreBgClass =
                      "bg-slate-50 text-slate-600 border border-slate-100 shadow-sm";

                    if (index === 0) {
                      rankIcon = (
                        <Trophy
                          size={32}
                          className="text-amber-400 drop-shadow-sm mb-1"
                          strokeWidth={2}
                        />
                      );
                      rowClass =
                        "bg-gradient-to-r from-amber-50/30 to-white hover:from-amber-50/60 transition-colors";
                      rankTextClass = "text-amber-600 font-extrabold";
                      scoreBgClass =
                        "bg-gradient-to-tr from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-200/50 border-none";
                    } else if (index === 1) {
                      rankIcon = (
                        <Medal
                          size={32}
                          className="text-slate-400 drop-shadow-sm mb-1"
                          strokeWidth={2}
                        />
                      );
                      rowClass =
                        "bg-gradient-to-r from-slate-50/50 to-white hover:from-slate-100/50 transition-colors";
                      rankTextClass = "text-slate-500 font-extrabold";
                      scoreBgClass =
                        "bg-slate-200 text-slate-700 border border-slate-200 shadow-sm";
                    } else if (index === 2) {
                      rankIcon = (
                        <Medal
                          size={32}
                          className="text-amber-700/70 drop-shadow-sm mb-1"
                          strokeWidth={2}
                        />
                      );
                      rowClass =
                        "bg-gradient-to-r from-orange-50/30 to-white hover:from-orange-50/60 transition-colors";
                      rankTextClass = "text-amber-800 font-extrabold";
                      scoreBgClass =
                        "bg-orange-100 text-amber-900 border border-orange-200 shadow-sm";
                    }

                    return (
                      <div
                        key={team.teamInRoundId || index}
                        className={`flex items-center px-8 py-6 ${rowClass}`}
                      >
                        <div className="w-24 flex flex-col items-center justify-center">
                          {rankIcon ? (
                            <>
                              {rankIcon}
                              <span
                                className={`text-[10px] mt-1 tracking-wider ${rankTextClass}`}
                              >
                                TOP {index + 1}
                              </span>
                            </>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-extrabold text-lg shadow-sm">
                              {index + 1}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 px-8 flex items-center">
                          <p
                            className={`font-extrabold text-xl ${index < 3 ? "text-[#0a192f]" : "text-slate-600"}`}
                          >
                            {team.teamName || "Anonymous Team"}
                          </p>
                        </div>

                        <div className="w-36 flex justify-center">
                          <div
                            className={`px-5 py-2.5 rounded-2xl font-extrabold text-2xl flex flex-col items-center min-w-[110px] justify-center ${scoreBgClass}`}
                          >
                            <span>{Number(team.score || 0).toFixed(2)}</span>
                            <span
                              className={`text-[9px] uppercase tracking-widest mt-0.5 font-bold ${index === 0 ? "text-amber-100" : "text-slate-400"}`}
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
