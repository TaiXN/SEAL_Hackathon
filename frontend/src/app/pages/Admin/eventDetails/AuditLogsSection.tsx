import { useEffect, useMemo, useState } from "react";
import {
  History,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileCode2,
  Scale,
  ArrowRight,
  Search,
} from "lucide-react";
import {
  auditLogApi,
  type ScoreAuditLog,
  type SubmissionAuditLog,
} from "../../../lib/api/auditLogApi";
import { getServerMsg } from "../../../lib/utils/criteriaHelpers";

type TeamRef = { teamId: string; teamName: string };

type Props = {
  rounds: any[];
  teams: TeamRef[];
};

const roundIdOf = (r: any) => String(r.roundID ?? r.roundId ?? r.id ?? "");

const formatWhen = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const sortByNewest = <T extends { changedAt: string }>(list: T[]) =>
  [...list].sort(
    (a, b) =>
      new Date(b.changedAt || 0).getTime() -
      new Date(a.changedAt || 0).getTime(),
  );

/** Ô so sánh trước → sau cho một link bài nộp. Chỉ render khi giá trị đổi. */
function UrlDiff({
  label,
  before,
  after,
}: {
  label: string;
  before: string;
  after: string;
}) {
  if (before === after) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[11px] font-mono break-all line-through">
          {before || "(empty)"}
        </code>
        <ArrowRight size={14} className="text-slate-300 shrink-0" />
        <code className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[11px] font-mono break-all">
          {after || "(empty)"}
        </code>
      </div>
    </div>
  );
}

export function AuditLogsSection({ rounds, teams }: Props) {
  const [view, setView] = useState<"submissions" | "scores">("submissions");

  const [teamFilter, setTeamFilter] = useState("all");
  const [subLogs, setSubLogs] = useState<SubmissionAuditLog[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  const [scoreLogs, setScoreLogs] = useState<ScoreAuditLog[]>([]);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreUnscoped, setScoreUnscoped] = useState(false);
  const [search, setSearch] = useState("");

  const teamNameById = useMemo(() => {
    const m: Record<string, string> = {};
    teams.forEach((t) => (m[t.teamId] = t.teamName));
    return m;
  }, [teams]);

  const loadSubmissionLogs = async () => {
    const ids =
      teamFilter === "all" ? teams.map((t) => t.teamId) : [teamFilter];
    if (ids.length === 0) {
      setSubLogs([]);
      return;
    }
    try {
      setSubLoading(true);
      setSubError(null);
      setSubLogs(sortByNewest(await auditLogApi.getSubmissionLogsByTeams(ids)));
    } catch (e) {
      setSubError(getServerMsg(e) || "Could not load submission audit logs.");
    } finally {
      setSubLoading(false);
    }
  };

  /**
   * Log sửa điểm phải đi qua 2 chặng: liệt kê evaluation rồi hỏi audit-log của
   * từng cái. Không có endpoint lấy theo eventId, nên phải tự khoanh vùng các
   * evaluation thuộc những vòng của sự kiện này.
   */
  const loadScoreLogs = async (includeAll = false) => {
    try {
      setScoreLoading(true);
      setScoreError(null);
      setScoreUnscoped(false);

      const evaluations = await auditLogApi.getAllEvaluations();
      const roundIds = new Set(rounds.map(roundIdOf).filter(Boolean));
      const teamIds = new Set(teams.map((t) => t.teamId));

      const scoped = evaluations.filter((ev: any) => {
        const rid = String(ev.roundId ?? ev.roundID ?? ev.RoundId ?? "");
        const tid = String(ev.teamId ?? ev.teamID ?? ev.TeamId ?? "");
        return (rid && roundIds.has(rid)) || (tid && teamIds.has(tid));
      });

      // Response của /api/Evaluation không chắc có roundId/teamId. Khi không
      // khoanh vùng được, thà báo rõ còn hơn ngầm hiển thị điểm của sự kiện khác.
      if (scoped.length === 0 && evaluations.length > 0 && !includeAll) {
        setScoreUnscoped(true);
        setScoreLogs([]);
        return;
      }

      const source = includeAll ? evaluations : scoped;
      const evalIds = source
        .map((ev: any) =>
          String(ev.evaluationID ?? ev.evaluationId ?? ev.id ?? ""),
        )
        .filter(Boolean);

      setScoreLogs(
        sortByNewest(await auditLogApi.getScoreLogsByEvaluations(evalIds)),
      );
    } catch (e) {
      setScoreError(getServerMsg(e) || "Could not load score audit logs.");
    } finally {
      setScoreLoading(false);
    }
  };

  useEffect(() => {
    if (view === "submissions") loadSubmissionLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, teamFilter, teams.length]);

  useEffect(() => {
    if (view === "scores" && scoreLogs.length === 0 && !scoreUnscoped)
      loadScoreLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, rounds.length]);

  const q = search.trim().toLowerCase();
  const visibleSubLogs = q
    ? subLogs.filter((l) =>
        `${teamNameById[l.teamId] ?? ""} ${l.next.github} ${l.next.demo} ${l.next.slide}`
          .toLowerCase()
          .includes(q),
      )
    : subLogs;
  const visibleScoreLogs = q
    ? scoreLogs.filter((l) =>
        `${l.judgeId} ${l.reason}`.toLowerCase().includes(q),
      )
    : scoreLogs;

  const tabBtn = (id: typeof view, label: string, icon: any) => (
    <button
      key={id}
      onClick={() => setView(id)}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-colors ${
        view === id
          ? "bg-fpt-orange text-white shadow-sm"
          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
      <div className="border-b border-slate-100 pb-5">
        <h3 className="text-xl font-extrabold text-[#f26f21] flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <History size={20} strokeWidth={2.5} />
          </div>
          Audit Logs
        </h3>
        <p className="text-sm font-medium text-slate-500 mt-2 ml-[3.25rem]">
          Every re-submission and every score correction made inside this event.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div className="flex gap-2">
          {tabBtn("submissions", "Submission changes", <FileCode2 size={15} />)}
          {tabBtn("scores", "Score changes", <Scale size={15} />)}
        </div>

        <div className="flex gap-2 items-center">
          {view === "submissions" && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-fpt-orange cursor-pointer"
            >
              <option value="all">All teams ({teams.length})</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.teamName}
                </option>
              ))}
            </select>
          )}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-3 py-2.5 w-52 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-fpt-orange"
            />
          </div>
          <button
            onClick={() =>
              view === "submissions" ? loadSubmissionLogs() : loadScoreLogs()
            }
            title="Reload"
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-fpt-orange transition-colors"
          >
            <RefreshCw size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {view === "submissions" ? (
        subLoading ? (
          <div className="flex items-center justify-center gap-3 py-14 text-slate-400 font-bold uppercase tracking-widest text-sm">
            <Loader2 size={20} className="animate-spin text-[#f26f21]" />{" "}
            Loading submission history...
          </div>
        ) : subError ? (
          <div className="flex items-center justify-center gap-2 py-10 bg-red-50 rounded-2xl text-sm text-red-600 font-bold">
            <AlertCircle size={18} strokeWidth={2.5} /> {subError}
          </div>
        ) : teams.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-center text-slate-500 font-medium">
            No teams have joined this event yet, so there is nothing to audit.
          </div>
        ) : visibleSubLogs.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-center text-slate-500 font-medium">
            No submission has been edited yet.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleSubLogs.map((log, i) => (
              <div
                key={log.id || i}
                className="border border-slate-200 rounded-[1.5rem] p-6 bg-slate-50/40 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-extrabold text-[#f26f21]">
                    {teamNameById[log.teamId] || log.teamId || "Unknown team"}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {formatWhen(log.changedAt)}
                  </span>
                </div>
                <div className="space-y-3">
                  <UrlDiff
                    label="GitHub"
                    before={log.old.github}
                    after={log.next.github}
                  />
                  <UrlDiff
                    label="Demo"
                    before={log.old.demo}
                    after={log.next.demo}
                  />
                  <UrlDiff
                    label="Slide"
                    before={log.old.slide}
                    after={log.next.slide}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      ) : scoreLoading ? (
        <div className="flex items-center justify-center gap-3 py-14 text-slate-400 font-bold uppercase tracking-widest text-sm">
          <Loader2 size={20} className="animate-spin text-[#f26f21]" /> Loading
          score history...
        </div>
      ) : scoreError ? (
        <div className="flex items-center justify-center gap-2 py-10 bg-red-50 rounded-2xl text-sm text-red-600 font-bold">
          <AlertCircle size={18} strokeWidth={2.5} /> {scoreError}
        </div>
      ) : scoreUnscoped ? (
        <div className="p-8 border-2 border-dashed border-amber-200 bg-amber-50/50 rounded-[1.5rem] text-center space-y-3">
          <p className="text-sm font-bold text-amber-800">
            The evaluation list returned by the server does not say which round
            or team each score belongs to, so they cannot be filtered down to
            this event.
          </p>
          <button
            onClick={() => loadScoreLogs(true)}
            className="px-5 py-2.5 bg-amber-600 text-white text-xs font-extrabold rounded-xl hover:bg-amber-700 transition-colors"
          >
            Show score changes from all events
          </button>
        </div>
      ) : visibleScoreLogs.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-center text-slate-500 font-medium">
          No judge has revised a score yet.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-[1.5rem]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">When</th>
                <th className="px-6 py-4">Judge</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">
                  Score change
                </th>
                <th className="px-6 py-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleScoreLogs.map((log, i) => (
                <tr key={log.id || i} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                    {formatWhen(log.changedAt)}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600 break-all">
                    {log.judgeId || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-black text-slate-400 line-through">
                        {log.oldScore ?? "—"}
                      </span>
                      <ArrowRight size={14} className="text-slate-300" />
                      <span className="text-sm font-black text-emerald-600">
                        {log.newScore ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">
                    {log.reason || (
                      <span className="text-slate-300">No reason given</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
