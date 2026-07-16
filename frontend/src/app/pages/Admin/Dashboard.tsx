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

// Lấy id sự kiện an toàn
const eventId = (e: any): string =>
  String(e?.id || e?.eventId || e?.eventID || "");

// Chuẩn hóa field round (backend đặt tên lẫn lộn hoa/thường)
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

      // Gom round theo từng sự kiện (đã sort theo thứ tự vòng)
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

        // Vòng hiện tại (theo vị trí) — dùng để hiển thị tóm tắt
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
      console.error("Lỗi tải Dashboard:", err);
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
        <RefreshCw size={20} className="animate-spin mr-2" /> Loading overview...
      </div>
    );
  }

  const ongoing = events.filter((e) => e.status === "ongoing");
  const ended = events.filter((e) => e.status === "ended");

  const stats = [
    {
      label: "Ongoing",
      value: ongoing.length,
      icon: <Activity size={22} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },

    {
      label: "Ended",
      value: ended.length,
      icon: <CheckCircle2 size={22} />,
      color: "text-slate-500",
      bg: "bg-slate-100",
    },
    {
      label: "Total Events",
      value: events.length,
      icon: <LayoutGrid size={22} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Event Overview
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              title="Refresh"
              className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-full shadow-sm transition-all"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? "animate-spin text-blue-600" : ""}
              />
            </button>
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {ongoing.length > 0
              ? `${ongoing.length} event(s) currently ongoing`
              : "No events are currently ongoing"}
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/events/create")}
          className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-bold rounded-xl shadow-sm hover:bg-slate-800"
        >
          <Plus size={18} /> Create New Event
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {s.label}
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-0.5">
                {s.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* DANH SÁCH SỰ KIỆN ĐANG DIỄN RA */}
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-emerald-500" />
          Ongoing Events
        </h2>

        {ongoing.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
            <AlertCircle size={44} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700">
              No ongoing events
            </h3>
            <p className="text-slate-500 mt-1 text-sm">
              Previous events have ended, or no new event has been created yet.
            </p>
            <button
              onClick={() => navigate("/admin/events/create")}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-slate-800"
            >
              <Plus size={16} /> Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {ongoing.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Thanh trên: tên + kỳ/năm */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {e.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      {e.semester} {e.year}
                    </p>
                  </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Ongoing
                    </span>
                </div>

                {/* Vòng hiện tại */}
                <div className="p-5 space-y-4">
                  {e.curRound ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">
                            {e.curRound.roundName || "Round"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase">
                            Round {e.curRound._displayIndex}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {e.numRounds} round(s)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Clock size={14} />
                        {formatDate(e.curRound.startDate)} →{" "}
                        {formatDate(e.curRound.endDate)}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5">
                          <Users size={18} className="text-blue-500" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              Team Limit
                            </p>
                            <p className="text-base font-black text-slate-800">
                              {e.curRound.maxTeam ?? "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5">
                          <Target size={18} className="text-purple-500" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              Advance to Next Round
                            </p>
                            <p className="text-base font-black text-slate-800">
                              Top {e.curRound._topN}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 italic py-2">
                      No rounds have been configured for this event.
                    </p>
                  )}

                  <button
                    onClick={() => navigate(`/admin/events/${e.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    View Details <ArrowRight size={16} />
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
