import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Eye,
  FileText,
  FileX,
  Hexagon,
  Home,
  Mail,
  MessageCircle,
  PlayCircle,
  RefreshCw,
  Scale,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import { type MentorTeamDetail } from "../../lib/api/mentorApi";
import {
  teacherApi,
  type TeacherPortalEvent,
  type TeacherPortalEventDetail,
  type TeacherPortalTeam,
  type TeacherPortalTrack,
} from "../../lib/api/teacher";
import { judgeApi } from "../../lib/api/judgeApi";
import { useAuthStore } from "../../stores/auth.store";

type TeacherEventGroup = {
  key: string;
  eventId?: string;
  eventName: string;
  currentRoundName?: string;
  startDate?: string;
  endDate?: string;
  scoringStartDate?: string;
  scoringEndDate?: string;
  judgeTracks: TeacherPortalTrack[];
  mentorTracks: TeacherPortalTrack[];
  summary: {
    totalTeams: number;
    submittedTeams: number;
    pendingScoreTeams: number;
    scoredTeams: number;
    mentorTeams: number;
  };
  judgeTeams: TeacherPortalTeam[];
  mentorTeams: TeacherPortalTeam[];
  allTeams: TeacherPortalTeam[];
  roles: {
    isJudge: boolean;
    isMentor: boolean;
  };
};

type DetailTab =
  | "overview"
  | "teams"
  | "submissions"
  | "scoring"
  | "mentor";

function getUserFromToken(accessToken?: string | null): any {
  if (!accessToken) return null;
  try {
    const decoded: any = jwtDecode(accessToken);
    const id =
      decoded?.id ||
      decoded?.Id ||
      decoded?.sub ||
      decoded?.nameid ||
      decoded?.userId ||
      decoded?.UserId ||
      decoded?.teacherId ||
      decoded?.teacherID ||
      decoded?.TeacherId ||
      decoded?.TeacherID ||
      decoded?.[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ||
      "";

    return {
      id,
      fullName:
        decoded?.fullName ||
        decoded?.FullName ||
        decoded?.name ||
        decoded?.unique_name ||
        decoded?.email,
      email: decoded?.email,
    };
  } catch (err) {
    console.error("Failed to decode accessToken:", err);
    return null;
  }
}

const readString = (value: any, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
};

const getTrackName = (item: any) =>
  readString(
    item?.trackName ||
      item?.TrackName ||
      item?.track?.trackName ||
      item?.track?.name,
    "No track",
  );

const getTrackId = (item: any) =>
  readString(
    item?.trackId ||
      item?.trackID ||
      item?.TrackID ||
      item?.track?.trackId ||
      item?.track?.trackID ||
      item?.track?.id,
  );

const normalizeCompareKey = (value?: string) =>
  readString(value).toLowerCase().trim();

const teamMatchesAssignedTracks = (
  team: any,
  tracks: TeacherPortalTrack[],
) => {
  if (!tracks.length) return false;

  const assignedTrackIds = new Set(
    tracks.map((track) => normalizeCompareKey(track.trackId)).filter(Boolean),
  );
  const assignedTrackNames = new Set(
    tracks
      .map((track) => normalizeCompareKey(track.trackName))
      .filter(Boolean),
  );
  const teamTrackId = normalizeCompareKey(getTrackId(team));
  const teamTrackName = normalizeCompareKey(getTrackName(team));

  return Boolean(
    (teamTrackId && assignedTrackIds.has(teamTrackId)) ||
      (teamTrackName && assignedTrackNames.has(teamTrackName)),
  );
};

const getRoundName = (item: any) =>
  readString(
    item?.roundName ||
      item?.RoundName ||
      item?.currentRoundName ||
      item?.CurrentRoundName,
    "-",
  );

const getTeamId = (team: any) =>
  readString(team?.teamId || team?.teamID || team?.TeamID || team?.id);

const getTeamName = (team: any) =>
  readString(team?.teamName || team?.TeamName || team?.name, "Unnamed Team");

const getJudgeAssignmentId = (team: any) =>
  readString(team?.teamInRoundId || team?.teamInRoundID || team?.teamId);

const getJudgeSubmissionId = (team: any) =>
  readString(team?.submissionId || team?.submissionID);

const getJudgeEvaluationId = (team: any) =>
  readString(team?.evaluationId || team?.evaluationID || team?.EvaluationID);

const isJudgeSubmissionAvailable = (team: any) => {
  const status = readString(
    team?.submissionStatus || team?.SubmissionStatus,
  ).toLowerCase();
  return Boolean(
    getJudgeSubmissionId(team) ||
      team?.urlGithub ||
      team?.urlDemo ||
      team?.urlSlide ||
      status.includes("submitted") ||
      status.includes("Have"),
  );
};

const isJudgeEvaluated = (team: any) => {
  const score = team?.score ?? team?.Score;
  const status = readString(
    team?.scoringStatus || team?.ScoringStatus,
  ).toLowerCase();
  return Boolean(
    team?.evaluationId ||
      team?.evaluationID ||
      status.includes("scored") ||
      (score !== null && score !== undefined && Number.isFinite(Number(score))),
  );
};

const isUrgentScoringTeam = (team: any) =>
  team?.isUrgentScoring === true ||
  team?.IsUrgentScoring === true ||
  String(team?.isUrgentScoring || team?.IsUrgentScoring || "")
    .toLowerCase()
    .trim() === "true";

const getUrgentMessage = (team: any) =>
  readString(team?.urgentMessage || team?.UrgentMessage);

const normalizeApiList = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const getAuditAction = (log: any) =>
  readString(
    log?.action ||
      log?.Action ||
      log?.activity ||
      log?.Activity ||
      log?.message ||
      log?.Message,
    "Evaluation updated",
  );

const getAuditReason = (log: any) =>
  readString(
    log?.reason ||
      log?.Reason ||
      log?.feedback ||
      log?.Feedback ||
      log?.note ||
      log?.Note,
  );

const getAuditActor = (log: any) =>
  readString(
    log?.teacherName ||
      log?.TeacherName ||
      log?.judgeName ||
      log?.JudgeName ||
      log?.createdBy ||
      log?.CreatedBy ||
      log?.updatedBy ||
      log?.UpdatedBy,
  );

const getAuditTimestamp = (log: any) =>
  readString(
    log?.createdAt ||
      log?.CreatedAt ||
      log?.updatedAt ||
      log?.UpdatedAt ||
      log?.timestamp ||
      log?.Timestamp,
  );

const getAuditScoreText = (log: any) => {
  const oldScore =
    log?.oldScore ??
    log?.OldScore ??
    log?.previousScore ??
    log?.PreviousScore ??
    log?.oldValue ??
    log?.OldValue;
  const newScore =
    log?.newScore ??
    log?.NewScore ??
    log?.score ??
    log?.Score ??
    log?.newValue ??
    log?.NewValue;

  if (oldScore !== undefined && oldScore !== null && newScore !== undefined && newScore !== null) {
    return `${oldScore} -> ${newScore} pts`;
  }
  if (newScore !== undefined && newScore !== null) return `${newScore} pts`;
  return "";
};

const hasSubmissionLink = (detail: MentorTeamDetail | TeacherPortalTeam | null) =>
  Boolean(detail?.urlGithub || detail?.urlDemo || detail?.urlSlide);

const uniqueValues = (items: any[], reader: (item: any) => string) =>
  Array.from(new Set(items.map(reader).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );

const openUrl = (url?: string) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

const openLeaderGmailCompose = ({
  leaderEmail,
  teamName,
  eventName,
  trackName,
  roundName,
}: {
  leaderEmail: string;
  teamName: string;
  eventName?: string;
  trackName?: string;
  roundName?: string;
}) => {
  const subject = `[SEAL Hackathon] Mentor support for ${teamName || "your team"}`;
  const body = `
Dear Team Leader,

I am contacting you regarding your team's hackathon progress.

Team: ${teamName || "-"}
Event: ${eventName || "-"}
Track: ${trackName || "-"}
Current Round: ${roundName || "-"}

Message:
-

Best regards.
`.trim();

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    leaderEmail,
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.open(gmailUrl, "_blank", "noopener,noreferrer");
};

const getEventKey = (item: { eventId?: string; eventName?: string }) =>
  item.eventId || item.eventName?.toLowerCase() || "unassigned";

const portalEventToGroup = (
  event: TeacherPortalEvent | TeacherPortalEventDetail,
): TeacherEventGroup => {
  const teams =
    "teams" in event && Array.isArray(event.teams) ? event.teams : [];
  const judgeTracks = event.judgeTracks || [];
  const mentorTracks = event.mentorTracks || [];
  const judgeTeams = teams.filter(
    (team) =>
      teamMatchesAssignedTracks(team, judgeTracks) ||
      (judgeTracks.length === 0 && team.canScore),
  );
  const mentorTeams = teams.filter(
    (team) =>
      teamMatchesAssignedTracks(team, mentorTracks) ||
      (mentorTracks.length === 0 && team.canMentorContact),
  );

  return {
    key: getEventKey(event),
    eventId: event.eventId,
    eventName: event.eventName,
    currentRoundName: event.currentRoundName,
    startDate: event.startDate,
    endDate: event.endDate,
    scoringStartDate: event.scoringStartDate,
    scoringEndDate: event.scoringEndDate,
    judgeTracks,
    mentorTracks,
    summary: event.summary,
    judgeTeams,
    mentorTeams,
    allTeams: teams,
    roles: event.roles || {
      isJudge: (event.judgeTracks || []).length > 0,
      isMentor: (event.mentorTracks || []).length > 0,
    },
  };
};

const countUniqueTeams = (group: TeacherEventGroup) => {
  if (group.summary.totalTeams > 0) return group.summary.totalTeams;
  const ids = new Set<string>();
  group.allTeams.forEach((team) => {
    ids.add(getTeamId(team) || getTeamName(team));
  });
  return ids.size;
};

const eventMatchesSearch = (group: TeacherEventGroup, query: string) => {
  if (!query) return true;
  const haystack = [
    group.eventName,
    group.startDate,
    group.endDate,
    ...group.judgeTracks.map((track) => track.trackName),
    ...group.mentorTracks.map((track) => track.trackName),
    ...uniqueValues(group.allTeams, getTrackName),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
};

const formatEventDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const TEACHER_PORTAL_STATE_KEY = "teacherPortal:selectedEvent";

const saveTeacherPortalState = (eventKey: string, tab: DetailTab) => {
  sessionStorage.setItem(
    TEACHER_PORTAL_STATE_KEY,
    JSON.stringify({ eventKey, tab }),
  );
};

const readTeacherPortalState = (): { eventKey: string; tab: DetailTab } | null => {
  try {
    const raw = sessionStorage.getItem(TEACHER_PORTAL_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.eventKey) return null;
    return {
      eventKey: String(parsed.eventKey),
      tab: parsed.tab || "overview",
    };
  } catch {
    return null;
  }
};

export function JudgeDashboard() {
  const navigate = useNavigate();
  const [portalEvents, setPortalEvents] = useState<TeacherPortalEvent[]>([]);
  const [portalDetails, setPortalDetails] = useState<
    Record<string, TeacherPortalEventDetail>
  >({});
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [detailLoadingKey, setDetailLoadingKey] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [selectedEventKey, setSelectedEventKey] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [detailSearch, setDetailSearch] = useState("");
  const [selectedJudgeTeam, setSelectedJudgeTeam] = useState<any | null>(null);
  const [evaluationAuditLogs, setEvaluationAuditLogs] = useState<any[]>([]);
  const [isEvaluationAuditLoading, setIsEvaluationAuditLoading] =
    useState(false);
  const [evaluationAuditError, setEvaluationAuditError] = useState("");
  const [selectedMentorTeam, setSelectedMentorTeam] =
    useState<TeacherPortalTeam | null>(null);
  const [mentorTeamDetail, setMentorTeamDetail] =
    useState<MentorTeamDetail | null>(null);
  const [isMentorDetailLoading, setIsMentorDetailLoading] = useState(false);
  const [mentorDetailError, setMentorDetailError] = useState("");

  const accessToken = useAuthStore((state: any) => state.accessToken);
  const storeUser = useAuthStore(
    (state: any) => state.user || state.profile || null,
  );

  const user = storeUser || getUserFromToken(accessToken);
  const currentTeacherId =
    user?.id || user?.Id || user?.teacherId || user?.teacherID || "";

  const loadPortalEvents = async () => {
    if (!currentTeacherId) {
      setPortalEvents([]);
      setIsEventsLoading(false);
      return;
    }

    try {
      setIsEventsLoading(true);
      const data = await teacherApi.getPortalEvents(currentTeacherId);
      setPortalEvents(data);
    } catch (error: any) {
      console.error("Failed to load teacher portal events:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Load Data",
        text:
          error.response?.data?.message ||
          "Could not load your assigned events.",
      });
      setPortalEvents([]);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const loadPortalDetail = async (eventId: string, eventKey: string) => {
    if (!currentTeacherId || !eventId || portalDetails[eventKey]) return;

    try {
      setDetailLoadingKey(eventKey);
      const detail = await teacherApi.getPortalEventDetail(
        currentTeacherId,
        eventId,
      );
      setPortalDetails((prev) => ({
        ...prev,
        [eventKey]: detail,
      }));
    } catch (error: any) {
      console.error("Failed to load event detail:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Load Detail",
        text:
          error.response?.data?.message ||
          "Could not load the event workspace.",
      });
    } finally {
      setDetailLoadingKey("");
    }
  };

  useEffect(() => {
    loadPortalEvents();
  }, [currentTeacherId]);

  const eventGroups = useMemo(
    () => portalEvents.map(portalEventToGroup),
    [portalEvents],
  );

  const filteredEvents = eventGroups.filter((group) =>
    eventMatchesSearch(group, eventSearch.trim().toLowerCase()),
  );

  const selectedEventSummary =
    eventGroups.find((group) => group.key === selectedEventKey) || null;
  const selectedEventDetail = selectedEventKey
    ? portalDetails[selectedEventKey]
    : null;
  const selectedEvent = selectedEventDetail
    ? portalEventToGroup(selectedEventDetail)
    : selectedEventSummary;

  useEffect(() => {
    if (isEventsLoading || selectedEventKey) return;
    const saved = readTeacherPortalState();
    if (!saved) return;
    const eventStillExists = eventGroups.some(
      (group) => group.key === saved.eventKey,
    );
    if (!eventStillExists) return;
    setSelectedEventKey(saved.eventKey);
    setActiveTab(saved.tab);
    const savedGroup = eventGroups.find((group) => group.key === saved.eventKey);
    if (savedGroup?.eventId) {
      void loadPortalDetail(savedGroup.eventId, savedGroup.key);
    }
  }, [eventGroups, isEventsLoading, selectedEventKey]);

  const selectedJudgeSubmitted = isJudgeSubmissionAvailable(selectedJudgeTeam);
  const selectedJudgeEvaluated = isJudgeEvaluated(selectedJudgeTeam);
  const displayedMentorDetail = mentorTeamDetail || selectedMentorTeam;
  const mentorTeamSubmitted = hasSubmissionLink(mentorTeamDetail);

  useEffect(() => {
    const evaluationId = getJudgeEvaluationId(selectedJudgeTeam);

    if (!selectedJudgeTeam || !evaluationId) {
      setEvaluationAuditLogs([]);
      setEvaluationAuditError("");
      setIsEvaluationAuditLoading(false);
      return;
    }

    let cancelled = false;

    const loadAuditLogs = async () => {
      try {
        setIsEvaluationAuditLoading(true);
        setEvaluationAuditError("");
        const response = await judgeApi.getJudgeEvaluationAuditLogs(evaluationId);
        if (!cancelled) setEvaluationAuditLogs(normalizeApiList(response));
      } catch (error: any) {
        if (!cancelled) {
          setEvaluationAuditLogs([]);
          setEvaluationAuditError(
            error.response?.data?.message || "Could not load audit logs.",
          );
        }
      } finally {
        if (!cancelled) setIsEvaluationAuditLoading(false);
      }
    };

    loadAuditLogs();

    return () => {
      cancelled = true;
    };
  }, [selectedJudgeTeam]);

  const isLoading = isEventsLoading;

  const openEvent = (group: TeacherEventGroup) => {
    setSelectedEventKey(group.key);
    setActiveTab("overview");
    setDetailSearch("");
    saveTeacherPortalState(group.key, "overview");
    if (group.eventId) void loadPortalDetail(group.eventId, group.key);
  };

  const closeEvent = () => {
    setSelectedEventKey("");
    setActiveTab("overview");
    setDetailSearch("");
    sessionStorage.removeItem(TEACHER_PORTAL_STATE_KEY);
  };

  const changeDetailTab = (tab: DetailTab) => {
    setActiveTab(tab);
    if (selectedEventKey) saveTeacherPortalState(selectedEventKey, tab);
  };

  const goToScore = (team: any) => {
    if (selectedEventKey) saveTeacherPortalState(selectedEventKey, "scoring");
    navigate(
      `/judge/score/${getJudgeSubmissionId(team) || getJudgeAssignmentId(team)}`,
      { state: { team } },
    );
  };

  const handleViewMentorTeam = (team: TeacherPortalTeam) => {
    if (!team.teamId) return;

    setSelectedMentorTeam(team);
    setMentorTeamDetail({
      teamId: team.teamId,
      teamName: team.teamName,
      eventName: team.eventName,
      trackName: team.trackName,
      roundName: team.roundName,
      urlGithub: team.urlGithub,
      urlDemo: team.urlDemo,
      urlSlide: team.urlSlide,
      leaderEmail: team.leaderEmail,
    });
    setMentorDetailError("");
    setIsMentorDetailLoading(false);
  };

  const closeMentorDetail = () => {
    setSelectedMentorTeam(null);
    setMentorTeamDetail(null);
    setMentorDetailError("");
    setIsMentorDetailLoading(false);
  };

  const refreshAll = () => {
    setPortalDetails({});
    loadPortalEvents();
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] font-sans text-slate-900 pb-12">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f26f21] text-white shadow-sm">
            <Hexagon size={26} className="fill-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight tracking-tight">
              FPT Hackathon
            </h1>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Teacher Portal
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/judge/profile")}
          className="group flex cursor-pointer items-center gap-3 text-left"
        >
          <div className="text-right">
            <h2 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-[#f26f21]">
              {user?.fullName || user?.name || user?.email || "Teacher"}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Judge & Mentor Panel
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b7a3b] text-sm font-bold uppercase text-white shadow-md">
            {(user?.fullName || user?.name || user?.email || "T")[0]}
          </div>
        </button>
      </header>

      <main className="mx-auto mt-10 max-w-7xl space-y-6 px-4">
        {!selectedEvent ? (
          <EventListView
            userName={user?.fullName || user?.name || user?.email || "Teacher"}
            events={filteredEvents}
            totalEvents={eventGroups.length}
            eventSearch={eventSearch}
            onSearch={setEventSearch}
            onOpenEvent={openEvent}
            onRefresh={refreshAll}
            isLoading={isLoading}
            hasTeacherId={Boolean(currentTeacherId)}
          />
        ) : (
          <EventDetailView
            group={selectedEvent}
            activeTab={activeTab}
            onTabChange={changeDetailTab}
            onBack={closeEvent}
            searchTerm={detailSearch}
            onSearch={setDetailSearch}
            onViewJudgeTeam={setSelectedJudgeTeam}
            onViewMentorTeam={handleViewMentorTeam}
            onScoreTeam={goToScore}
            isDetailLoading={detailLoadingKey === selectedEventKey}
          />
        )}
      </main>

      {selectedJudgeTeam && (
        <JudgeDetailModal
          team={selectedJudgeTeam}
          isSubmitted={selectedJudgeSubmitted}
          isEvaluated={selectedJudgeEvaluated}
          auditLogs={evaluationAuditLogs}
          isAuditLoading={isEvaluationAuditLoading}
          auditError={evaluationAuditError}
          onClose={() => setSelectedJudgeTeam(null)}
          onScore={() => goToScore(selectedJudgeTeam)}
        />
      )}

      {selectedMentorTeam && (
        <MentorDetailModal
          displayedDetail={displayedMentorDetail}
          teamDetail={mentorTeamDetail}
          isLoading={isMentorDetailLoading}
          error={mentorDetailError}
          isSubmitted={mentorTeamSubmitted}
          onClose={closeMentorDetail}
        />
      )}
    </div>
  );
}

function EventListView({
  userName,
  events,
  totalEvents,
  eventSearch,
  onSearch,
  onOpenEvent,
  onRefresh,
  isLoading,
  hasTeacherId,
}: {
  userName: string;
  events: TeacherEventGroup[];
  totalEvents: number;
  eventSearch: string;
  onSearch: (value: string) => void;
  onOpenEvent: (group: TeacherEventGroup) => void;
  onRefresh: () => void;
  isLoading: boolean;
  hasTeacherId: boolean;
}) {
  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#f26f21]">
            Judge / Mentor Portal
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">
            Assigned Events
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Welcome back, {userName}.
          </p>
        </div>

        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={eventSearch}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search event or track..."
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-medium outline-none transition-all focus:border-[#f26f21] focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
            aria-label="Refresh assignments"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </section>

      {!hasTeacherId ? (
        <EmptyState
          icon={<AlertCircle className="h-10 w-10" />}
          title="Sign in again"
          message="The system cannot identify your teacher account."
        />
      ) : isLoading ? (
        <EmptyState
          icon={<RefreshCw className="h-10 w-10 animate-spin" />}
          title="Loading assignments"
          message="Preparing your event workspace."
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title={totalEvents === 0 ? "No assigned events" : "No events found"}
          message={
            totalEvents === 0
              ? "You have not been assigned as Judge or Mentor yet."
              : "Try another keyword."
          }
        />
      ) : (
        <section className="grid gap-4">
          {events.map((group, index) => (
            <EventCard
              key={group.key}
              group={group}
              index={index}
              onOpen={() => onOpenEvent(group)}
            />
          ))}
        </section>
      )}
    </>
  );
}

function EventCard({
  group,
  index,
  onOpen,
}: {
  group: TeacherEventGroup;
  index: number;
  onOpen: () => void;
}) {
  const judgeTracks = group.judgeTracks.map((track) => track.trackName);
  const mentorTracks = group.mentorTracks.map((track) => track.trackName);
  const submittedCount =
    group.summary.submittedTeams ||
    group.judgeTeams.filter(isJudgeSubmissionAvailable).length;
  const pendingScoreCount =
    group.summary.pendingScoreTeams ||
    group.judgeTeams.filter(
      (team) => isJudgeSubmissionAvailable(team) && !isJudgeEvaluated(team),
    ).length;
  const accent = index % 2 === 0 ? "#f26f21" : "#1f5eff";

  return (
    <article className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:grid-cols-[180px_1fr_auto]">
      <div
        className="flex min-h-40 flex-col justify-between rounded-lg p-5 text-white"
        style={{ background: accent }}
      >
        <div className="text-xs font-extrabold uppercase tracking-widest opacity-80">
          Hackathon
        </div>
        <div>
          <p className="text-2xl font-black leading-tight">SEAL</p>
          <p className="text-2xl font-black leading-tight">Event</p>
        </div>
      </div>

      <div className="min-w-0 py-1">
        <h2 className="truncate text-2xl font-extrabold text-slate-950">
          {group.eventName}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {judgeTracks.map((track) => (
            <RoleBadge key={`judge-${track}`} tone="judge">
              Judge: {track}
            </RoleBadge>
          ))}
          {mentorTracks.map((track) => (
            <RoleBadge key={`mentor-${track}`} tone="mentor">
              Mentor: {track}
            </RoleBadge>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <DatePill label="Scoring Start" value={group.scoringStartDate} />
          <DatePill label="Scoring End" value={group.scoringEndDate} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Metric label="Teams" value={countUniqueTeams(group)} />
          <Metric label="Submissions" value={submittedCount} />
          <Metric label="Pending Scores" value={pendingScoreCount} />
          <Metric label="Email Support" value={group.mentorTeams.length} />
        </div>
      </div>

      <div className="flex items-end md:items-center">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f26f21] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#d85f16]"
        >
          View Detail
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function EventDetailView({
  group,
  activeTab,
  onTabChange,
  onBack,
  searchTerm,
  onSearch,
  onViewJudgeTeam,
  onViewMentorTeam,
  onScoreTeam,
  isDetailLoading,
}: {
  group: TeacherEventGroup;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onBack: () => void;
  searchTerm: string;
  onSearch: (value: string) => void;
  onViewJudgeTeam: (team: any) => void;
  onViewMentorTeam: (team: TeacherPortalTeam) => void;
  onScoreTeam: (team: any) => void;
  isDetailLoading: boolean;
}) {
  const canJudge = group.roles.isJudge || group.judgeTeams.length > 0;
  const canMentor = group.roles.isMentor || group.mentorTeams.length > 0;
  const submittedCount =
    group.summary.submittedTeams ||
    group.judgeTeams.filter(isJudgeSubmissionAvailable).length;
  const pendingScoreCount =
    group.summary.pendingScoreTeams ||
    group.judgeTeams.filter(
      (team) => isJudgeSubmissionAvailable(team) && !isJudgeEvaluated(team),
    ).length;
  const judgeTracks = group.judgeTracks.map((track) => track.trackName);
  const mentorTracks = group.mentorTracks.map((track) => track.trackName);

  const safeActiveTab =
    activeTab === "scoring" && !canJudge
      ? "overview"
      : activeTab === "mentor" && !canMentor
        ? "overview"
        : activeTab;

  const query = searchTerm.trim().toLowerCase();
  const filterTeam = (team: any) =>
    !query ||
    [getTeamName(team), getTrackName(team), getRoundName(team)]
      .join(" ")
      .toLowerCase()
      .includes(query);

  const combinedTeams = [
    ...group.judgeTeams.map((team) => ({ team, role: "Judge" })),
    ...group.mentorTeams.map((team) => ({ team, role: "Mentor" })),
  ].filter(({ team }) => filterTeam(team));
  const scoringTeams = group.judgeTeams.filter(filterTeam);
  const mentorRows = group.mentorTeams.filter(filterTeam);
  const urgentScoringTeams = group.judgeTeams.filter(
    (team) =>
      isUrgentScoringTeam(team) &&
      isJudgeSubmissionAvailable(team) &&
      !isJudgeEvaluated(team),
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            {group.eventName}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {judgeTracks.map((track) => (
              <RoleBadge key={track} tone="judge">
                Track Judge: {track}
              </RoleBadge>
            ))}
            {mentorTracks.map((track) => (
              <RoleBadge key={track} tone="mentor">
                Track Mentor: {track}
              </RoleBadge>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <DatePill label="Scoring Start" value={group.scoringStartDate} />
            <DatePill label="Scoring End" value={group.scoringEndDate} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
          <SummaryCard icon={<UsersRound />} label="Teams" value={countUniqueTeams(group)} />
          <SummaryCard icon={<FileText />} label="Submissions" value={submittedCount} />
          <SummaryCard icon={<Scale />} label="To Score" value={pendingScoreCount} />
          <SummaryCard icon={<Mail />} label="Email Support" value={group.mentorTeams.length} />
        </div>
      </div>

      {urgentScoringTeams.length > 0 && (
        <UrgentScoringCard
          teams={urgentScoringTeams}
          onViewTeam={onViewJudgeTeam}
          onScoreTeam={onScoreTeam}
        />
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-1">
          <TabButton
            active={safeActiveTab === "overview"}
            onClick={() => onTabChange("overview")}
            icon={<Home className="h-4 w-4" />}
          >
            Overview
          </TabButton>
          <TabButton
            active={safeActiveTab === "teams"}
            onClick={() => onTabChange("teams")}
            icon={<UsersRound className="h-4 w-4" />}
          >
            Teams
          </TabButton>
          <TabButton
            active={safeActiveTab === "submissions"}
            onClick={() => onTabChange("submissions")}
            icon={<FileText className="h-4 w-4" />}
          >
            Submissions
          </TabButton>
          {canJudge && (
            <TabButton
              active={safeActiveTab === "scoring"}
              onClick={() => onTabChange("scoring")}
              icon={<Scale className="h-4 w-4" />}
            >
              Scoring
            </TabButton>
          )}
          {canMentor && (
            <TabButton
              active={safeActiveTab === "mentor"}
              onClick={() => onTabChange("mentor")}
              icon={<MessageCircle className="h-4 w-4" />}
            >
              Email Support
            </TabButton>
          )}
        </div>
      </div>

      {safeActiveTab !== "overview" && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search team or track..."
            className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-medium outline-none transition-all focus:border-[#f26f21] focus:ring-2 focus:ring-orange-100"
          />
        </div>
      )}

      {isDetailLoading && (
        <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-[#c2410c]">
          Loading event detail...
        </div>
      )}

      {safeActiveTab === "overview" && (
        <OverviewPanel
          group={group}
          judgeTracks={judgeTracks}
          mentorTracks={mentorTracks}
        />
      )}
      {safeActiveTab === "teams" && (
        <TeamsPanel rows={combinedTeams} onViewJudgeTeam={onViewJudgeTeam} onViewMentorTeam={onViewMentorTeam} />
      )}
      {safeActiveTab === "submissions" && (
        <SubmissionsPanel teams={scoringTeams} onViewTeam={onViewJudgeTeam} onScoreTeam={onScoreTeam} />
      )}
      {safeActiveTab === "scoring" && (
        <ScoringPanel teams={scoringTeams} onViewTeam={onViewJudgeTeam} onScoreTeam={onScoreTeam} />
      )}
      {safeActiveTab === "mentor" && (
        <MentorSupportPanel teams={mentorRows} onViewTeam={onViewMentorTeam} />
      )}
    </section>
  );
}

function OverviewPanel({
  group,
  judgeTracks,
  mentorTracks,
}: {
  group: TeacherEventGroup;
  judgeTracks: string[];
  mentorTracks: string[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-950">
          Assignment Summary
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <InfoBlock
            label="Scoring Start"
            value={formatEventDate(group.scoringStartDate)}
          />
          <InfoBlock
            label="Scoring End"
            value={formatEventDate(group.scoringEndDate)}
          />
          <InfoBlock label="Judge Tracks" value={judgeTracks.join(", ") || "-"} />
          <InfoBlock label="Mentor Tracks" value={mentorTracks.join(", ") || "-"} />
          <InfoBlock label="Judge Teams" value={String(group.judgeTeams.length)} />
          <InfoBlock label="Mentor Teams" value={String(group.mentorTeams.length)} />
        </div>
      </section>

      <section className="rounded-lg border border-orange-100 bg-orange-50 p-6 shadow-sm">
        <p className="text-sm font-extrabold text-[#c2410c]">
          Mentor support is email-based
        </p>
        <p className="mt-2 text-sm leading-6 text-orange-900">
          Team support opens Gmail to the team leader. No internal chat data is
          created until the backend provides a question API.
        </p>
      </section>
    </div>
  );
}

function TeamsPanel({
  rows,
  onViewJudgeTeam,
  onViewMentorTeam,
}: {
  rows: { team: any; role: string }[];
  onViewJudgeTeam: (team: any) => void;
  onViewMentorTeam: (team: TeacherPortalTeam) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState icon={<UsersRound className="h-10 w-10" />} title="No teams found" message="No team matches the current search." />;
  }

  return (
    <DataTable
      headers={["Team", "Role", "Track", "Round", "Status", "Action"]}
      rows={rows.map(({ team, role }) => [
        <TeamCell key="team" team={team} />,
        <RoleBadge key="role" tone={role === "Judge" ? "judge" : "mentor"}>
          {role}
        </RoleBadge>,
        getTrackName(team),
        role === "Judge" ? getRoundName(team) : "-",
        role === "Judge" ? <JudgeStatusBadge team={team} /> : "Email support",
        <button
          key="action"
          type="button"
          onClick={() =>
            role === "Judge"
              ? onViewJudgeTeam(team)
              : onViewMentorTeam(team as TeacherPortalTeam)
          }
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" />
          View
        </button>,
      ])}
    />
  );
}

function SubmissionsPanel({
  teams,
  onViewTeam,
  onScoreTeam,
}: {
  teams: any[];
  onViewTeam: (team: any) => void;
  onScoreTeam: (team: any) => void;
}) {
  if (teams.length === 0) {
    return <EmptyState icon={<FileText className="h-10 w-10" />} title="No submissions found" message="No judge assignment matches the current search." />;
  }

  return (
    <DataTable
      headers={["Team", "Track", "Round", "Status", "Action"]}
      rows={teams.map((team) => [
        <TeamCell key="team" team={team} />,
        getTrackName(team),
        getRoundName(team),
        <JudgeStatusBadge key="status" team={team} />,
        <div key="action" className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onViewTeam(team)}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold text-[#c2410c] transition-colors hover:bg-orange-100"
          >
            <Eye className="h-4 w-4" />
            Detail
          </button>
          <ScoreButton team={team} onClick={() => onScoreTeam(team)} />
        </div>,
      ])}
    />
  );
}

function ScoringPanel({
  teams,
  onViewTeam,
  onScoreTeam,
}: {
  teams: any[];
  onViewTeam: (team: any) => void;
  onScoreTeam: (team: any) => void;
}) {
  const pendingTeams = teams.filter(
    (team) => isJudgeSubmissionAvailable(team) && !isJudgeEvaluated(team),
  );
  const displayTeams = pendingTeams.length > 0 ? pendingTeams : teams;

  if (displayTeams.length === 0) {
    return <EmptyState icon={<Scale className="h-10 w-10" />} title="No scoring queue" message="No submissions are ready for scoring." />;
  }

  return (
    <DataTable
      headers={["Team", "Track", "Round", "Score", "Status", "Action"]}
      rows={displayTeams.map((team) => [
        <TeamCell key="team" team={team} />,
        getTrackName(team),
        getRoundName(team),
        isJudgeEvaluated(team) ? team.score ?? "0" : "-",
        <JudgeStatusBadge key="status" team={team} />,
        <div key="action" className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onViewTeam(team)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Detail
          </button>
          <ScoreButton team={team} onClick={() => onScoreTeam(team)} />
        </div>,
      ])}
    />
  );
}

function MentorSupportPanel({
  teams,
  onViewTeam,
}: {
  teams: TeacherPortalTeam[];
  onViewTeam: (team: TeacherPortalTeam) => void;
}) {
  if (teams.length === 0) {
    return <EmptyState icon={<Mail className="h-10 w-10" />} title="No mentor teams found" message="No team matches the current search." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <DataTable
        headers={["Team", "Track", "Support Channel", "Action"]}
        rows={teams.map((team) => [
          <TeamCell key="team" team={team} />,
          getTrackName(team),
          "Gmail compose",
          <button
            key="action"
            type="button"
            onClick={() => onViewTeam(team)}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#0b7a3b] transition-colors hover:bg-emerald-100"
          >
            <Mail className="h-4 w-4" />
            Contact
          </button>,
        ])}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-950">
          Email support queue
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Open a team detail to load the leader email, then use Gmail to reply
          or provide mentor support.
        </p>
      </section>
    </div>
  );
}

function UrgentScoringCard({
  teams,
  onViewTeam,
  onScoreTeam,
}: {
  teams: TeacherPortalTeam[];
  onViewTeam: (team: TeacherPortalTeam) => void;
  onScoreTeam: (team: TeacherPortalTeam) => void;
}) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 shadow-sm">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-red-700">
              Urgent Scoring
            </p>
            <p className="mt-1 text-sm font-medium text-red-700/80">
              {teams.length} submitted team{teams.length > 1 ? "s" : ""} need
              scoring before the deadline.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {teams.map((team) => {
          const message =
            getUrgentMessage(team) ||
            "This submission is close to the scoring deadline.";

          return (
            <div
              key={getTeamId(team) || getTeamName(team)}
              className="flex flex-col gap-3 rounded-lg border border-red-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-950">
                  {getTeamName(team)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {getTrackName(team)} • {getRoundName(team)}
                </p>
                <p className="mt-1 text-xs font-medium text-red-600">
                  {message}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onViewTeam(team)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                >
                  <Eye className="h-4 w-4" />
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => onScoreTeam(team)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f26f21] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#d85f16]"
                >
                  <PlayCircle className="h-4 w-4" />
                  Score Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function JudgeDetailModal({
  team,
  isSubmitted,
  isEvaluated,
  auditLogs,
  isAuditLoading,
  auditError,
  onClose,
  onScore,
}: {
  team: any;
  isSubmitted: boolean;
  isEvaluated: boolean;
  auditLogs: any[];
  isAuditLoading: boolean;
  auditError: string;
  onClose: () => void;
  onScore: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
        <ModalHeader
          eyebrow="Scoring Detail"
          title={getTeamName(team)}
          onClose={onClose}
        />
        <div className="space-y-6 p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <InfoBlock label="Track" value={getTrackName(team)} />
            <InfoBlock label="Current Round" value={getRoundName(team)} />
          </div>

          <div
            className={`flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center ${
              isSubmitted
                ? isEvaluated
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {isSubmitted ? (
                isEvaluated ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                ) : (
                  <ClipboardList className="mt-0.5 h-5 w-5 text-amber-600" />
                )
              ) : (
                <FileX className="mt-0.5 h-5 w-5 text-slate-500" />
              )}
              <div>
                <p className="text-sm font-extrabold text-slate-800">
                  {!isSubmitted
                    ? "Not submitted"
                    : isEvaluated
                      ? "Scored"
                      : "Pending score"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {isEvaluated
                    ? `Score recorded: ${team.score ?? "0"}`
                    : isSubmitted
                      ? "This submission is ready for evaluation."
                      : "This team has no submission available yet."}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={!isSubmitted}
              onClick={onScore}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f26f21] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#d85f16] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <PlayCircle className="h-4 w-4" />
              {isEvaluated ? "Edit Score" : "Score Now"}
            </button>
          </div>

          <div className="grid gap-3">
            <InfoBlock label="Score" value={isEvaluated ? String(team.score ?? "0") : "-"} />
          </div>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Audit Logs
                </p>
                <h3 className="mt-1 text-base font-extrabold text-slate-950">
                  Evaluation history
                </h3>
              </div>
              <Activity className="h-5 w-5 text-[#f26f21]" />
            </div>

            {!getJudgeEvaluationId(team) ? (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-slate-500">
                No audit logs yet. This team has not been scored.
              </p>
            ) : isAuditLoading ? (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-slate-500">
                Loading audit logs...
              </p>
            ) : auditError ? (
              <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600">
                {auditError}
              </p>
            ) : auditLogs.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-slate-500">
                No score changes have been recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log, index) => {
                  const scoreText = getAuditScoreText(log);
                  const reason = getAuditReason(log);
                  const actor = getAuditActor(log);
                  const timestamp = getAuditTimestamp(log);

                  return (
                    <div
                      key={`${timestamp || "audit"}-${index}`}
                      className="rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold leading-5 text-slate-900">
                            {getAuditAction(log)}
                          </p>
                          {scoreText && (
                            <p className="mt-1 text-sm font-bold text-[#c2410c]">
                              {scoreText}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-right text-xs font-bold text-slate-400">
                          {formatEventDate(timestamp)}
                        </span>
                      </div>
                      {(reason || actor) && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5 text-slate-600">
                          {reason || "Score updated"}
                          {actor ? ` by ${actor}` : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function MentorDetailModal({
  displayedDetail,
  teamDetail,
  isLoading,
  error,
  isSubmitted,
  onClose,
}: {
  displayedDetail: MentorTeamDetail | TeacherPortalTeam | null;
  teamDetail: MentorTeamDetail | null;
  isLoading: boolean;
  error: string;
  isSubmitted: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
        <ModalHeader
          eyebrow="Mentor Detail"
          title={displayedDetail?.teamName || "Unnamed Team"}
          onClose={onClose}
        />

        {isLoading ? (
          <div className="p-8 text-center text-sm font-medium text-slate-400 animate-pulse">
            Loading team details...
          </div>
        ) : error ? (
          <div className="m-6 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="grid gap-3 md:grid-cols-3">
              <InfoBlock label="Event" value={displayedDetail?.eventName || "-"} />
              <InfoBlock label="Track" value={displayedDetail?.trackName || "-"} />
              <InfoBlock label="Current Round" value={teamDetail?.roundName || "-"} />
            </div>

            <div
              className={`flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center ${
                isSubmitted
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {isSubmitted ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-extrabold text-slate-800">
                    {isSubmitted ? "Submitted" : "Not submitted yet"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {isSubmitted
                      ? "This team has provided at least one project link."
                      : "No GitHub, demo, or slide link has been submitted."}
                  </p>
                </div>
              </div>

              {teamDetail?.leaderEmail && (
                <button
                  type="button"
                  onClick={() =>
                    openLeaderGmailCompose({
                      leaderEmail: teamDetail.leaderEmail || "",
                      teamName: displayedDetail?.teamName || "Unnamed Team",
                      eventName: displayedDetail?.eventName,
                      trackName: displayedDetail?.trackName,
                      roundName: teamDetail?.roundName,
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-50"
                >
                  <Mail className="h-4 w-4" />
                  Open Gmail
                </button>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-base font-extrabold text-slate-900">
                  Submission Links
                </h4>
                {teamDetail?.leaderEmail && (
                  <p className="text-xs font-medium text-slate-500">
                    Leader: {teamDetail.leaderEmail}
                  </p>
                )}
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                {[
                  ["GitHub", teamDetail?.urlGithub],
                  ["Demo", teamDetail?.urlDemo],
                  ["Slide", teamDetail?.urlSlide],
                ].map(([label, url]) => (
                  <div
                    key={label}
                    className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">{label}</p>
                      <p className="mt-1 break-all text-xs font-medium text-slate-500">
                        {url || "Not provided"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openUrl(url)}
                      disabled={!url}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {headers.map((header, index) => (
                <th
                  key={header}
                  className={`px-5 py-4 ${index === headers.length - 1 ? "text-right" : ""}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition-colors hover:bg-slate-50/70">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-5 py-4 text-sm text-slate-600 ${cellIndex === row.length - 1 ? "text-right" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamCell({ team }: { team: any }) {
  const urgentMessage = getUrgentMessage(team);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-extrabold text-slate-900">{getTeamName(team)}</p>
        {isUrgentScoringTeam(team) && (
          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-red-600">
            Urgent
          </span>
        )}
      </div>
      {urgentMessage && (
        <p className="mt-1 max-w-sm text-xs font-medium text-red-600">
          {urgentMessage}
        </p>
      )}
    </div>
  );
}

function JudgeStatusBadge({ team }: { team: any }) {
  const urgentMessage = getUrgentMessage(team);

  if (isUrgentScoringTeam(team) && !isJudgeEvaluated(team)) {
    return (
      <span
        title={urgentMessage}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600"
      >
        <AlertCircle className="h-3 w-3" />
        Urgent Score
      </span>
    );
  }

  if (!isJudgeSubmissionAvailable(team)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
        <FileX className="h-3 w-3" />
        Not Submitted
      </span>
    );
  }
  if (isJudgeEvaluated(team)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        Scored
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">
      <ClipboardList className="h-3 w-3" />
      Pending Score
    </span>
  );
}

function ScoreButton({ team, onClick }: { team: any; onClick: () => void }) {
  const isSubmitted = isJudgeSubmissionAvailable(team);
  const isEvaluated = isJudgeEvaluated(team);
  return (
    <button
      type="button"
      disabled={!isSubmitted}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
        !isSubmitted
          ? "cursor-not-allowed bg-slate-100 text-slate-400"
          : isEvaluated
            ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            : "bg-[#f26f21] text-white hover:bg-[#d85f16]"
      }`}
    >
      <PlayCircle className="h-4 w-4" />
      {isEvaluated ? "Edit Score" : "Score"}
    </button>
  );
}

function RoleBadge({
  tone,
  children,
}: {
  tone: "judge" | "mentor";
  children: React.ReactNode;
}) {
  const className =
    tone === "judge"
      ? "border-orange-100 bg-orange-50 text-[#c2410c]"
      : "border-blue-100 bg-blue-50 text-blue-700";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold ${className}`}
    >
      {children}
    </span>
  );
}

function DatePill({ label, value }: { label: string; value?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
      <CalendarDays className="h-4 w-4 text-[#f26f21]" />
      <span className="uppercase text-slate-400">{label}</span>
      <span>{formatEventDate(value)}</span>
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-l border-slate-200 pl-3">
      <p className="text-lg font-extrabold text-slate-950">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactElement;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-slate-500">{icon}</div>
      <p className="text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
        active
          ? "bg-orange-50 text-[#f26f21]"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function InfoBlock({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 break-all text-sm font-bold text-slate-900 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ModalHeader({
  eyebrow,
  title,
  subtitle,
  onClose,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#f26f21]">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-2xl font-extrabold tracking-tight">{title}</h3>
        {subtitle && (
          <p className="mt-1 font-mono text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        aria-label="Close details"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm">
      <div className="mx-auto mb-3 flex justify-center">{icon}</div>
      <p className="text-sm font-extrabold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </section>
    );
}
