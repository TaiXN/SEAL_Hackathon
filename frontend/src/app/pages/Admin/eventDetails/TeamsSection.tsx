import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Crown,
  Ban,
  Layers,
  Lightbulb,
  ChevronDown,
  UserX,
} from "lucide-react";
import { eventApi } from "../../../lib/api/eventApi";
import { friendlyErrorText } from "../../../lib/utils/apiError";

type Member = {
  studentId: string;
  studentName: string;
  isLeader: boolean;
  isActive: boolean;
};

type EventTeam = {
  teamId: string;
  teamName: string;
  trackName: string;
  topicName: string;
  totalMembers: number;
  isBanned: boolean;
  members: Member[];
};

const pick = (o: any, ...names: string[]) => {
  for (const n of names) {
    if (o?.[n] !== undefined && o?.[n] !== null) return o[n];
    const cap = n[0].toUpperCase() + n.slice(1);
    if (o?.[cap] !== undefined && o?.[cap] !== null) return o[cap];
  }
  return undefined;
};

const normalizeTeam = (raw: any): EventTeam => {
  const members = (
    Array.isArray(pick(raw, "members")) ? pick(raw, "members") : []
  ).map((m: any) => ({
    studentId: String(pick(m, "studentId", "studentID") ?? ""),
    studentName: String(
      pick(m, "studentName", "fullName", "name") ?? "Unnamed member",
    ),
    isLeader: pick(m, "isLeader") === true,
    // Thiếu field thì coi như đang hoạt động — đánh dấu nhầm là "banned" tệ hơn.
    isActive: pick(m, "isActive") !== false,
  }));

  return {
    teamId: String(pick(raw, "teamId", "teamID", "id") ?? ""),
    teamName: String(pick(raw, "teamName", "name") ?? "Unnamed team"),
    trackName: String(pick(raw, "trackName") ?? ""),
    topicName: String(pick(raw, "topicName") ?? ""),
    totalMembers: Number(pick(raw, "totalMembers") ?? members.length ?? 0),
    isBanned: pick(raw, "isBanned") === true,
    members,
  };
};

export function TeamsSection({ eventId }: { eventId: string }) {
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      setError(null);
      setTeams((await eventApi.getEventTeams(eventId)).map(normalizeTeam));
    } catch (e) {
      setError(friendlyErrorText(e, { action: "load the teams of this event" }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const toggle = (teamId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(teamId) ? next.delete(teamId) : next.add(teamId);
      return next;
    });

  const q = search.trim().toLowerCase();
  const visibleTeams = q
    ? teams.filter((t) =>
        `${t.teamName} ${t.trackName} ${t.topicName} ${t.members
          .map((m) => m.studentName)
          .join(" ")}`
          .toLowerCase()
          .includes(q),
      )
    : teams;

  const stats = useMemo(
    () => ({
      total: teams.length,
      banned: teams.filter((t) => t.isBanned).length,
      participants: teams.reduce((sum, t) => sum + (t.totalMembers || 0), 0),
    }),
    [teams],
  );

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
      <div className="border-b border-slate-100 pb-5">
        <h3 className="text-xl font-extrabold text-[#f26f21] flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={20} strokeWidth={2.5} />
          </div>
          Participating Teams
        </h3>
        <p className="text-sm font-medium text-slate-500 mt-2 sm:ml-[3.25rem]">
          Every team registered for this event, with their track, topic and
          roster.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Teams registered",
            value: stats.total,
            tone: "text-[#f26f21]",
          },
          {
            label: "Total participants",
            value: stats.participants,
            tone: "text-slate-700",
          },
          {
            label: "Banned teams",
            value: stats.banned,
            tone: stats.banned > 0 ? "text-red-600" : "text-slate-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {s.label}
            </span>
            <p className={`text-3xl font-black ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team, track, topic or member..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-fpt-orange focus:bg-white transition-all"
          />
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          title="Reload"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-500 hover:text-fpt-orange transition-colors"
        >
          <RefreshCw
            size={15}
            strokeWidth={2.5}
            className={isLoading ? "animate-spin" : ""}
          />
          Reload
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-14 text-slate-400 font-bold uppercase tracking-widest text-sm">
          <Loader2 size={20} className="animate-spin text-[#f26f21]" /> Loading
          teams...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-10 bg-red-50 rounded-2xl text-sm text-red-600 font-bold text-center px-6">
          <AlertCircle size={18} strokeWidth={2.5} className="shrink-0" />{" "}
          {error}
        </div>
      ) : visibleTeams.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-center text-slate-500 font-medium">
          {teams.length === 0
            ? "No team has registered for this event yet."
            : "No team matches your search."}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTeams.map((team) => {
            const isOpen = expanded.has(team.teamId);
            return (
              <div
                key={team.teamId}
                className={`border rounded-[1.5rem] overflow-hidden transition-colors ${
                  team.isBanned
                    ? "border-red-200 bg-red-50/40"
                    : "border-slate-200 bg-slate-50/40"
                }`}
              >
                <button
                  onClick={() => toggle(team.teamId)}
                  className="w-full flex flex-wrap items-center justify-between gap-3 p-5 text-left hover:bg-white/60 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    <span className="font-extrabold text-[#f26f21] truncate">
                      {team.teamName}
                    </span>
                    {team.isBanned && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider">
                        <Ban size={11} strokeWidth={3} /> Banned
                      </span>
                    )}
                    {team.trackName && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                        <Layers size={11} strokeWidth={3} /> {team.trackName}
                      </span>
                    )}
                    {team.topicName && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-100 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider">
                        <Lightbulb size={11} strokeWidth={3} /> {team.topicName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-slate-500">
                      {team.totalMembers} member
                      {team.totalMembers === 1 ? "" : "s"}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-200/70 bg-white px-5 py-4">
                    {team.members.length === 0 ? (
                      <p className="text-xs font-medium text-slate-400 py-2">
                        The server did not return a roster for this team.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-50">
                        {[...team.members]
                          .sort(
                            (a, b) =>
                              Number(b.isLeader) - Number(a.isLeader) ||
                              a.studentName.localeCompare(b.studentName),
                          )
                          .map((m) => (
                            <li
                              key={m.studentId || m.studentName}
                              className="flex flex-wrap items-center justify-between gap-2 py-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`text-sm font-bold truncate ${
                                    m.isActive
                                      ? "text-slate-700"
                                      : "text-slate-400 line-through"
                                  }`}
                                >
                                  {m.studentName}
                                </span>
                                {m.isLeader && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-wider">
                                    <Crown size={10} strokeWidth={3} /> Leader
                                  </span>
                                )}
                              </div>
                              {m.isActive ? (
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-500">
                                  <UserX size={11} strokeWidth={3} /> Banned
                                </span>
                              )}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
