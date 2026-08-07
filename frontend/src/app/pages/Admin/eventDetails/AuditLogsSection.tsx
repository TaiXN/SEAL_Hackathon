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
  Gavel,
  MessageSquare,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  auditLogApi,
  readEvaluationScope,
  type EvaluationScope,
  type ScoreAuditLog,
  type SubmissionAuditLog,
} from "../../../lib/api/auditLogApi";
import { friendlyErrorText } from "../../../lib/utils/apiError";

type TeamRef = { teamId: string; teamName: string; trackId?: string };

/**
 * Một bản ghi TeamInRound: đội X thi vòng Y ở bảng Z.
 *
 * Bài nộp trả về từ `/api/Submission` KHÔNG mang teamId/roundId/eventId, nó chỉ
 * mang `teamInRoundId`. Đây là bảng tra để đổi id đó ra đội/vòng/bảng thật —
 * thiếu nó thì không có cách nào biết một bài nộp (và phiếu chấm của nó) thuộc
 * sự kiện nào.
 */
type TeamInRoundRef = {
  teamInRoundId: string;
  teamId: string;
  teamName: string;
  roundId: string;
  trackId: string;
};

type Props = {
  eventId: string;
  rounds: any[];
  tracks: any[];
  teams: TeamRef[];
  teamInRounds?: TeamInRoundRef[];
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

const formatScore = (n: number | null) =>
  n === null || n === undefined ? "—" : String(Number(n.toFixed(2)));

const sortByNewest = <T extends { changedAt: string }>(list: T[]) =>
  [...list].sort(
    (a, b) =>
      new Date(b.changedAt || 0).getTime() -
      new Date(a.changedAt || 0).getTime(),
  );

const sortByOldest = <T extends { changedAt: string }>(list: T[]) =>
  [...list].sort(
    (a, b) =>
      new Date(a.changedAt || 0).getTime() -
      new Date(b.changedAt || 0).getTime(),
  );

type Revisioned<T> = T & { revision: number };
type TeamAudit = { teamId: string; changedAt: string };

/**
 * Đánh số lần sửa cho từng đội: #1 là lần sửa SỚM NHẤT.
 * Luôn đánh trên TOÀN BỘ danh sách chứ không phải danh sách đã lọc — tìm kiếm mà
 * làm số thứ tự nhảy lung tung thì nó hết là "lần sửa thứ mấy".
 */
const numberRevisionsByTeam = <T extends TeamAudit>(logs: T[]) => {
  const counter: Record<string, number> = {};
  return sortByOldest(logs).map((log) => {
    const key = idKey(log.teamId);
    counter[key] = (counter[key] ?? 0) + 1;
    return { ...log, revision: counter[key] } as Revisioned<T>;
  });
};

const maxRevisionByTeam = (logs: { teamId: string; revision: number }[]) => {
  const m: Record<string, number> = {};
  logs.forEach((l) => {
    const key = idKey(l.teamId);
    m[key] = Math.max(m[key] ?? 0, l.revision);
  });
  return m;
};

type TeamGroup<T> = {
  key: string;
  teamId: string;
  teamName: string;
  logs: T[];
  totalRevisions: number;
  lastChangedAt: string;
};

/** Một thẻ = một đội, bên trong là các lần thay đổi của chính đội đó (mới nhất trước). */
const groupByTeam = <T extends TeamAudit & { revision: number }>(
  logs: T[],
  totals: Record<string, number>,
  teamNameOf: (sample: T) => string,
): TeamGroup<T>[] => {
  const byTeam = new Map<string, T[]>();
  logs.forEach((log) => {
    const key = idKey(log.teamId);
    const bucket = byTeam.get(key);
    if (bucket) bucket.push(log);
    else byTeam.set(key, [log]);
  });

  return Array.from(byTeam, ([key, bucket]) => {
    const ordered = sortByNewest(bucket);
    return {
      key,
      teamId: bucket[0].teamId,
      teamName: teamNameOf(bucket[0]),
      logs: ordered,
      totalRevisions: totals[key] ?? ordered.length,
      lastChangedAt: ordered[0]?.changedAt ?? "",
    };
  }).sort(
    (a, b) =>
      new Date(b.lastChangedAt || 0).getTime() -
      new Date(a.lastChangedAt || 0).getTime(),
  );
};

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

/** Ô so sánh trước → sau cho điểm, kèm chênh lệch. Anh em song sinh của UrlDiff. */
function ScoreDiff({
  before,
  after,
}: {
  before: number | null;
  after: number | null;
}) {
  const delta = before !== null && after !== null ? after - before : null;
  const up = (delta ?? 0) > 0;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        Score
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-black line-through">
          {formatScore(before)}
        </span>
        <ArrowRight size={14} className="text-slate-300 shrink-0" />
        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-sm font-black">
          {formatScore(after)}
        </span>
        {delta !== null && delta !== 0 && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-black ${
              up
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-red-50 text-red-600 border-red-100"
            }`}
          >
            {up ? (
              <TrendingUp size={11} strokeWidth={3} />
            ) : (
              <TrendingDown size={11} strokeWidth={3} />
            )}
            {up ? "+" : ""}
            {formatScore(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

/** Dòng thông tin phụ (giám khảo, lý do) trong thẻ sửa điểm. */
function DetailLine({
  label,
  icon,
  value,
  empty,
}: {
  label: string;
  icon: any;
  value: string;
  empty: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
        {icon} {label}
      </span>
      {value ? (
        <p className="text-sm font-semibold text-slate-600 break-words">
          {value}
        </p>
      ) : (
        <p className="text-sm font-medium text-slate-300">{empty}</p>
      )}
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

/** Thẻ gấp/mở của một đội — dùng chung cho cả hai tab. */
function TeamAccordion({
  teamName,
  countLabel,
  lastLabel,
  isOpen,
  onToggle,
  children,
}: {
  teamName: string;
  countLabel: string;
  lastLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  children: any;
}) {
  return (
    <div className="border border-slate-200 rounded-[1.5rem] overflow-hidden bg-slate-50/40">
      <button
        onClick={onToggle}
        className="w-full flex flex-wrap items-center justify-between gap-3 p-5 text-left hover:bg-white/60 transition-colors"
      >
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <Users size={16} className="text-slate-400 shrink-0" />
          <span className="font-extrabold text-[#f26f21] truncate">
            {teamName}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-purple-100 bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
            {countLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold text-slate-400">{lastLabel}</span>
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
          {children}
        </div>
      )}
    </div>
  );
}

const countLabelOf = (shown: number, total: number) =>
  shown === total
    ? `${total} change${total === 1 ? "" : "s"}`
    : `${shown} of ${total} changes`;

export function AuditLogsSection({
  eventId,
  rounds,
  tracks,
  teams,
  teamInRounds = [],
  allRounds = [],
}: Props) {
  const [view, setView] = useState<"submissions" | "scores">("submissions");
  const [expandedSubTeams, setExpandedSubTeams] = useState<Set<string>>(
    new Set(),
  );
  const [expandedScoreTeams, setExpandedScoreTeams] = useState<Set<string>>(
    new Set(),
  );

  const [teamFilter, setTeamFilter] = useState("all");
  const [subLogs, setSubLogs] = useState<SubmissionAuditLog[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  const [scoreLogs, setScoreLogs] = useState<ScoreAuditLog[]>([]);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  /**
   * Có bản ghi sửa điểm về từ API nhưng không bản nào neo được vào sự kiện này.
   * Nói thẳng ra thay vì báo "chưa ai sửa điểm" — hai chuyện đó khác hẳn nhau.
   */
  const [scoreNotice, setScoreNotice] = useState<string | null>(null);
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

  /**
   * Id của riêng sự kiện này. Tất cả đều đi qua idKey vì GUID trả về từ mỗi
   * endpoint lúc hoa lúc thường — so khớp nguyên văn là trượt sạch.
   */
  const eventScope = useMemo(() => {
    return {
      eventId: idKey(eventId),
      roundIds: new Set(rounds.map((r) => idKey(roundIdOf(r))).filter(Boolean)),
      trackIds: new Set(tracks.map((t) => idKey(trackIdOf(t))).filter(Boolean)),
      teamIds: new Set(teams.map((t) => idKey(t.teamId)).filter(Boolean)),
      teamInRoundIds: new Set(
        teamInRounds.map((t) => idKey(t.teamInRoundId)).filter(Boolean),
      ),
    };
  }, [eventId, rounds, tracks, teams, teamInRounds]);

  /** teamInRoundId -> đội/vòng/bảng. Xem chú thích ở TeamInRoundRef. */
  const teamInRoundById = useMemo(() => {
    const m = new Map<string, TeamInRoundRef>();
    teamInRounds.forEach((t) => {
      const key = idKey(t.teamInRoundId);
      if (key) m.set(key, t);
    });
    return m;
  }, [teamInRounds]);

  /**
   * Bản ghi audit có thuộc sự kiện đang mở không.
   *
   * Bất kỳ id nào chỉ về sự kiện này là nhận — KHÔNG xét theo thứ tự ưu tiên rồi
   * dừng ở id đầu tiên tìm thấy. Một bản ghi mang đúng teamId và roundId của sự
   * kiện mà lại bị loại chỉ vì eventId trên đó lệch thì rõ ràng là sai; các id
   * đều là GUID nên khớp nhầm gần như không xảy ra.
   */
  const belongsToEvent = (s: {
    eventId?: string;
    roundId?: string;
    trackId?: string;
    teamId?: string;
    teamInRoundId?: string;
  }) => {
    const event = idKey(s.eventId);
    if (event && event === eventScope.eventId) return true;
    const teamInRound = idKey(s.teamInRoundId);
    if (teamInRound && eventScope.teamInRoundIds.has(teamInRound)) return true;
    const round = idKey(s.roundId);
    if (round && eventScope.roundIds.has(round)) return true;
    const track = idKey(s.trackId);
    if (track && eventScope.trackIds.has(track)) return true;
    const team = idKey(s.teamId);
    if (team && eventScope.teamIds.has(team)) return true;
    // Không id nào trỏ về đây. Vòng của nó tra ra sự kiện khác thì chốt là không
    // thuộc; còn lại coi như không đủ căn cứ.
    return false;
  };

  // Backend giờ trả kèm tên trên chính bản ghi log; ưu tiên nó, hết mới tra ngược.
  const scoreTeamNameOf = (log: ScoreAuditLog) =>
    log.teamName || teamNameOf(log.teamId);
  const scoreRoundNameOf = (log: ScoreAuditLog) =>
    log.roundName || roundNameOf(log.roundId);
  const scoreTrackNameOf = (log: ScoreAuditLog) =>
    log.trackName || trackNameOf(log.trackId, log.teamId);

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
      setSubLogs(
        sortByNewest(await auditLogApi.getSubmissionLogsByTeams(ids, eventId)),
      );
    } catch (e) {
      setSubError(friendlyErrorText(e, { action: "load the submission history" }));
    } finally {
      setSubLoading(false);
    }
  };

  /**
   * Chỗ neo của một bài nộp: đội / vòng / bảng / sự kiện.
   * Đây là mắt xích quan trọng nhất của tab này. Danh sách `/api/Evaluation` chỉ
   * cho biết phiếu chấm gắn với submissionId nào chứ không nói nó thuộc sự kiện
   * nào, nên phải mượn bài nộp để neo lại.
   *
   * Nhưng bản thân bài nộp cũng KHÔNG mang teamId/roundId/eventId — nó chỉ mang
   * `teamInRoundId`. Đọc trần mấy field kia thì anchor nào cũng rỗng, và cả chuỗi
   * "phiếu chấm -> bài nộp -> sự kiện" đứt ngay từ mắt đầu tiên: mọi bản ghi sửa
   * điểm đều rơi vào nhánh "không truy được về sự kiện này". Vì vậy phải tra
   * teamInRoundId ra đội/vòng/bảng trước, rồi mới lấy field trần làm phương án
   * dự phòng cho trường hợp backend có trả sẵn.
   */
  const anchorOfSubmission = (s: any) => {
    const teamInRoundId = String(
      s?.teamInRoundId ??
        s?.teamInRoundID ??
        s?.TeamInRoundId ??
        s?.TeamInRoundID ??
        s?.teamInRound?.teamInRoundId ??
        s?.teamInRound?.teamInRoundID ??
        "",
    );
    const tir = teamInRoundById.get(idKey(teamInRoundId));
    const raw = (...v: any[]) => String(v.find((x) => x) ?? "");

    return {
      submissionId: raw(s?.submissionId, s?.submissionID, s?.id),
      teamInRoundId,
      teamId:
        raw(s?.teamId, s?.teamID, s?.teamInRound?.teamId, s?.teamInRound?.teamID) ||
        tir?.teamId ||
        "",
      roundId:
        raw(s?.roundId, s?.roundID, s?.teamInRound?.roundId, s?.round?.roundId) ||
        tir?.roundId ||
        "",
      trackId:
        raw(s?.trackId, s?.trackID, s?.teamInRound?.trackId) || tir?.trackId || "",
      eventId: raw(s?.eventId, s?.eventID, s?.round?.eventId),
      teamName:
        raw(s?.teamName, s?.teamInRound?.teamName) || tir?.teamName || "",
    };
  };

  /**
   * Log sửa điểm phải đi qua 2 chặng: tìm ra các phiếu chấm rồi hỏi audit-log
   * của từng cái.
   *
   * Phiếu chấm được tìm bằng CẢ HAI đường rồi gộp, không phải đường này hỏng mới
   * chạy đường kia: `/api/Evaluation` liệt kê toàn hệ thống nhưng nhiều lúc
   * thiếu, còn đường đi từ bài nộp thì đủ cho sự kiện này nhưng phụ thuộc
   * `/api/Submission`. Trước đây đường bài nộp chỉ chạy khi đường kia ra rỗng —
   * nên chỉ cần một phiếu chấm cũ lọt lưới là những phiếu vừa bị sửa điểm không
   * bao giờ được hỏi tới, và bảng đứng im dù giám khảo vừa sửa xong.
   */
  const loadScoreLogs = async () => {
    try {
      setScoreLoading(true);
      setScoreError(null);
      setScoreNotice(null);

      /**
       * Đường chính: hỏi thẳng backend phiếu chấm nào thuộc sự kiện này.
       * Ra được thì dừng luôn ở đây — chỉ hỏi audit-log của đúng những phiếu đó,
       * nên bảng không thể lẫn bản ghi của sự kiện khác, và cũng không còn cảnh
       * "tìm thấy N thay đổi nhưng không truy được cái nào".
       */
      const eventScopes = await auditLogApi
        .getEvaluationScopesByEvent(eventId)
        .catch(() => [] as EvaluationScope[]);

      if (eventScopes.length > 0) {
        const logs = await auditLogApi.getScoreLogsByEvaluations(eventScopes);
        if (import.meta.env.DEV) {
          console.info("[AuditLogs] score changes (portal path)", {
            pageEventId: eventScope.eventId,
            evaluationsOfThisEvent: eventScopes.length,
            logsFetched: logs.length,
          });
        }
        setScoreLogs(sortByNewest(logs));
        return;
      }

      // Hỏng ở đây thì phải nói ra chứ không nuốt: mất danh sách bài nộp là mất
      // luôn đường neo phiếu chấm về sự kiện, và bảng sẽ trắng mà không rõ vì sao.
      const [listedRes, submissionsRes] = await Promise.allSettled([
        auditLogApi.getAllEvaluations(),
        auditLogApi.getAllSubmissions(),
      ]);
      const listed = listedRes.status === "fulfilled" ? listedRes.value : [];
      const submissions =
        submissionsRes.status === "fulfilled" ? submissionsRes.value : [];
      const submissionsFailed = submissionsRes.status === "rejected";

      const anchors = submissions.map(anchorOfSubmission);
      const anchorById = new Map(
        anchors.filter((a) => a.submissionId).map((a) => [idKey(a.submissionId), a]),
      );
      const oursSubmissionIds = anchors
        .filter(belongsToEvent)
        .map((a) => a.submissionId)
        .filter(Boolean);

      /**
       * Đường neo dự phòng, chỉ chạy khi đường chính không ra bài nộp nào.
       *
       * Audit log bài nộp được hỏi theo đúng cặp (đội của sự kiện này, sự kiện
       * này), nên submissionId đọc được từ đó chắc chắn thuộc đây — không cần
       * `/api/Submission` phải trả về đủ field, thậm chí không cần nó chạy được.
       * Đổi lại nó chỉ thấy những đội từng sửa link bài nộp.
       */
      const fallbackRows =
        oursSubmissionIds.length === 0 && teams.length > 0
          ? await auditLogApi.getSubmissionLogsByTeams(
              teams.map((t) => t.teamId),
              eventId,
            )
          : [];

      // Những dòng đó cũng là chỗ neo: chúng mang sẵn teamId/roundId, đủ để bảng
      // hiện đúng tên đội thay vì "Unknown team".
      fallbackRows.forEach((r) => {
        const key = idKey(r.submissionId);
        if (!key || anchorById.has(key)) return;
        anchorById.set(key, {
          submissionId: r.submissionId,
          teamInRoundId: "",
          teamId: r.teamId,
          roundId: r.roundId,
          trackId: r.trackId || trackIdByTeam[idKey(r.teamId)] || "",
          eventId: r.eventId || eventId,
          teamName: teamNameById[idKey(r.teamId)] || "",
        });
      });

      const fallbackSubmissionIds = [
        ...new Set(fallbackRows.map((r) => r.submissionId).filter(Boolean)),
      ];

      const probeIds = [
        ...new Set([...oursSubmissionIds, ...fallbackSubmissionIds]),
      ];
      const oursSubmissionIdSet = new Set(probeIds.map(idKey));

      // Phiếu chấm lần ra từ chính bài nộp của sự kiện => chắc chắn thuộc đây.
      const viaSubmissions = (
        await Promise.allSettled(
          probeIds.map((sid) => auditLogApi.getEvaluationsBySubmission(sid)),
        )
      )
        .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
        .map(readEvaluationScope)
        .filter((s) => s.evaluationId);

      const listedScopes = listed
        .map(readEvaluationScope)
        .filter((s) => s.evaluationId);

      // Gộp hai nguồn theo evaluationId, rồi neo lại bằng bài nộp của nó. Không
      // neo thì scope rỗng trơn, log cũng rỗng theo, và bản ghi không thể xác
      // định thuộc sự kiện nào — đúng là trường hợp bảng trắng ở MỌI sự kiện.
      const merged = new Map<string, EvaluationScope>();
      [...listedScopes, ...viaSubmissions].forEach((s) => {
        const key = idKey(s.evaluationId);
        const prev = merged.get(key) ?? ({} as any);
        const filled: any = { ...prev };
        Object.entries(s).forEach(([k, v]) => {
          if (v && !filled[k]) filled[k] = v;
        });
        const anchor = anchorById.get(idKey(filled.submissionId));
        if (anchor) {
          (
            [
              "teamInRoundId",
              "teamId",
              "roundId",
              "trackId",
              "eventId",
              "teamName",
            ] as const
          ).forEach((k) => {
            if (!filled[k] && anchor[k]) filled[k] = anchor[k];
          });
        }
        merged.set(key, filled);
      });
      const scopes = [...merged.values()];

      const trusted = new Set(
        viaSubmissions.map((s) => idKey(s.evaluationId)).filter(Boolean),
      );
      scopes.forEach((s) => {
        // Neo xong mới biết scope nào chỉ về sự kiện này.
        if (belongsToEvent(s)) trusted.add(idKey(s.evaluationId));
        // Đường ngắn nhất và chắc nhất: phiếu chấm nào cũng mang submissionId,
        // mà bài nộp nào thuộc sự kiện này thì vừa liệt kê xong ở trên.
        if (oursSubmissionIdSet.has(idKey(s.submissionId)))
          trusted.add(idKey(s.evaluationId));
      });

      const all = await auditLogApi.getScoreLogsByEvaluations(scopes);
      const mine = all.filter(
        (log) => trusted.has(idKey(log.evaluationId)) || belongsToEvent(log),
      );

      if (import.meta.env.DEV) {
        console.info("[AuditLogs] score changes", {
          pageEventId: eventScope.eventId,
          evaluationsListed: listed.length,
          submissionsListed: submissions.length,
          submissionsOfThisEvent: oursSubmissionIds.length,
          submissionsViaAuditFallback: fallbackSubmissionIds.length,
          submissionsProbed: probeIds.length,
          scopesQueried: scopes.length,
          trustedEvaluations: trusted.size,
          logsFetched: all.length,
          matchedThisEvent: mine.length,
          logEventIds: [...new Set(all.map((l) => idKey(l.eventId)))],
          logTeamIds: [...new Set(all.map((l) => idKey(l.teamId)))],
          eventTeamIds: [...eventScope.teamIds],
          eventRoundIds: [...eventScope.roundIds],
          teamInRoundsKnown: eventScope.teamInRoundIds.size,
          submissionsFailed,
        });
      }

      if (scopes.length === 0) {
        setScoreNotice(
          "No evaluation could be listed, so there was nothing to read a score history from. Neither /api/Evaluation nor this event's submissions returned one.",
        );
      } else if (all.length > 0 && mine.length === 0) {
        // Nói luôn mắt xích nào đứt. "Không truy được về sự kiện này" mà không
        // kèm lý do thì không ai biết phải sửa ở đâu.
        const why =
          probeIds.length > 0
            ? ""
            : submissionsFailed
              ? " The submission list (/api/Submission) could not be read, so there was no way to tell which team each evaluation belongs to."
              : " None of the submissions returned could be matched to a team of this event.";
        setScoreNotice(
          `Found ${all.length} score change${all.length === 1 ? "" : "s"} across ${scopes.length} evaluation${scopes.length === 1 ? "" : "s"}, but none of them could be traced back to this event.${why}`,
        );
      }

      setScoreLogs(sortByNewest(mine));
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

  // Nạp lại MỖI LẦN mở tab, không chỉ khi đang rỗng: giám khảo vừa sửa điểm
  // xong mà quay lại tab vẫn thấy bảng cũ thì đúng bằng không có audit log.
  useEffect(() => {
    if (view === "scores") loadScoreLogs();
    // teamInRounds về sau `teams` một nhịp; thiếu nó thì lượt nạp đầu tiên
    // không neo được bài nộp nào, nên phải chạy lại khi nó tới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, rounds.length, teams.length, teamInRounds.length]);

  const q = search.trim().toLowerCase();

  const subLogsWithRevision = useMemo(
    () => numberRevisionsByTeam(subLogs),
    [subLogs],
  );

  const totalSubRevisionsByTeam = useMemo(
    () => maxRevisionByTeam(subLogsWithRevision),
    [subLogsWithRevision],
  );

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

  const subGroups = useMemo(
    () =>
      groupByTeam(visibleSubLogs, totalSubRevisionsByTeam, (log) =>
        teamNameOf(log.teamId),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleSubLogs, totalSubRevisionsByTeam, teamNameById],
  );

  /**
   * Log điểm được gọi về một lượt cho cả sự kiện, nên bộ lọc đội chạy ở client —
   * khác chỗ nộp bài (lọc bằng cách chỉ gọi API của đội được chọn).
   */
  const scoreLogsOfTeam = useMemo(
    () =>
      teamFilter === "all"
        ? scoreLogs
        : scoreLogs.filter((l) => idKey(l.teamId) === idKey(teamFilter)),
    [scoreLogs, teamFilter],
  );

  const scoreLogsWithRevision = useMemo(
    () => numberRevisionsByTeam(scoreLogsOfTeam),
    [scoreLogsOfTeam],
  );

  const totalScoreRevisionsByTeam = useMemo(
    () => maxRevisionByTeam(scoreLogsWithRevision),
    [scoreLogsWithRevision],
  );

  const visibleScoreLogs = q
    ? scoreLogsWithRevision.filter((l) =>
        `${scoreTeamNameOf(l)} ${l.judgeName} ${l.judgeId} ${scoreRoundNameOf(
          l,
        )} ${scoreTrackNameOf(l)} ${l.eventName} ${l.reason} ${l.oldScore ?? ""} ${l.newScore ?? ""}`
          .toLowerCase()
          .includes(q),
      )
    : scoreLogsWithRevision;

  const scoreGroups = useMemo(
    () =>
      groupByTeam(visibleScoreLogs, totalScoreRevisionsByTeam, (log) =>
        scoreTeamNameOf(log),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleScoreLogs, totalScoreRevisionsByTeam, teamNameById],
  );

  // Nhiều đội thì mặc định gấp lại cho dễ nhìn; đang tìm kiếm hoặc chỉ có đúng
  // một đội thì mở sẵn, bắt người dùng bấm thêm một nhát nữa là vô duyên.
  useEffect(() => {
    if (q || subGroups.length === 1) {
      setExpandedSubTeams(new Set(subGroups.map((g) => g.key)));
    } else {
      setExpandedSubTeams(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, subLogs, teamFilter]);

  useEffect(() => {
    if (q || scoreGroups.length === 1) {
      setExpandedScoreTeams(new Set(scoreGroups.map((g) => g.key)));
    } else {
      setExpandedScoreTeams(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, scoreLogs, teamFilter]);

  const toggleIn =
    (setter: typeof setExpandedSubTeams) => (key: string) =>
      setter((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });

  const toggleSubTeam = toggleIn(setExpandedSubTeams);
  const toggleScoreTeam = toggleIn(setExpandedScoreTeams);

  const allSubExpanded =
    subGroups.length > 0 && subGroups.every((g) => expandedSubTeams.has(g.key));
  const allScoreExpanded =
    scoreGroups.length > 0 &&
    scoreGroups.every((g) => expandedScoreTeams.has(g.key));

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

  const groupsSummary = (groupCount: number, logCount: number) => (
    <p className="text-xs font-bold text-slate-400">
      {groupCount} team{groupCount === 1 ? "" : "s"} • {logCount} change
      {logCount === 1 ? "" : "s"}
    </p>
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
              {groupsSummary(subGroups.length, visibleSubLogs.length)}
              <button
                onClick={() =>
                  setExpandedSubTeams(
                    allSubExpanded
                      ? new Set()
                      : new Set(subGroups.map((g) => g.key)),
                  )
                }
                className="text-xs font-extrabold text-slate-500 hover:text-fpt-orange transition-colors"
              >
                {allSubExpanded ? "Collapse all" : "Expand all"}
              </button>
            </div>

            {subGroups.map((group) => (
              <TeamAccordion
                key={group.key}
                teamName={group.teamName}
                countLabel={countLabelOf(
                  group.logs.length,
                  group.totalRevisions,
                )}
                lastLabel={`Last edit ${formatWhen(group.lastChangedAt)}`}
                isOpen={expandedSubTeams.has(group.key)}
                onToggle={() => toggleSubTeam(group.key)}
              >
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
              </TeamAccordion>
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
      ) : visibleScoreLogs.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-center text-slate-500 font-medium space-y-2">
          <p>
            {scoreNotice
              ? "Nothing to show for this event."
              : "No judge has revised a score yet."}
          </p>
          {scoreNotice && (
            <p className="text-xs font-bold text-amber-600 max-w-xl mx-auto">
              {scoreNotice}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            {groupsSummary(scoreGroups.length, visibleScoreLogs.length)}
            <button
              onClick={() =>
                setExpandedScoreTeams(
                  allScoreExpanded
                    ? new Set()
                    : new Set(scoreGroups.map((g) => g.key)),
                )
              }
              className="text-xs font-extrabold text-slate-500 hover:text-fpt-orange transition-colors"
            >
              {allScoreExpanded ? "Collapse all" : "Expand all"}
            </button>
          </div>

          {scoreGroups.map((group) => (
            <TeamAccordion
              key={group.key}
              teamName={group.teamName}
              countLabel={countLabelOf(group.logs.length, group.totalRevisions)}
              lastLabel={`Last change ${formatWhen(group.lastChangedAt)}`}
              isOpen={expandedScoreTeams.has(group.key)}
              onToggle={() => toggleScoreTeam(group.key)}
            >
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
                        label={scoreRoundNameOf(log)}
                      />
                      <ScopeChip
                        tone="track"
                        icon={<Layers size={11} strokeWidth={3} />}
                        label={scoreTrackNameOf(log)}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {formatWhen(log.changedAt)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <ScoreDiff before={log.oldScore} after={log.newScore} />
                    <DetailLine
                      label="Judge"
                      icon={<Gavel size={11} strokeWidth={3} />}
                      value={log.judgeName || log.judgeId}
                      empty="Unknown judge"
                    />
                    <DetailLine
                      label="Reason"
                      icon={<MessageSquare size={11} strokeWidth={3} />}
                      value={log.reason}
                      empty="No reason given"
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-300">
                    <span>Evaluation {log.evaluationId || "—"}</span>
                    <span>Log {log.id || "—"}</span>
                    {log.judgeId && <span>Judge ID {log.judgeId}</span>}
                  </div>
                </div>
              ))}
            </TeamAccordion>
          ))}
        </div>
      )}
    </div>
  );
}
