import { normalizeId, normalizeList, unwrapData } from "./teamHelpers";

export type SubmissionSnapshot = {
  submissionId: string;
  githubUrl: string;
  demoUrl: string;
  slideUrl: string;
  score: string;
  reason: string;
  roundName: string;
  status: string;
};

export type SubmissionEventContext = {
  key: string;
  eventId: string;
  eventName: string;
  trackName: string;
  topicName: string;
  roundName: string;
  statusMessage: string;
};

export type SubmissionAuditLog = {
  title: string;
  oldGithubUrl: string;
  oldDemoUrl: string;
  oldSlideUrl: string;
  newGithubUrl: string;
  newDemoUrl: string;
  newSlideUrl: string;
  actor: string;
  createdAt: string;
};

export const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const getErrorMessage = (error: any, fallback: string) => {
  const rawError = error?.response?.data;

  if (!rawError) return fallback;
  if (typeof rawError === "string") return rawError;
  if (rawError?.message) return rawError.message;
  if (rawError?.title) return rawError.title;
  if (rawError?.errors) return JSON.stringify(rawError.errors, null, 2);

  return JSON.stringify(rawError, null, 2);
};

export const readString = (...values: any[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
  }
  return "";
};

export const extractEventId = (obj: any): string =>
  readString(
    obj?.eventId,
    obj?.eventID,
    obj?.EventID,
    obj?.event?.eventId,
    obj?.event?.eventID,
    obj?.Event?.EventID,
    obj?.teamInRound?.eventId,
    obj?.teamInRound?.eventID,
    obj?.TeamInRound?.EventID,
  );

export const extractEventName = (obj: any): string =>
  readString(
    obj?.eventName,
    obj?.EventName,
    obj?.name,
    obj?.event?.eventName,
    obj?.event?.EventName,
    obj?.event?.name,
    obj?.Event?.EventName,
    "Not registered",
  );

export const extractTrackName = (obj: any): string =>
  readString(
    obj?.trackName,
    obj?.TrackName,
    obj?.categoryName,
    obj?.CategoryName,
    obj?.track?.trackName,
    obj?.track?.name,
    obj?.teamInRound?.trackName,
    obj?.teamInRound?.TrackName,
    "No track",
  );

export const extractTopicName = (obj: any): string =>
  readString(
    obj?.topicName,
    obj?.TopicName,
    obj?.topicDetail,
    obj?.TopicDetail,
    obj?.topic?.topicDetail,
    obj?.topic?.name,
    obj?.teamInRound?.topicName,
    obj?.teamInRound?.TopicName,
    "No topic",
  );

export const extractRoundName = (obj: any): string =>
  readString(
    obj?.roundName,
    obj?.RoundName,
    obj?.currentRoundName,
    obj?.CurrentRoundName,
    obj?.teamInRound?.roundName,
    obj?.teamInRound?.RoundName,
    "Current Round",
  );

export const getSubmitEventKey = (event: SubmissionEventContext) =>
  event.eventId ||
  [event.eventName, event.trackName, event.topicName, event.roundName].join(
    "|",
  );

export const normalizeTeamInfoRecords = (value: any): any[] => {
  const data = unwrapData(value);
  const records = normalizeList(data);
  if (records.length > 0) return records;
  if (data && typeof data === "object") return [data];
  return [];
};

export const buildSubmitEventContexts = (
  team: any,
  teamInfo: any,
): SubmissionEventContext[] => {
  const teamEvents = [
    ...normalizeList(team?.events),
    ...normalizeList(team?.Events),
    ...normalizeList(team?.registeredEvents),
    ...normalizeList(team?.RegisteredEvents),
  ];
  const infoRecords = normalizeTeamInfoRecords(teamInfo);
  const historyEvents = teamEvents.filter((event) => {
    const eventId = extractEventId(event);
    const eventName = extractEventName(event).toLowerCase();
    return (
      Boolean(eventId) &&
      !["", "not registered", "no event", "you not in an event"].includes(
        eventName,
      )
    );
  });
  const fallbackInfoEvents = infoRecords.filter((event) => {
    const eventId = extractEventId(event);
    const eventName = extractEventName(event).toLowerCase();
    return (
      Boolean(eventId) &&
      !["", "not registered", "no event", "you not in an event"].includes(
        eventName,
      )
    );
  });
  const sourceRecords =
    historyEvents.length > 0 ? historyEvents : fallbackInfoEvents;
  const unique = new Map<string, SubmissionEventContext>();

  sourceRecords.forEach((eventRecord) => {
    const eventId = extractEventId(eventRecord);
    const eventName = extractEventName(eventRecord);
    if (!eventId) return;

    const matchedInfo = infoRecords.find((info) => {
      const infoEventId = extractEventId(info);
      const infoEventName = extractEventName(info).toLowerCase();
      return (
        (infoEventId && normalizeId(infoEventId) === normalizeId(eventId)) ||
        (eventName &&
          infoEventName &&
          eventName.toLowerCase() === infoEventName)
      );
    });
    const record = { ...eventRecord, ...(matchedInfo || {}) };

    const context: SubmissionEventContext = {
      key: "",
      eventId: eventId || extractEventId(record),
      eventName: extractEventName(record),
      trackName: extractTrackName(record),
      topicName: extractTopicName(record),
      roundName: extractRoundName(record),
      statusMessage: readString(record?.statusMessage, record?.StatusMessage),
    };
    context.key = getSubmitEventKey(context);

    const mergeKey = eventId || eventName.toLowerCase();
    const existing = unique.get(mergeKey);
    unique.set(mergeKey, {
      ...(existing || context),
      ...context,
      eventId: existing?.eventId || context.eventId,
      trackName:
        context.trackName !== "No track"
          ? context.trackName
          : existing?.trackName || context.trackName,
      topicName:
        context.topicName !== "No topic"
          ? context.topicName
          : existing?.topicName || context.topicName,
      roundName:
        context.roundName !== "Current Round"
          ? context.roundName
          : existing?.roundName || context.roundName,
    });
  });

  return Array.from(unique.values()).map((event) => ({
    ...event,
    key: getSubmitEventKey(event),
  }));
};

export const getSubmissionEventId = (obj: any): string =>
  extractEventId(obj) ||
  extractEventId(obj?.teamInRound) ||
  extractEventId(obj?.TeamInRound) ||
  extractEventId(obj?.event);

export const stripTechnicalIds = (value: string) =>
  value
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .trim();

export const formatAuditDate = (value: string) => {
  if (!value) return "";
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

export const normalizeAuditLogs = (value: any): SubmissionAuditLog[] => {
  const logs = normalizeList(unwrapData(value));

  return logs
    .map((item: any) => {
      const oldGithubUrl = readString(
        item?.oldUrlGithub,
        item?.OldUrlGithub,
        item?.oldGithubUrl,
        item?.OldGithubUrl,
      );
      const oldDemoUrl = readString(
        item?.oldUrlDemo,
        item?.OldUrlDemo,
        item?.oldDemoUrl,
        item?.OldDemoUrl,
      );
      const oldSlideUrl = readString(
        item?.oldUrlSlide,
        item?.OldUrlSlide,
        item?.oldSlideUrl,
        item?.OldSlideUrl,
      );
      const newGithubUrl = readString(
        item?.newUrlGithub,
        item?.NewUrlGithub,
        item?.newGithubUrl,
        item?.NewGithubUrl,
      );
      const newDemoUrl = readString(
        item?.newUrlDemo,
        item?.NewUrlDemo,
        item?.newDemoUrl,
        item?.NewDemoUrl,
      );
      const newSlideUrl = readString(
        item?.newUrlSlide,
        item?.NewUrlSlide,
        item?.newSlideUrl,
        item?.NewSlideUrl,
      );
      const firstSubmission = [oldGithubUrl, oldDemoUrl, oldSlideUrl].some(
        (entry) => entry.toLowerCase().includes("first submission"),
      );
      const title = stripTechnicalIds(
        readString(
          item?.action,
          item?.Action,
          item?.activity,
          item?.Activity,
          item?.event,
          item?.Event,
          firstSubmission ? "First submission" : "Submission updated",
        ),
      );

      return {
        title: title || "Submission updated",
        oldGithubUrl,
        oldDemoUrl,
        oldSlideUrl,
        newGithubUrl,
        newDemoUrl,
        newSlideUrl,
        actor: stripTechnicalIds(
          readString(
            item?.actorName,
            item?.ActorName,
            item?.createdBy,
            item?.CreatedBy,
            item?.userName,
            item?.UserName,
            item?.email,
            item?.Email,
          ),
        ),
        createdAt: readString(
          item?.createdAt,
          item?.CreatedAt,
          item?.updatedAt,
          item?.UpdatedAt,
          item?.timestamp,
          item?.Timestamp,
          item?.date,
          item?.Date,
        ),
      };
    })
    .filter((log) => log.title || log.createdAt);
};

export const pickSubmissionSource = (value: any, eventId = "") => {
  const data = unwrapData(value);
  const list = normalizeList(data);
  if (list.length > 0) {
    if (eventId) {
      const matched = list.find(
        (item) =>
          normalizeId(getSubmissionEventId(item)) === normalizeId(eventId),
      );
      if (matched) return matched;
    }
    return list[0];
  }

  return (
    data?.submission ||
    data?.Submission ||
    data?.mySubmission ||
    data?.MySubmission ||
    data?.result ||
    data?.Result ||
    data ||
    null
  );
};

export const normalizeSubmission = (
  value: any,
  eventId = "",
): SubmissionSnapshot | null => {
  const source = pickSubmissionSource(value, eventId);
  if (!source || typeof source !== "object") return null;

  const evaluation = source.evaluation || source.Evaluation || {};
  const teamInRound = source.teamInRound || source.TeamInRound || {};
  const score = readString(
    source.score,
    source.Score,
    source.totalScore,
    source.TotalScore,
    source.averageScore,
    source.AverageScore,
    source.avgScore,
    source.AvgScore,
    evaluation.score,
    evaluation.Score,
    evaluation.averageScore,
    evaluation.AverageScore,
  );

  const snapshot = {
    submissionId: readString(
      source.submissionId,
      source.submissionID,
      source.SubmissionId,
      source.SubmissionID,
      source.id,
      source.ID,
    ),
    githubUrl: readString(
      source.urlGithub,
      source.UrlGithub,
      source.githubUrl,
      source.GithubUrl,
      source.gitHubUrl,
      source.GitHubUrl,
    ),
    demoUrl: readString(
      source.urlDemo,
      source.UrlDemo,
      source.demoUrl,
      source.DemoUrl,
    ),
    slideUrl: readString(
      source.urlSlide,
      source.UrlSlide,
      source.slideUrl,
      source.SlideUrl,
    ),
    score,
    reason: readString(
      source.reason,
      source.Reason,
      evaluation.reason,
      evaluation.Reason,
    ),
    roundName: readString(
      source.roundName,
      source.RoundName,
      source.currentRoundName,
      source.CurrentRoundName,
      teamInRound.roundName,
      teamInRound.RoundName,
    ),
    status: readString(
      source.status,
      source.Status,
      source.submissionStatus,
      source.SubmissionStatus,
    ),
  };

  if (
    !snapshot.submissionId &&
    !snapshot.githubUrl &&
    !snapshot.demoUrl &&
    !snapshot.slideUrl &&
    !snapshot.score
  ) {
    return null;
  }

  return snapshot;
};

export const hasSubmissionLinks = (submission: SubmissionSnapshot | null) =>
  Boolean(submission?.githubUrl || submission?.demoUrl || submission?.slideUrl);
