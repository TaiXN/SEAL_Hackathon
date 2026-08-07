import { jwtDecode } from "jwt-decode";
import { type MentorTeamDetail } from "../api/mentorApi";
import {
  type TeacherPortalEvent,
  type TeacherPortalEventDetail,
  type TeacherPortalTeam,
  type TeacherPortalTrack,
} from "../api/teacher";

export type TeacherEventGroup = {
  key: string;
  eventId?: string;
  eventName: string;
  currentRound?: number | null;
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

export type DetailTab =
  | "overview"
  | "teams"
  | "submissions"
  | "scoring"
  | "mentor";

export function getUserFromToken(accessToken?: string | null): any {
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

export const readString = (value: any, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
};

export const getTrackName = (item: any) =>
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

const teamMatchesAssignedTracks = (team: any, tracks: TeacherPortalTrack[]) => {
  if (!tracks.length) return false;

  const assignedTrackIds = new Set(
    tracks.map((track) => normalizeCompareKey(track.trackId)).filter(Boolean),
  );
  const assignedTrackNames = new Set(
    tracks.map((track) => normalizeCompareKey(track.trackName)).filter(Boolean),
  );
  const teamTrackId = normalizeCompareKey(getTrackId(team));
  const teamTrackName = normalizeCompareKey(getTrackName(team));

  return Boolean(
    (teamTrackId && assignedTrackIds.has(teamTrackId)) ||
    (teamTrackName && assignedTrackNames.has(teamTrackName)),
  );
};

export const getRoundName = (item: any) =>
  readString(
    item?.roundName ||
      item?.RoundName ||
      item?.currentRoundName ||
      item?.CurrentRoundName,
    "-",
  );

export const getTeamId = (team: any) =>
  readString(team?.teamId || team?.teamID || team?.TeamID || team?.id);

export const getTeamName = (team: any) =>
  readString(team?.teamName || team?.TeamName || team?.name, "Unnamed Team");

export const getJudgeAssignmentId = (team: any) =>
  readString(team?.teamInRoundId || team?.teamInRoundID || team?.teamId);

export const getJudgeSubmissionId = (team: any) =>
  readString(team?.submissionId || team?.submissionID);

export const getJudgeEvaluationId = (team: any) =>
  readString(team?.evaluationId || team?.evaluationID || team?.EvaluationID);

export const isJudgeSubmissionAvailable = (team: any) => {
  const status = readString(
    team?.submissionStatus || team?.SubmissionStatus,
  ).toLowerCase();
  const hasNoSubmissionStatus =
    status.includes("not submitted") ||
    status.includes("not-submitted") ||
    status.includes("unsubmitted") ||
    status.includes("no submission") ||
    status.includes("no links") ||
    status.includes("missing");

  if (hasNoSubmissionStatus) return false;

  return Boolean(
    getJudgeSubmissionId(team) ||
    team?.urlGithub ||
    team?.urlDemo ||
    team?.urlSlide ||
    status.includes("submitted") ||
    status.includes("have"),
  );
};

export const isJudgeEvaluated = (team: any) => {
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

export const isUrgentScoringTeam = (team: any) =>
  team?.isUrgentScoring === true ||
  team?.IsUrgentScoring === true ||
  String(team?.isUrgentScoring || team?.IsUrgentScoring || "")
    .toLowerCase()
    .trim() === "true";

export const getUrgentMessage = (team: any) =>
  readString(team?.urgentMessage || team?.UrgentMessage);

const isPastDate = (value?: string) => {
  const raw = readString(value);
  if (!raw) return false;

  const date = new Date(raw);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
};

const getTeamCurrentRoundIndex = (team: any) => {
  const value =
    team?.currentRound ??
    team?.CurrentRound ??
    team?.portalCurrentRound ??
    team?.PortalCurrentRound;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const isJudgeTeamClosedForScoring = (team: any) => {
  const roundName = readString(
    team?.currentRoundName ||
      team?.CurrentRoundName ||
      team?.portalCurrentRoundName ||
      team?.PortalCurrentRoundName ||
      getRoundName(team),
  ).toLowerCase();

  return Boolean(
    isPastDate(team?.scoringEndDate || team?.ScoringEndDate) ||
    isPastDate(team?.eventEndDate || team?.EventEndDate) ||
    roundName.includes("event ended") ||
    roundName.includes("ended") ||
    roundName.includes("finished") ||
    roundName.includes("concluded") ||
    getTeamCurrentRoundIndex(team) === 2,
  );
};

export const isJudgeAutoZeroTeam = (team: any) =>
  Boolean(
    team &&
    !isJudgeSubmissionAvailable(team) &&
    !isJudgeEvaluated(team) &&
    isJudgeTeamClosedForScoring(team),
  );

export const isJudgeScoreFinalized = (team: any) =>
  isJudgeEvaluated(team) || isJudgeAutoZeroTeam(team);

export const getJudgeDisplayScore = (team: any) =>
  isJudgeScoreFinalized(team) ? String(team?.score ?? team?.Score ?? "0") : "-";

export const normalizeApiList = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

export const getAuditAction = (log: any) =>
  readString(
    log?.action ||
      log?.Action ||
      log?.activity ||
      log?.Activity ||
      log?.message ||
      log?.Message,
    "Evaluation updated",
  );

export const getAuditReason = (log: any) =>
  readString(
    log?.reason ||
      log?.Reason ||
      log?.feedback ||
      log?.Feedback ||
      log?.note ||
      log?.Note,
  );

export const getAuditActor = (log: any) =>
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

export const getAuditTimestamp = (log: any) =>
  readString(
    log?.createdAt ||
      log?.CreatedAt ||
      log?.updatedAt ||
      log?.UpdatedAt ||
      log?.timestamp ||
      log?.Timestamp,
  );

export const getAuditScoreText = (log: any) => {
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

  if (
    oldScore !== undefined &&
    oldScore !== null &&
    newScore !== undefined &&
    newScore !== null
  ) {
    return `${oldScore} -> ${newScore} pts`;
  }
  if (newScore !== undefined && newScore !== null) return `${newScore} pts`;
  return "";
};

export const hasSubmissionLink = (
  detail: MentorTeamDetail | TeacherPortalTeam | null,
) => Boolean(detail?.urlGithub || detail?.urlDemo || detail?.urlSlide);

export const uniqueValues = (items: any[], reader: (item: any) => string) =>
  Array.from(new Set(items.map(reader).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );

export const openUrl = (url?: string) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

export const openLeaderGmailCompose = ({
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

export const portalEventToGroup = (
  event: TeacherPortalEvent | TeacherPortalEventDetail,
): TeacherEventGroup => {
  const teams =
    "teams" in event && Array.isArray(event.teams)
      ? event.teams.map((team) => ({
          ...team,
          eventId: team.eventId || event.eventId,
          eventName: team.eventName || event.eventName,
          currentRound: team.currentRound ?? event.currentRound ?? null,
          currentRoundName:
            team.currentRoundName || event.currentRoundName || team.roundName,
          eventStartDate: team.eventStartDate || event.startDate,
          eventEndDate: team.eventEndDate || event.endDate,
          scoringStartDate: team.scoringStartDate || event.scoringStartDate,
          scoringEndDate: team.scoringEndDate || event.scoringEndDate,
        }))
      : [];
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
    currentRound: event.currentRound,
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

export const countUniqueTeams = (group: TeacherEventGroup) => {
  if (group.summary.totalTeams > 0) return group.summary.totalTeams;
  const ids = new Set<string>();
  group.allTeams.forEach((team) => {
    ids.add(getTeamId(team) || getTeamName(team));
  });
  return ids.size;
};

export const eventMatchesSearch = (group: TeacherEventGroup, query: string) => {
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

export const formatEventDate = (value?: string) => {
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

export const TEACHER_PORTAL_STATE_KEY = "teacherPortal:selectedEvent";

export const saveTeacherPortalState = (eventKey: string, tab: DetailTab) => {
  sessionStorage.setItem(
    TEACHER_PORTAL_STATE_KEY,
    JSON.stringify({ eventKey, tab }),
  );
};

export const readTeacherPortalState = (): {
  eventKey: string;
  tab: DetailTab;
} | null => {
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
