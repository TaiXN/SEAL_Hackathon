import apiClient from "./apiClient";

export type TeacherPortalTrack = {
  trackId?: string;
  trackName: string;
};

export type TeacherPortalSummary = {
  totalTeams: number;
  submittedTeams: number;
  pendingScoreTeams: number;
  scoredTeams: number;
  mentorTeams: number;
};

export type TeacherPortalTeam = {
  teamId: string;
  teamName: string;
  eventId?: string;
  eventName?: string;
  trackId?: string;
  trackName?: string;
  topicName?: string;
  roundId?: string;
  roundName?: string;
  submissionId?: string;
  urlGithub?: string;
  urlDemo?: string;
  urlSlide?: string;
  leaderEmail?: string;
  submissionStatus?: string;
  scoringStatus?: string;
  score?: number | null;
  evaluationId?: string;
  canScore: boolean;
  canMentorContact: boolean;
};

export type TeacherPortalEvent = {
  eventId: string;
  eventName: string;
  season?: string;
  year?: number;
  currentRound?: number | null;
  currentRoundName?: string;
  startDate?: string;
  endDate?: string;
  judgeTracks: TeacherPortalTrack[];
  mentorTracks: TeacherPortalTrack[];
  summary: TeacherPortalSummary;
};

export type TeacherPortalEventDetail = TeacherPortalEvent & {
  roles: {
    isJudge: boolean;
    isMentor: boolean;
  };
  teams: TeacherPortalTeam[];
};

const unwrapData = (value: any) => value?.data ?? value;

const normalizeList = (value: any): any[] => {
  const data = unwrapData(value);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.events)) return data.events;
  if (Array.isArray(data?.portalEvents)) return data.portalEvents;
  return [];
};

const readString = (value: any, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
};

const readNumber = (value: any, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  return fallback;
};

const readBool = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

const normalizeTrack = (item: any): TeacherPortalTrack => ({
  trackId: readString(item?.trackId || item?.trackID || item?.TrackID || item?.id),
  trackName: readString(
    item?.trackName || item?.TrackName || item?.name || item?.Name,
    "No track",
  ),
});

const normalizeTracks = (value: any): TeacherPortalTrack[] =>
  normalizeList(value)
    .map(normalizeTrack)
    .filter((track) => track.trackName && track.trackName !== "No track");

const normalizeSummary = (item: any): TeacherPortalSummary => {
  const summary = item?.summary || item?.Summary || {};
  return {
    totalTeams: readNumber(
      summary.totalTeams ?? summary.TotalTeams ?? item?.totalTeams ?? item?.TotalTeams,
    ),
    submittedTeams: readNumber(
      summary.submittedTeams ??
        summary.SubmittedTeams ??
        item?.submittedTeams ??
        item?.SubmittedTeams,
    ),
    pendingScoreTeams: readNumber(
      summary.pendingScoreTeams ??
        summary.PendingScoreTeams ??
        item?.pendingScoreTeams ??
        item?.PendingScoreTeams,
    ),
    scoredTeams: readNumber(
      summary.scoredTeams ?? summary.ScoredTeams ?? item?.scoredTeams ?? item?.ScoredTeams,
    ),
    mentorTeams: readNumber(
      summary.mentorTeams ?? summary.MentorTeams ?? item?.mentorTeams ?? item?.MentorTeams,
    ),
  };
};

const normalizeTeam = (item: any): TeacherPortalTeam => {
  const submissionStatus = readString(
    item?.submissionStatus || item?.SubmissionStatus,
  );
  const scoringStatus = readString(item?.scoringStatus || item?.ScoringStatus);
  const submissionId = readString(
    item?.submissionId || item?.submissionID || item?.SubmissionID,
  );
  const leaderEmail = readString(
    item?.leaderEmail ||
      item?.LeaderEmail ||
      item?.teamLeaderEmail ||
      item?.TeamLeaderEmail,
  );
  const scoreValue = item?.score ?? item?.Score;

  return {
    teamId: readString(item?.teamId || item?.teamID || item?.TeamID || item?.id),
    teamName: readString(
      item?.teamName || item?.TeamName || item?.name || item?.Name,
      "Unnamed Team",
    ),
    eventId: readString(item?.eventId || item?.eventID || item?.EventID),
    eventName: readString(item?.eventName || item?.EventName),
    trackId: readString(item?.trackId || item?.trackID || item?.TrackID),
    trackName: readString(item?.trackName || item?.TrackName, "No track"),
    topicName: readString(item?.topicName || item?.TopicName || item?.topicDetail),
    roundId: readString(item?.roundId || item?.roundID || item?.RoundID),
    roundName: readString(
      item?.roundName || item?.RoundName || item?.currentRoundName,
    ),
    submissionId,
    urlGithub: readString(item?.urlGithub || item?.UrlGithub || item?.githubUrl),
    urlDemo: readString(item?.urlDemo || item?.UrlDemo || item?.demoUrl),
    urlSlide: readString(item?.urlSlide || item?.UrlSlide || item?.slideUrl),
    leaderEmail,
    submissionStatus,
    scoringStatus,
    score:
      scoreValue === null || scoreValue === undefined
        ? null
        : readNumber(scoreValue, Number.NaN),
    evaluationId: readString(
      item?.evaluationId || item?.evaluationID || item?.EvaluationID,
    ),
    canScore: readBool(item?.canScore ?? item?.CanScore),
    canMentorContact:
      readBool(item?.canMentorContact ?? item?.CanMentorContact) ||
      Boolean(leaderEmail),
  };
};

const normalizeEvent = (value: any): TeacherPortalEvent => {
  const item = unwrapData(value) || {};
  const yearValue = item.year ?? item.Year;
  const currentRoundValue = item.currentRound ?? item.CurrentRound;

  return {
    eventId: readString(item.eventId || item.eventID || item.EventID || item.id),
    eventName: readString(
      item.eventName || item.EventName || item.name || item.Name,
      "Unassigned Event",
    ),
    season: readString(item.season || item.Season),
    year:
      yearValue !== undefined && yearValue !== null
        ? readNumber(yearValue)
        : undefined,
    currentRound:
      currentRoundValue !== undefined && currentRoundValue !== null
        ? readNumber(currentRoundValue)
        : null,
    currentRoundName: readString(
      item.currentRoundName || item.CurrentRoundName || item.roundName,
    ),
    startDate: readString(item.startDate || item.StartDate),
    endDate: readString(item.endDate || item.EndDate),
    judgeTracks: normalizeTracks(item.judgeTracks || item.JudgeTracks),
    mentorTracks: normalizeTracks(item.mentorTracks || item.MentorTracks),
    summary: normalizeSummary(item),
  };
};

const normalizeEventDetail = (value: any): TeacherPortalEventDetail => {
  const item = unwrapData(value) || {};
  const event = normalizeEvent(item);
  const roles = item.roles || item.Roles || {};
  const teams = normalizeList(item.teams || item.Teams).map(normalizeTeam);

  return {
    ...event,
    roles: {
      isJudge:
        readBool(roles.isJudge ?? roles.IsJudge ?? item.isJudge ?? item.IsJudge) ||
        event.judgeTracks.length > 0 ||
        teams.some((team) => team.canScore),
      isMentor:
        readBool(roles.isMentor ?? roles.IsMentor ?? item.isMentor ?? item.IsMentor) ||
        event.mentorTracks.length > 0 ||
        teams.some((team) => team.canMentorContact),
    },
    teams,
  };
};

export const teacherApi = {
  async getPortalEvents(teacherId: string): Promise<TeacherPortalEvent[]> {
    const res = await apiClient.get(`/api/Teacher/${teacherId}/portal-events`);
    return normalizeList(res).map(normalizeEvent);
  },

  async getPortalEventDetail(
    teacherId: string,
    eventId: string,
  ): Promise<TeacherPortalEventDetail> {
    const res = await apiClient.get(
      `/api/Teacher/${teacherId}/portal-events/${eventId}`,
    );
    return normalizeEventDetail(res);
  },
};
