import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Target,
  Activity,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  LayoutGrid,
  Plus,
} from "lucide-react";

import { roundApi } from "../../lib/api/roundApi";
import { eventApi } from "../../lib/api/eventApi";

const getList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

const formatDate = (d: any): string => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const eventId = (e: any): string =>
  String(e?.id || e?.eventId || e?.eventID || "");

const roundIdx = (r: any): number =>
  Number(r?.roundIndex ?? r?.RoundIndex ?? r?.roundindex ?? 0);
const roundTopN = (r: any): number =>
  Number(
    r?.topNpromotion ?? r?.topNPromotion ?? r?.TopNPromotion ?? r?.topN ?? 0,
  );

type EnrichedEvent = {
  raw: any;
  id: string;
  name: string;
  semester: string;
  year: any;
  cur: number;
  numRounds: number;
  status: "ongoing" | "upcoming" | "ended" | "unknown";
  curRound: any | null;
};

export function Dashboard() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState<EnrichedEvent[]>([]);

  const fetchData = async (manual = false) => {
    try {
      if (manual) setIsRefreshing(true);
      else setIsLoading(true);

      const [allEventsRaw, allRoundsRaw] = await Promise.all([
        eventApi.getAllEvents(),
        roundApi.getAllRounds(),
      ]);
      const allEvents = getList(allEventsRaw);
      const allRounds = getList(allRoundsRaw);

      const roundsByEvent: Record<string, any[]> = {};
      allRounds.forEach((r: any) => {
        const eid = String(r.eventID || r.eventId);
        (roundsByEvent[eid] ||= []).push(r);
      });
      Object.values(roundsByEvent).forEach((list) =>
        list.sort((a, b) => roundIdx(a) - roundIdx(b)),
      );

      const enriched: EnrichedEvent[] = allEvents.map((e: any) => {
        const id = eventId(e);
        const rounds = roundsByEvent[id] || [];
        const numRounds = rounds.length;
        const curRaw = e.currentRound;
        const cur =
          curRaw === undefined || curRaw === null ? NaN : Number(curRaw);

        let status: EnrichedEvent["status"];
        if (Number.isNaN(cur)) status = "unknown";
        else if (cur < 0) status = "upcoming";
        else if (cur >= (numRounds || 2)) status = "ended";
        else status = "ongoing";

        const pos = cur >= 0 && cur < numRounds ? cur : numRounds > 0 ? 0 : -1;
        const curRound = pos >= 0 ? rounds[pos] : null;

        return {
          raw: e,
          id,
          name: e.name || e.eventName || "(Event)",
          semester: e.semester || e.season || "—",
          year: e.year || e.Year || "",
          cur: Number.isNaN(cur) ? 0 : cur,
          numRounds,
          status,
          curRound: curRound
            ? { ...curRound, _displayIndex: pos, _topN: roundTopN(curRound) }
            : null,
        };
      });

      setEvents(enriched);
    } catch (err) {
      console.error("Error loading Dashboard:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw size={24} className="animate-spin mr-3 text-[#0a192f]" />
        <span className="font-bold tracking-widest uppercase text-sm">
          Loading Overview...
        </span>
      </div>
    );
  }

  const ongoing = events.filter((e) => e.status === "ongoing");
  const ended = events.filter((e) => e.status === "ended");

  const stats = [
    {
      label: "Ongoing",
      value: ongoing.length,
      icon: <Activity size={24} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Ended",
      value: ended.length,
      icon: <CheckCircle2 size={24} />,
      color: "text-slate-500",
      bg: "bg-slate-50 border-slate-200",
    },
    {
      label: "Total Events",
      value: events.length,
      icon: <LayoutGrid size={24} />,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
    },
  ];

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 font-sans selection:bg-slate-200">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-[#0a192f] tracking-tight flex items-center gap-4">
            Dashboard
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              title="Refresh"
              className="p-2.5 bg-white border-2 border-slate-200 text-slate-400 hover:text-[#0a192f] hover:border-[#0a192f] rounded-xl shadow-sm transition-all active:translate-y-1"
            >
              <RefreshCw
                size={20}
                className={isRefreshing ? "animate-spin text-[#0a192f]" : ""}
                strokeWidth={2.5}
              />
            </button>
          </h1>
          <p className="text-slate-500 mt-2 text-base font-medium flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {ongoing.length > 0
              ? `${ongoing.length} event(s) currently active in the system`
              : "No events are currently active"}
          </p>
        </div>

        {/* NÚT BẤM 3D VẬT LÝ */}
        <button
          onClick={() => navigate("/admin/events/create")}
          className="flex items-center gap-2 px-8 py-3.5 bg-[#0a192f] text-white text-sm font-black rounded-2xl border-2 border-[#0a192f] border-b-[6px] hover:bg-slate-800 hover:border-b-black active:border-b-[2px] active:translate-y-[4px] transition-all"
        >
          <Plus size={20} strokeWidth={3} /> Create New Event
        </button>
      </div>

      {/* STAT CARDS - MINIMALIST */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${s.bg} ${s.color}`}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {s.label}
              </p>
              <h3 className="text-4xl font-black text-[#0a192f] mt-1 tracking-tight">
                {s.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* ONGOING EVENTS LIST */}
      <div>
        <h2 className="text-2xl font-black text-[#0a192f] mb-6 flex items-center gap-2">
          <Activity size={24} className="text-emerald-500" strokeWidth={3} />
          Active Events
        </h2>

        {ongoing.length === 0 ? (
          <div className="bg-white p-16 rounded-[2rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
            <AlertCircle
              size={48}
              className="text-slate-300 mb-4"
              strokeWidth={1.5}
            />
            <h3 className="text-xl font-bold text-slate-700">
              No Active Tournaments
            </h3>
            <p className="text-slate-500 mt-2 text-base max-w-sm">
              All previous events have concluded, or no new event has been
              initiated yet.
            </p>
            <button
              onClick={() => navigate("/admin/events/create")}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0a192f] border-2 border-slate-200 border-b-[4px] font-black rounded-xl hover:border-slate-300 hover:bg-slate-50 active:border-b-[2px] active:translate-y-[2px] transition-all"
            >
              <Plus size={18} strokeWidth={2.5} /> Initialize Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ongoing.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-[2rem] border border-slate-200 border-b-[6px] hover:border-b-[#0a192f] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Header Card */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-2xl font-black text-[#0a192f] group-hover:text-blue-600 transition-colors">
                      {e.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                      {e.semester} {e.year}
                    </p>
                  </div>
                  <span className="text-[10px] px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                  </span>
                </div>

                {/* Body Card */}
                <div className="p-6 flex-1 flex flex-col">
                  {e.curRound ? (
                    <>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 bg-[#0a192f] text-white rounded-lg text-sm font-bold shadow-sm">
                            {e.curRound.roundName || "Round"}
                          </span>
                          <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-widest border border-slate-200">
                            Round {e.curRound._displayIndex}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          {e.numRounds} Total Round(s)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100 mb-5">
                        <Clock size={14} className="text-blue-500" />
                        {formatDate(e.curRound.startDate)}{" "}
                        <ArrowRight size={12} className="text-slate-300" />{" "}
                        {formatDate(e.curRound.endDate)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                          <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Capacity
                            </p>
                            <p className="text-xl font-black text-[#0a192f]">
                              {e.curRound.maxTeam ?? "—"}{" "}
                              <span className="text-sm text-slate-400 font-bold">
                                teams
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                          <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <Target size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Advancing
                            </p>
                            <p className="text-xl font-black text-[#0a192f]">
                              Top {e.curRound._topN}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 italic py-6 flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl mb-6">
                      Rounds configuration is missing.
                    </p>
                  )}

                  {/* Nút bấm 3D mềm mại cho Card */}
                  <button
                    onClick={() => navigate(`/admin/events/${e.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-100 text-[#0a192f] border-2 border-slate-100 border-b-[4px] hover:border-slate-300 hover:bg-slate-200 text-sm font-black rounded-xl active:border-b-[0px] active:translate-y-[4px] transition-all mt-auto"
                  >
                    Manage Event <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
