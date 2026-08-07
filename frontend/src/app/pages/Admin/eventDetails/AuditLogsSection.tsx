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
  FastForward,
  Layers,
  ChevronDown,
  Users,
} from "lucide-react";
import {
  auditLogApi,
  readEvaluationScope,
  type ScoreAuditLog,
  type SubmissionAuditLog,
} from "../../../lib/api/auditLogApi";
import { friendlyErrorText } from "../../../lib/utils/apiError";

type TeamRef = { teamId: string; teamName: string; trackId?: string };

type Props = {
  rounds: any[];
  tracks: any[];
  teams: TeamRef[];
  /**
   * Toàn bộ vòng trong hệ thống, dùng làm phương án cuối để tra tên.
   * Bản ghi audit log chỉ mang roundId trần; nếu vì lý do gì đó id đó không nằm
   * trong `rounds` của sự kiện này thì vẫn còn chỗ để tra ra tên thật, thay vì
   * đổ hết về nhãn "Other round" vô nghĩa.
   */
  allRounds?: any[];
};

const roundIdOf = (r: any) => String(r.roundID ?? r.roundId ?? r.id ?? "");
const trackIdOf = (t: any) => String(t.trackID ?? t.trackId ?? t.id ?? "");

// GUID từ backend lúc hoa lúc thường tùy endpoint. Tra cứu mà so khớp nguyên văn
// thì một chữ hoa lệch nhau là ra "Other round" dù id hoàn toàn đúng.
const idKey = (v: any) => String(v ?? "").trim().toLowerCase();

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

/** Chip "vòng nào / bảng nào" gắn kèm mỗi dòng audit log. */
function ScopeChip({
  icon,
  label,
  tone,
}: {
  icon: any;
  label: string;
  tone: "round" | "track";
}) {
  // Nhãn "Other/Unknown/Unassigned" nghĩa là không tra ra tên — làm mờ để khỏi
  // trông như một vòng/bảng có thật.
  const resolved = !/^(other|unknown|unassigned)\b/i.test(label);
  const palette = resolved
    ? tone === "round"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-indigo-50 text-indigo-700 border-indigo-100"
    : "bg-slate-50 text-slate-400 border-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${palette}`}
    >
      {icon} {label}
    </span>
  );
}

export function AuditLogsSection({
  rounds,
  tracks,
  teams,
  allRounds = [],
}: Props) {
  const [view, setView] = useState<"submissions" | "scores">("submissions");
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

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
    teams.forEach((t) => (m[idKey(t.teamId)] = t.teamName));
    return m;
  }, [teams]);

  // allRounds trước, rounds của sự kiện sau — trùng id thì bản của sự kiện thắng.
  const roundNameById = useMemo(() => {
    const m: Record<string, string> = {};
    [...allRounds, ...rounds].forEach((r) => {
      const id = idKey(roundIdOf(r));
      if (!id) return;
      const idx = r.roundIndex ?? r.RoundIndex;
      m[id] = r.roundName || r.RoundName || (idx != null ? `Round ${idx}` : "Round");
    });
    return m;
  }, [rounds, allRounds]);

  const trackNameById = useMemo(() => {
    const m: Record<string, string> = {};
    tracks.forEach((t) => {
      const id = idKey(trackIdOf(t));
      if (id) m[id] = t.trackName || t.name || "Track";
    });
    return m;
  }, [tracks]);

  /**
   * Audit log của bài nộp chỉ mang roundId, không mang trackId. Bảng của một đội
   * nằm ở TeamInRound (nguồn dựng `teams`), nên dùng nó làm đường vòng.
   */
  const trackIdByTeam = useMemo(() => {
    const m: Record<string, string> = {};
    teams.forEach((t) => {
      if (t.trackId) m[idKey(t.teamId)] = idKey(t.trackId);
    });
    return m;
  }, [teams]);

  const roundNameOf = (roundId: string) =>
    roundNameById[idKey(roundId)] || (roundId ? "Other round" : "Unknown round");

  const trackNameOf = (trackId: string, teamId = "") => {
    const id = idKey(trackId) || trackIdByTeam[idKey(teamId)] || "";
    return trackNameById[id] || (id ? "Other track" : "Unassigned");
  };

  const teamNameOf = (teamId: string) =>
    teamNameById[idKey(teamId)] || teamId || "Unknown team";

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
      setSubError(friendlyErrorText(e, { action: "load the submission history" }));
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

      // Scope vừa để khoanh vùng evaluation thuộc sự kiện này, vừa là thứ duy
      // nhất cho biết log điểm nằm ở vòng/bảng nào — nên giữ lại cả object.
      const allScopes = evaluations.map(readEvaluationScope);
      const scoped = allScopes.filter(
        (s) =>
          (s.roundId && roundIds.has(s.roundId)) ||
          (s.teamId && teamIds.has(s.teamId)),
      );

      // Response của /api/Evaluation không chắc có roundId/teamId. Khi không
      // khoanh vùng được, thà báo rõ còn hơn ngầm hiển thị điểm của sự kiện khác.
      if (scoped.length === 0 && evaluations.length > 0 && !includeAll) {
        setScoreUnscoped(true);
        setScoreLogs([]);
        return;
      }

      const source = (includeAll ? allScopes : scoped).filter(
        (s) => s.evaluationId,
      );

      setScoreLogs(
        sortByNewest(await auditLogApi.getScoreLogsByEvaluations(source)),
      );
    } catch (e) {
      setScoreError(friendlyErrorText(e, { action: "load the scoring history" }));
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

  /**
   * Đánh số lần sửa cho từng đội: #1 là lần sửa SỚM NHẤT.
   * Đánh số trên toàn bộ subLogs chứ không phải danh sách đã lọc — tìm kiếm mà
   * làm số thứ tự nhảy lung tung thì nó hết là "lần sửa thứ mấy".
   */
  const subLogsWithRevision = useMemo(() => {
    const counter: Record<string, number> = {};
    return [...subLogs]
      .sort(
        (a, b) =>
          new Date(a.changedAt || 0).getTime() -
          new Date(b.changedAt || 0).getTime(),
      )
      .map((log) => {
        const key = idKey(log.teamId);
        counter[key] = (counter[key] ?? 0) + 1;
        return { ...log, revision: counter[key] };
      });
  }, [subLogs]);

  const totalRevisionsByTeam = useMemo(() => {
    const m: Record<string, number> = {};
    subLogsWithRevision.forEach((l) => {
      const key = idKey(l.teamId);
      m[key] = Math.max(m[key] ?? 0, l.revision);
    });
    return m;
  }, [subLogsWithRevision]);

  const visibleSubLogs = q
    ? subLogsWithRevision.filter((l) =>
        `${teamNameOf(l.teamId)} ${roundNameOf(l.roundId)} ${trackNameOf(
          l.trackId,
          l.teamId,
        )} ${l.next.github} ${l.next.demo} ${l.next.slide}`
          .toLowerCase()
          .includes(q),
      )
    : subLogsWithRevision;

  /** Một thẻ = một đội, bên trong là các lần sửa của chính đội đó (mới nhất trước). */
  const subGroups = useMemo(() => {
    const byTeam = new Map<string, typeof visibleSubLogs>();
    visibleSubLogs.forEach((log) => {
      const key = idKey(log.teamId);
      const bucket = byTeam.get(key);
      if (bucket) bucket.push(log);
      else byTeam.set(key, [log]);
    });

    return Array.from(byTeam, ([key, logs]) => {
      const ordered = sortByNewest(logs);
      return {
        key,
        teamId: logs[0].teamId,
        teamName: teamNameOf(logs[0].teamId),
        logs: ordered,
        totalRevisions: totalRevisionsByTeam[key] ?? ordered.length,
        lastChangedAt: ordered[0]?.changedAt ?? "",
      };
    }).sort(
      (a, b) =>
        new Date(b.lastChangedAt || 0).getTime() -
        new Date(a.lastChangedAt || 0).getTime(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSubLogs, totalRevisionsByTeam, teamNameById]);

  // Nhiều đội thì mặc định gấp lại cho dễ nhìn; đang tìm kiếm hoặc chỉ có đúng
  // một đội thì mở sẵn, bắt người dùng bấm thêm một nhát nữa là vô duyên.
  useEffect(() => {
    if (q || subGroups.length === 1) {
      setExpandedTeams(new Set(subGroups.map((g) => g.key)));
    } else {
      setExpandedTeams(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, subLogs, teamFilter]);

  const toggleTeam = (key: string) =>
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const allExpanded =
    subGroups.length > 0 && subGroups.every((g) => expandedTeams.has(g.key));

  const visibleScoreLogs = q
    ? scoreLogs.filter((l) =>
        `${teamNameOf(l.teamId)} ${l.judgeId} ${roundNameOf(
          l.roundId,
        )} ${trackNameOf(l.trackId, l.teamId)} ${l.reason}`
          .toLowerCase()
          .includes(q),
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
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-slate-400">
                {subGroups.length} team{subGroups.length === 1 ? "" : "s"} •{" "}
                {visibleSubLogs.length} change
                {visibleSubLogs.length === 1 ? "" : "s"}
              </p>
              <button
                onClick={() =>
                  setExpandedTeams(
                    allExpanded
                      ? new Set()
                      : new Set(subGroups.map((g) => g.key)),
                  )
                }
                className="text-xs font-extrabold text-slate-500 hover:text-fpt-orange transition-colors"
              >
                {allExpanded ? "Collapse all" : "Expand all"}
              </button>
            </div>

            {subGroups.map((group) => {
              const isOpen = expandedTeams.has(group.key);
              return (
                <div
                  key={group.key}
                  className="border border-slate-200 rounded-[1.5rem] overflow-hidden bg-slate-50/40"
                >
                  <button
                    onClick={() => toggleTeam(group.key)}
                    className="w-full flex flex-wrap items-center justify-between gap-3 p-5 text-left hover:bg-white/60 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                      <Users size={16} className="text-slate-400 shrink-0" />
                      <span className="font-extrabold text-[#f26f21] truncate">
                        {group.teamName}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-purple-100 bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                        {group.logs.length === group.totalRevisions
                          ? `${group.totalRevisions} change${group.totalRevisions === 1 ? "" : "s"}`
                          : `${group.logs.length} of ${group.totalRevisions} changes`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-slate-400">
                        Last edit {formatWhen(group.lastChangedAt)}
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
                    <div className="border-t border-slate-200/70 bg-white p-5 space-y-3">
                      {group.logs.map((log, i) => (
                        <div
                          key={log.id || `${group.key}-${i}`}
                          className="border border-slate-100 rounded-[1.25rem] p-5 bg-slate-50/50 space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                                Change #{log.revision}
                              </span>
                              <ScopeChip
                                tone="round"
                                icon={<FastForward size={11} strokeWidth={3} />}
                                label={roundNameOf(log.roundId)}
                              />
                              <ScopeChip
                                tone="track"
                                icon={<Layers size={11} strokeWidth={3} />}
                                label={trackNameOf(log.trackId, log.teamId)}
                              />
                            </div>
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
                  )}
                </div>
              );
            })}
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
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4 whitespace-nowrap">Round / Track</th>
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
                  <td className="px-6 py-4 text-xs font-extrabold text-[#f26f21]">
                    {teamNameOf(log.teamId)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <ScopeChip
                        tone="round"
                        icon={<FastForward size={11} strokeWidth={3} />}
                        label={roundNameOf(log.roundId)}
                      />
                      <ScopeChip
                        tone="track"
                        icon={<Layers size={11} strokeWidth={3} />}
                        label={trackNameOf(log.trackId, log.teamId)}
                      />
                    </div>
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
