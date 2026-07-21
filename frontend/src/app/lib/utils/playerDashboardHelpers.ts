import { jwtDecode } from "jwt-decode";

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

export const getCurrentUserNameFromToken = (
  accessToken?: string | null,
): string => {
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

export const extractTeamName = (obj: any): string => {
  if (!obj) return "Unknown";
  if (typeof obj.teamName === "string") return obj.teamName;
  if (typeof obj.TeamName === "string") return obj.TeamName;
  if (typeof obj.name === "string") return obj.name;
  if (obj.submission?.teamInRound?.team?.teamName) {
    return obj.submission.teamInRound.team.teamName;
  }
  if (obj.submission?.teamInRound?.team?.TeamName) {
    return obj.submission.teamInRound.team.TeamName;
  }
  if (obj.team?.teamName) return obj.team.teamName;
  return "Unknown";
};

export const extractScore = (obj: any): number => {
  if (!obj) return 0;
  const score = obj.score ?? obj.Score ?? obj.totalScore ?? obj.TotalScore ?? 0;
  if (typeof score === "number") return score;
  if (typeof score === "string" && !isNaN(parseFloat(score))) {
    return parseFloat(score);
  }
  return 0;
};

export const extractEventId = (obj: any): string =>
  readString(
    obj?.eventId ?? obj?.eventID ?? obj?.EventID ?? obj?.event?.eventId,
  );

export const extractTrackId = (obj: any): string =>
  readString(
    obj?.trackId ?? obj?.trackID ?? obj?.TrackID ?? obj?.track?.trackId,
  );

export const extractTopicId = (obj: any): string =>
  readString(
    obj?.topicId ?? obj?.topicID ?? obj?.TopicID ?? obj?.topic?.topicId,
  );

export const extractRoundId = (obj: any): string =>
  readString(
    obj?.roundId ||
      obj?.roundID ||
      obj?.RoundID ||
      obj?.currentRoundId ||
      obj?.currentRoundID ||
      obj?.teamInRound?.roundId ||
      obj?.teamInRound?.roundID,
  );

export const extractEventName = (obj: any): string =>
  readString(
    obj?.eventName ||
      obj?.EventName ||
      obj?.event?.eventName ||
      obj?.event?.name,
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
  Boolean(extractEventId(obj)) ||
  isFilledField(eventName, [
    "not registered",
    "no event",
    "you not in an event",
    "you are not in an event",
    "not in an event",
  ]);

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
  if (index === -1) return "Not Started";
  if (index === 2) return "Event Ended";
  if (fallbackRoundName && fallbackRoundName !== "Current Round") {
    return fallbackRoundName;
  }
  if (index === 0) return "Group Round";
  if (index === 1) return "Final Round";
  if (index !== null) return `Round ${index + 1}`;
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

export const getTeamNotice = (obj: any): TeamNotice | null => {
  const currentRoundIndex = extractCurrentRoundIndex(obj);
  const message = extractInfoMessage(obj);
  const eliminated = isTeamEliminated(obj);

  if (message) {
    const tone = eliminated
      ? "danger"
      : currentRoundIndex === -1
        ? "warning"
        : "success";
    const title = eliminated
      ? "Team eliminated"
      : currentRoundIndex === -1
        ? "Event not started"
        : currentRoundIndex === 2
          ? "Event ended"
          : "Team status";

    return {
      tone,
      title,
      message,
    };
  }

  if (currentRoundIndex === -1) {
    return {
      tone: "warning",
      title: "Event not started",
      message: "Your registered event has not started yet.",
    };
  }

  if (currentRoundIndex === 2) {
    return {
      tone: eliminated ? "danger" : "success",
      title: "Event ended",
      message: eliminated
        ? "Your team has been eliminated from the event."
        : "The event has ended. Your team is still marked as qualified.",
    };
  }

  if (eliminated) {
    return {
      tone: "danger",
      title: "Team eliminated",
      message: "Your team is no longer eligible to advance to the next round.",
    };
  }

  if (currentRoundIndex === 0 || currentRoundIndex === 1) {
    return {
      tone: "success",
      title: "Still in competition",
      message: "Your team is still eligible in the current round.",
    };
  }

  return null;
};

export function calculateTimeLeft(targetDate: Date): TimeLeft {
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

export const emptyTimeLeft: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isExpired: false,
};
