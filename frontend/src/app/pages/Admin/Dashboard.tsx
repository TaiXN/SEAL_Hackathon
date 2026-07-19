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
  Search,
  Filter as FilterIcon,
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
  status: "ongoing" | "ended" | "unknown";
  curRound: any | null;
};

export function Dashboard() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState<EnrichedEvent[]>([]);

  // States cho Search và Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Thống kê tổng quan (Luôn giữ nguyên số liệu gốc)
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

  // Logic Lọc & Tìm kiếm cho danh sách sự kiện hiển thị
  const displayEvents = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(e.year).includes(searchTerm);

    const matchesStatus = statusFilter === "all" || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
          className="flex items-center gap-2 px-8 py-3.5 bg-[#0a192f] text-white text-sm font-black rounded-2xl border-2 border-[#0a192f] border-b-[6px] hover:bg-slate-800 hover:border-b-black active:border-b-[2px] active:translate-y-[4px] transition-all shadow-sm"
        >
          <Plus size={20} strokeWidth={3} /> Create New Event
        </button>
      </div>

      {/* STAT CARDS */}
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

      {/* TÌM KIẾM VÀ LỌC */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FilterIcon size={20} strokeWidth={2.5} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-[#0a192f] text-sm font-bold rounded-xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 min-w-[200px] w-full cursor-pointer transition-all"
          >
            <option value="all">All Events</option>
            <option value="ongoing">Ongoing</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        <div className="flex items-center relative w-full sm:w-96 ml-auto">
          <Search
            size={18}
            className="text-slate-400 absolute left-5"
            strokeWidth={2.5}
          />
          <input
            type="text"
            placeholder="Search by name, semester, year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-[#0a192f] text-sm font-semibold rounded-xl pl-12 pr-5 py-3.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>
      </div>

      {/* DANH SÁCH SỰ KIỆN */}
      <div>
        {displayEvents.length === 0 ? (
          <div className="bg-white p-16 rounded-[2rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center shadow-sm">
            <AlertCircle
              size={56}
              className="text-slate-300 mb-5"
              strokeWidth={1.5}
            />
            <h3 className="text-xl font-extrabold text-[#0a192f]">
              {events.length === 0
                ? "No Tournaments Initialized"
                : "No Matches Found"}
            </h3>
            <p className="text-slate-500 mt-2 text-base font-medium max-w-sm">
              {events.length === 0
                ? "There are currently no events in the system. Start by creating a new one."
                : "No events match your current search criteria or filters."}
            </p>
            {events.length === 0 && (
              <button
                onClick={() => navigate("/admin/events/create")}
                className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#0a192f] border-2 border-slate-200 border-b-[4px] font-black rounded-xl hover:border-slate-300 hover:bg-slate-50 active:border-b-[2px] active:translate-y-[2px] transition-all"
              >
                <Plus size={18} strokeWidth={3} /> Initialize Event
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {displayEvents.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-[2rem] border border-slate-200 border-b-[6px] hover:border-b-[#0a192f] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Header Card */}
                <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                  <div className="pr-4">
                    <h3 className="text-2xl font-black text-[#0a192f] group-hover:text-blue-600 transition-colors leading-tight">
                      {e.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                      {e.semester} {e.year}
                    </p>
                  </div>
                  {e.status === "ongoing" && (
                    <span className="text-[10px] px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-sm shrink-0 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live
                    </span>
                  )}
                  {e.status === "ended" && (
                    <span className="text-[10px] px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-500 font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-sm shrink-0 border border-slate-200">
                      <CheckCircle2 size={12} strokeWidth={2.5} /> Ended
                    </span>
                  )}
                </div>

                {/* Body Card */}
                <div className="p-8 flex-1 flex flex-col">
                  {e.curRound ? (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <span className="px-4 py-2 bg-[#0a192f] text-white rounded-xl text-sm font-extrabold shadow-sm">
                            {e.curRound.roundName || "Round"}
                          </span>
                          <span className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 font-extrabold uppercase tracking-widest border border-slate-200 shadow-sm">
                            Round {e.curRound._displayIndex}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          {e.numRounds} Round(s) Total
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold bg-slate-50/80 w-fit px-4 py-2 rounded-xl border border-slate-100 mb-6 shadow-sm uppercase tracking-wide">
                        <Clock
                          size={14}
                          className="text-blue-500"
                          strokeWidth={2.5}
                        />
                        {formatDate(e.curRound.startDate)}{" "}
                        <ArrowRight size={14} className="text-slate-300 mx-1" />{" "}
                        {formatDate(e.curRound.endDate)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-4 bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl p-5">
                          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                            <Users size={24} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Capacity
                            </p>
                            <p className="text-2xl font-black text-[#0a192f]">
                              {e.curRound.maxTeam ?? "—"}{" "}
                              <span className="text-xs text-slate-400 font-bold ml-0.5">
                                teams
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl p-5">
                          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                            <Target size={24} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Advancing
                            </p>
                            <p className="text-2xl font-black text-[#0a192f]">
                              Top {e.curRound._topN}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 mb-8 flex-1 flex flex-col items-center justify-center text-center">
                      <p className="text-sm font-bold text-slate-500">
                        No Rounds Configured
                      </p>
                      <p className="text-xs font-medium text-slate-400 mt-1">
                        This event requires round configurations to become fully
                        active.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/admin/events/${e.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 text-[#0a192f] border-2 border-slate-100 border-b-[4px] hover:border-slate-200 hover:bg-slate-100 text-sm font-black rounded-2xl active:border-b-[0px] active:translate-y-[4px] transition-all mt-auto"
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
