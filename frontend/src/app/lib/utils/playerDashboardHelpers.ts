import { jwtDecode } from "jwt-decode";
import {
  getTeamId,
  isLeaderTeam,
  normalizeId,
  normalizeList,
  unwrapData,
} from "./teamHelpers";

export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
};

export type TeamNotice = {
  tone: "success" | "warning" | "danger";
  title: string;
  message: string;
};

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================

export const getCurrentUserNameFromToken = (accessToken?: string | null) => {
  if (!accessToken) return "Player";
  try {
    const decoded: any = jwtDecode(accessToken);
    return (
      decoded?.fullName ||
      decoded?.FullName ||
      decoded?.name ||
      decoded?.Name ||
      decoded?.email ||
      "Player"
    );
  } catch {
    return "Player";
  }
};

export const safeString = (val: any, fallback: string = ""): string => {
  if (typeof val === "string" || typeof val === "number") return String(val);
  return fallback;
};

export const extractTeamName = (obj: any): string => {
  if (!obj) return "Unknown";
  if (typeof obj.teamName === "string") return obj.teamName;
  if (typeof obj.TeamName === "string") return obj.TeamName;
  if (typeof obj.name === "string") return obj.name;
  if (obj.submission?.teamInRound?.team?.teamName)
    return obj.submission.teamInRound.team.teamName;
  if (obj.submission?.teamInRound?.team?.TeamName)
    return obj.submission.teamInRound.team.TeamName;
  if (obj.team?.teamName) return obj.team.teamName;
  return "Unknown";
};

export const extractScore = (obj: any): number => {
  if (!obj) return 0;
  const s = obj.score ?? obj.Score ?? obj.totalScore ?? obj.TotalScore ?? 0;
  if (typeof s === "number") return s;
  if (typeof s === "string" && !isNaN(parseFloat(s))) return parseFloat(s);
  return 0;
};

export const readString = (value: any, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
};

export const readNumber = (value: any): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  return null;
};

export const extractEventId = (obj: any): string =>
  readString(
    obj?.eventId ??
      obj?.eventID ??
      obj?.EventID ??
      obj?.event?.eventId ??
      obj?.event?.eventID ??
      obj?.Event?.eventId ??
      obj?.Event?.EventID,
  );

export const extractTrackId = (obj: any): string =>
  readString(
    obj?.trackId ??
      obj?.trackID ??
      obj?.TrackID ??
      obj?.track?.trackId ??
      obj?.track?.trackID ??
      obj?.Track?.trackId ??
      obj?.Track?.TrackID,
  );

export const extractTopicId = (obj: any): string =>
  readString(
    obj?.topicId ??
      obj?.topicID ??
      obj?.TopicID ??
      obj?.topic?.topicId ??
      obj?.topic?.topicID ??
      obj?.Topic?.topicId ??
      obj?.Topic?.TopicID,
  );

export const extractRoundId = (obj: any): string =>
  readString(
    obj?.roundId ||
      obj?.roundID ||
      obj?.RoundID ||
      obj?.currentRoundId ||
      obj?.currentRoundID ||
      obj?.teamInRound?.roundId ||
      obj?.teamInRound?.roundID ||
      obj?.TeamInRound?.roundId ||
      obj?.TeamInRound?.RoundID,
  );

export const extractEventName = (obj: any): string =>
  readString(
    obj?.eventName ||
      obj?.EventName ||
      obj?.event?.eventName ||
      obj?.event?.EventName ||
      obj?.event?.name ||
      obj?.Event?.eventName ||
      obj?.Event?.EventName ||
      obj?.Event?.name,
    "Not registered",
  );

export const extractTrackName = (obj: any): string =>
  readString(
    obj?.trackName ||
      obj?.TrackName ||
      obj?.categoryName ||
      obj?.CategoryName ||
      obj?.track?.trackName ||
      obj?.track?.name ||
      obj?.Track?.trackName ||
      obj?.Track?.TrackName ||
      obj?.Track?.name ||
      obj?.teamInRound?.trackName ||
      obj?.teamInRound?.TrackName ||
      obj?.teamInRound?.track?.trackName ||
      obj?.teamInRound?.track?.name,
    "No track",
  );

export const extractTopicName = (obj: any): string =>
  readString(
    obj?.topicName ||
      obj?.TopicName ||
      obj?.topicDetail ||
      obj?.TopicDetail ||
      obj?.topic?.topicDetail ||
      obj?.topic?.name ||
      obj?.Topic?.topicDetail ||
      obj?.Topic?.TopicDetail ||
      obj?.Topic?.name ||
      obj?.teamInRound?.topicName ||
      obj?.teamInRound?.TopicName ||
      obj?.teamInRound?.topicDetail ||
      obj?.teamInRound?.TopicDetail ||
      obj?.teamInRound?.topic?.topicDetail ||
      obj?.teamInRound?.topic?.name,
    "No topic",
  );

const isFilledField = (value: string, emptyValues: string[]) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return !emptyValues.includes(normalized);
};

export const hasRegisteredEvent = (obj: any, eventName: string) =>
  (Boolean(extractEventId(obj)) ||
    isFilledField(eventName, [
      "not registered",
      "no event",
      "you not in an event",
      "you are not in an event",
      "not in an event",
    ])) &&
  (Boolean(
    obj?.teamInRound ||
    obj?.TeamInRound ||
    obj?.teamInRoundId ||
    obj?.teamInRoundID ||
    extractTrackId(obj) ||
    extractTopicId(obj),
  ) ||
    isFilledField(extractTrackName(obj), [
      "no track",
      "not registered",
      "select track",
      "-",
    ]) ||
    isFilledField(extractTopicName(obj), [
      "no topic",
      "not registered",
      "select topic",
      "-",
    ]));

export const extractCurrentRoundIndex = (obj: any): number | null =>
  readNumber(
    obj?.currentRoundIndex ??
      obj?.currentroundindex ??
      obj?.CurrentRoundIndex ??
      obj?.eventCurrentRoundIndex ??
      obj?.currentRound,
  );

export const getRoundLabel = (
  index: number | null,
  fallbackRoundName: string,
): string => {
  if (fallbackRoundName && fallbackRoundName !== "Current Round")
    return fallbackRoundName;
  if (index === 0) return "Not Started";
  if (index !== null && index > 0) return `Round ${index}`;
  return "Not Registered";
};

export const extractRoundName = (obj: any): string =>
  readString(
    obj?.roundName ||
      obj?.RoundName ||
      obj?.currentRoundName ||
      obj?.CurrentRoundName ||
      obj?.teamInRound?.roundName,
    "Current Round",
  );

export const extractInfoMessage = (obj: any): string =>
  readString(
    obj?.message ||
      obj?.Message ||
      obj?.notification ||
      obj?.Notification ||
      obj?.statusMessage ||
      obj?.StatusMessage ||
      obj?.teamMessage ||
      obj?.TeamMessage ||
      obj?.description,
  );

export const isTeamEliminated = (obj: any): boolean => {
  const raw =
    obj?.isEliminated ?? obj?.iseliminated ?? obj?.IsEliminated ?? false;
  return raw === true || raw === 1 || String(raw).toLowerCase() === "true";
};

export const getTeamNotice = (obj: any) => {
  const currentRoundIndex = extractCurrentRoundIndex(obj);
  const message = extractInfoMessage(obj);
  const eliminated = isTeamEliminated(obj);

  if (message) {
    const tone = eliminated
      ? "danger"
      : currentRoundIndex === 0
        ? "warning"
        : "success";
    const title = eliminated
      ? "Team eliminated"
      : currentRoundIndex === 0
        ? "Event not started"
        : "Team status";

    return {
      tone,
      title,
      message,
    };
  }

  if (currentRoundIndex === 0) {
    return {
      tone: "warning",
      title: "Event not started",
      message: "Your registered event has not started yet.",
    };
  }

  if (eliminated) {
    return {
      tone: "danger",
      title: "Team eliminated",
      message: "Your team is no longer eligible to advance to the next round.",
    };
  }

  if (currentRoundIndex !== null && currentRoundIndex > 0) {
    return {
      tone: "success",
      title: "Still in competition",
      message: "Your team is still eligible in the current round.",
    };
  }

  return null;
};

export const getParticipationKey = (record: any) => {
  const eventId = extractEventId(record);
  if (eventId) return eventId;

  const parts = [
    extractEventName(record),
    extractTrackId(record) || extractTrackName(record),
    extractTopicId(record) || extractTopicName(record),
    extractRoundId(record) || extractRoundName(record),
  ].filter(Boolean);
  return parts.join("|") || "current";
};

export const extractTeamHistoryEventRecords = (team: any): any[] => {
  const events = [
    ...normalizeList(team?.events),
    ...normalizeList(team?.Events),
    ...normalizeList(team?.registeredEvents),
    ...normalizeList(team?.RegisteredEvents),
  ];
  const topLevelEventId = extractEventId(team);
  const topLevelEventName = extractEventName(team);
  const topLevelEvent =
    topLevelEventId || topLevelEventName !== "Not registered" ? [team] : [];

  return [...events, ...topLevelEvent]
    .map((event) => ({
      ...event,
      teamId: getTeamId(team),
      teamName: extractTeamName(team),
      isLeader: isLeaderTeam(team),
      isRegisteredEvent: true,
      source: "team-history",
      eventId: extractEventId(event),
      eventName: extractEventName(event),
    }))
    .filter(
      (event) =>
        extractEventId(event) || extractEventName(event) !== "Not registered",
    );
};

export const getHistoryRecordsForTeam = (
  history: any[],
  teamId: string,
): any[] => {
  const normalizedTeamId = normalizeId(teamId);
  if (!normalizedTeamId) return [];

  return history.filter(
    (record) => normalizeId(getTeamId(record)) === normalizedTeamId,
  );
};

export const mergeHistoryTeamRecords = (records: any[], fallbackTeam: any) => {
  const events = records.flatMap((record) => [
    ...normalizeList(record?.events),
    ...normalizeList(record?.Events),
    ...normalizeList(record?.registeredEvents),
    ...normalizeList(record?.RegisteredEvents),
  ]);

  return {
    ...(fallbackTeam || {}),
    ...(records[0] || {}),
    events,
  };
};

export const extractHistoryEventRecordsForTeam = (
  records: any[],
  fallbackTeam: any,
): any[] => {
  const sourceRecords = records.length > 0 ? records : [fallbackTeam];
  const unique = new Map<string, any>();

  sourceRecords.forEach((record) => {
    extractTeamHistoryEventRecords(record).forEach((event) => {
      const key = getParticipationKey(event);
      if (!unique.has(key)) unique.set(key, event);
    });
  });

  return Array.from(unique.values());
};

export const normalizeTeamInfoRecords = (value: any): any[] => {
  const data = unwrapData(value);
  const records = normalizeList(data);
  if (records.length > 0) return records;

  if (
    data &&
    typeof data === "object" &&
    (extractEventId(data) || extractEventName(data) !== "Not registered")
  ) {
    return [data];
  }

  return [];
};

export const mergeTeamInfoIntoHistoryEvents = (
  historyEvents: any[],
  teamInfo: any,
): any[] => {
  const infoRecords = normalizeTeamInfoRecords(teamInfo);
  if (infoRecords.length === 0) return historyEvents;

  const usedInfoKeys = new Set<string>();

  const records = historyEvents.map((event) => {
    const eventId = extractEventId(event);
    const eventName = extractEventName(event).toLowerCase();

    const matchedInfo = infoRecords.find((info) => {
      const infoEventId = extractEventId(info);
      const infoEventName = extractEventName(info).toLowerCase();

      return (
        (eventId && infoEventId && eventId === infoEventId) ||
        (eventName &&
          infoEventName &&
          eventName !== "not registered" &&
          eventName === infoEventName)
      );
    });

    if (!matchedInfo) return event;
    usedInfoKeys.add(getParticipationKey(matchedInfo));
    return {
      ...event,
      ...matchedInfo,
      eventId: eventId || extractEventId(matchedInfo),
      eventName: extractEventName(matchedInfo),
      isRegisteredEvent: true,
      source: "team-history",
    };
  });

  return [
    ...records,
    ...infoRecords
      .filter((info) => !usedInfoKeys.has(getParticipationKey(info)))
      .map((info) => ({
        ...info,
        isRegisteredEvent: true,
        source: "team-info",
      })),
  ];
};

export const getParticipationRoundLabel = (record: any): string => {
  const roundLabel = getRoundLabel(
    extractCurrentRoundIndex(record),
    extractRoundName(record),
  );

  if (roundLabel !== "Not Registered") return roundLabel;
  return record?.isRegisteredEvent ? "Registered" : roundLabel;
};

export const extractEventParticipations = (obj: any): any[] => {
  if (!obj) return [];

  const possibleLists = [
    obj.participations,
    obj.Participations,
    obj.registeredEvents,
    obj.RegisteredEvents,
    obj.teamEvents,
    obj.TeamEvents,
    obj.events,
    obj.Events,
    obj.eventRegistrations,
    obj.EventRegistrations,
    obj.eventParticipations,
    obj.EventParticipations,
    obj.participatedEvents,
    obj.ParticipatedEvents,
    obj.joinedEvents,
    obj.JoinedEvents,
    obj.enrolledEvents,
    obj.EnrolledEvents,
    obj.teamInRounds,
    obj.TeamInRounds,
    obj.teamInRoundDetails,
    obj.TeamInRoundDetails,
    obj.roundParticipations,
    obj.RoundParticipations,
  ];

  const objectArrayRecords =
    obj && typeof obj === "object"
      ? Object.values(obj).flatMap((value) =>
          Array.isArray(value) ? normalizeList(value) : [],
        )
      : [];
  const records = [
    ...possibleLists.flatMap((value) => normalizeList(value)),
    ...objectArrayRecords,
  ];
  const topLevelEventName = extractEventName(obj);
  if (
    normalizeList(obj.participations).length === 0 &&
    hasRegisteredEvent(obj, topLevelEventName)
  ) {
    records.unshift(obj);
  }

  const unique = new Map<string, any>();
  records.forEach((record) => {
    const eventName = extractEventName(record);
    if (
      !record?.isRegisteredEvent &&
      !hasRegisteredEvent(record, eventName) &&
      !isUsableTrackRecord(record)
    ) {
      return;
    }
    const key = getParticipationKey(record);
    if (!unique.has(key)) unique.set(key, record);
  });

  return Array.from(unique.values());
};

export const isUsableTrackRecord = (record: any) =>
  Boolean(
    extractTrackId(record) ||
    isFilledField(extractTrackName(record), ["no track", "-", "select track"]),
  );

export const buildTrackParticipationRecord = ({
  track,
  round,
  activeTeamId,
  teamName,
}: {
  track: any;
  round?: any;
  activeTeamId: string;
  teamName: string;
}) => ({
  ...track,
  ...(round || {}),
  teamId: activeTeamId,
  teamName,
  eventId: extractEventId(track) || extractEventId(round),
  eventName:
    extractEventName(track) !== "Not registered"
      ? extractEventName(track)
      : extractEventName(round),
  trackId: extractTrackId(track) || extractTrackId(round),
  trackName:
    extractTrackName(track) !== "No track"
      ? extractTrackName(track)
      : extractTrackName(round),
  topicId: extractTopicId(track) || extractTopicId(round),
  topicName:
    extractTopicName(track) !== "No topic"
      ? extractTopicName(track)
      : extractTopicName(round),
  roundId: extractRoundId(round) || extractRoundId(track),
  roundName:
    extractRoundName(round) !== "Current Round"
      ? extractRoundName(round)
      : extractRoundName(track),
  currentRoundName:
    extractRoundName(round) !== "Current Round"
      ? extractRoundName(round)
      : extractRoundName(track),
});

// COUNTDOWN TIMER
export function calculateTimeLeft(targetDate: Date) {
  if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  const difference = targetDate.getTime() - Date.now();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false,
  };
}

export const emptyTimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isExpired: false,
};
