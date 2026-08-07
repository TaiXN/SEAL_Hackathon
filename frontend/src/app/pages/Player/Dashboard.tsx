import { useEffect, useState } from "react";
import {
  Clock,
  Trophy,
  Map as MapIcon,
  ShieldCheck,
  Target,
  Medal,
  TrendingUp,
  Crown,
} from "lucide-react";
import Swal from "sweetalert2";
import { showApiError } from "../../lib/utils/apiError";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
import { MentorSupportCard } from "../../components/player/MentorSupportCard";
import { teamApi } from "../../lib/api/teamApi";
import { roundApi } from "../../lib/api/roundApi";
import { leaderboardApi } from "../../lib/api/leaderboardApi";
import { useAuthStore } from "../../stores/auth.store";
import { jwtDecode } from "jwt-decode";
import {
  unwrapData,
  normalizeList,
  normalizeId,
  getTeamId,
  getCurrentTeamFromHistory,
  isLeaderTeam,
  isBannedAccount,
  isEliminatedTeam,
  getBanReason,
  teamHasBannedMember,
} from "../../lib/utils/teamHelpers";

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================

const getCurrentUserNameFromToken = (accessToken?: string | null) => {
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

const safeString = (val: any, fallback: string = ""): string => {
  if (typeof val === "string" || typeof val === "number") return String(val);
  return fallback;
};

const extractTeamName = (obj: any): string => {
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

// TRÃCH XUáº¤T ÄIá»‚M
const extractScore = (obj: any): number => {
  if (!obj) return 0;
  const s = obj.score ?? obj.Score ?? obj.totalScore ?? obj.TotalScore ?? 0;
  if (typeof s === "number") return s;
  if (typeof s === "string" && !isNaN(parseFloat(s))) return parseFloat(s);
  return 0;
};

const readString = (value: any, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
};

const readNumber = (value: any): number | null => {
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

const extractEventId = (obj: any): string =>
  readString(
    obj?.eventId ??
      obj?.eventID ??
      obj?.EventID ??
      obj?.event?.eventId ??
      obj?.event?.eventID ??
      obj?.Event?.eventId ??
      obj?.Event?.EventID,
  );

const extractTrackId = (obj: any): string =>
  readString(
    obj?.trackId ??
      obj?.trackID ??
      obj?.TrackID ??
      obj?.track?.trackId ??
      obj?.track?.trackID ??
      obj?.Track?.trackId ??
      obj?.Track?.TrackID,
  );

const extractTopicId = (obj: any): string =>
  readString(
    obj?.topicId ??
      obj?.topicID ??
      obj?.TopicID ??
      obj?.topic?.topicId ??
      obj?.topic?.topicID ??
      obj?.Topic?.topicId ??
      obj?.Topic?.TopicID,
  );

const extractRoundId = (obj: any): string =>
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

const extractEventName = (obj: any): string =>
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

const extractTrackName = (obj: any): string =>
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

const extractTopicName = (obj: any): string =>
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

const hasRegisteredEvent = (obj: any, eventName: string) =>
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

const extractCurrentRoundIndex = (obj: any): number | null =>
  readNumber(
    obj?.currentRoundIndex ??
      obj?.currentroundindex ??
      obj?.CurrentRoundIndex ??
      obj?.eventCurrentRoundIndex ??
      obj?.currentRound,
  );

const getRoundLabel = (
  index: number | null,
  fallbackRoundName: string,
): string => {
  if (fallbackRoundName && fallbackRoundName !== "Current Round")
    return fallbackRoundName;
  if (index === 0) return "Not Started";
  if (index !== null && index > 0) return `Round ${index}`;
  return "Not Registered";
};

const extractRoundName = (obj: any): string =>
  readString(
    obj?.roundName ||
      obj?.RoundName ||
      obj?.currentRoundName ||
      obj?.CurrentRoundName ||
      obj?.teamInRound?.roundName,
    "Current Round",
  );

const extractInfoMessage = (obj: any): string =>
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

const isTeamEliminated = (obj: any): boolean => {
  const raw =
    obj?.isEliminated ?? obj?.iseliminated ?? obj?.IsEliminated ?? false;
  return raw === true || raw === 1 || String(raw).toLowerCase() === "true";
};

const getTeamNotice = (obj: any) => {
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

const getParticipationKey = (record: any) => {
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

const extractTeamHistoryEventRecords = (team: any): any[] => {
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

const getHistoryRecordsForTeam = (history: any[], teamId: string): any[] => {
  const normalizedTeamId = normalizeId(teamId);
  if (!normalizedTeamId) return [];

  return history.filter(
    (record) => normalizeId(getTeamId(record)) === normalizedTeamId,
  );
};

const mergeHistoryTeamRecords = (records: any[], fallbackTeam: any) => {
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

const extractHistoryEventRecordsForTeam = (
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

const normalizeTeamInfoRecords = (value: any): any[] => {
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

const mergeTeamInfoIntoHistoryEvents = (
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

const getParticipationRoundLabel = (record: any): string => {
  const roundLabel = getRoundLabel(
    extractCurrentRoundIndex(record),
    extractRoundName(record),
  );

  if (roundLabel !== "Not Registered") return roundLabel;
  return record?.isRegisteredEvent ? "Registered" : roundLabel;
};

const extractEventParticipations = (obj: any): any[] => {
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

const isUsableTrackRecord = (record: any) =>
  Boolean(
    extractTrackId(record) ||
    isFilledField(extractTrackName(record), ["no track", "-", "select track"]),
  );

const buildTrackParticipationRecord = ({
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
function calculateTimeLeft(targetDate: Date) {
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

const emptyTimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isExpired: false,
};

// ==========================================
// 2. MAIN COMPONENT (DASHBOARD)
// ==========================================

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const accessToken = useAuthStore((state: any) => state.accessToken);
  const loggedInName = getCurrentUserNameFromToken(accessToken);

  // States Form Registration
  const [events, setEvents] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedParticipationKey, setSelectedParticipationKey] = useState("");
  const [historyParticipationRecords, setHistoryParticipationRecords] =
    useState<any[]>([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [lastNoticeToastKey, setLastNoticeToastKey] = useState("");
  const [accountBanInfo, setAccountBanInfo] = useState({
    isBanned: false,
    reason: "",
  });
  const [activeTeamMembers, setActiveTeamMembers] = useState<any[]>([]);
  const [isSubmittingRegistration, setIsSubmittingRegistration] =
    useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
  });

  // States Timer
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(emptyTimeLeft);

  // States Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [currentRoundName, setCurrentRoundName] = useState<string>("");

  const [lbRounds, setLbRounds] = useState<any[]>([]);
  const [lbTracks, setLbTracks] = useState<any[]>([]);
  const [lbSelectedRound, setLbSelectedRound] = useState("");
  const [lbSelectedTrack, setLbSelectedTrack] = useState("");

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(
      () => setTimeLeft(calculateTimeLeft(deadline)),
      1000,
    );
    return () => clearInterval(timer);
  }, [deadline]);

  // LOAD DASHBOARD INFO & LEADERBOARD
  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setDeadline(null);
      setTimeLeft(emptyTimeLeft);
      setCurrentRoundName("");
      setSelectedEvent("");
      setSelectedTrack("");
      setSelectedTopic("");
      setHistoryParticipationRecords([]);
      setShowRegistrationForm(false);
      setTracks([]);
      setTopics([]);
      setLbSelectedRound("");
      setLbSelectedTrack("");
      setLeaderboard([]);
      setActiveTeamMembers([]);

      const historyResponse = await teamApi.getMyTeamsHistory();
      const teamHistory = normalizeList(historyResponse);
      const currentTeam = getCurrentTeamFromHistory(teamHistory);
      const responseData = unwrapData(historyResponse);
      setAccountBanInfo({
        isBanned: isBannedAccount(historyResponse, responseData, currentTeam),
        reason: getBanReason(historyResponse, responseData, currentTeam),
      });

      if (!currentTeam) {
        setDashboardData(null);
        setDeadline(null);
        setTimeLeft(emptyTimeLeft);
        setCurrentRoundName("");
        setLeaderboard([]);
        setSelectedParticipationKey("");
        setHistoryParticipationRecords([]);
        setShowRegistrationForm(false);
        setIsLoading(false);
        return;
      }

      const activeTeamId = getTeamId(currentTeam);
      const activeTeamHistoryRecords = getHistoryRecordsForTeam(
        teamHistory,
        activeTeamId,
      );
      const currentTeamSnapshot = mergeHistoryTeamRecords(
        activeTeamHistoryRecords,
        currentTeam,
      );
      let dashData = { ...currentTeamSnapshot };
      let teamInfoData: any = null;

      try {
        const membersRes = await teamApi.getTeamMembers(activeTeamId);
        setActiveTeamMembers(normalizeList(membersRes));
      } catch {
        setActiveTeamMembers([]);
      }

      try {
        const infoRes = await teamApi.getTeamDashboard(activeTeamId);
        teamInfoData = unwrapData(infoRes);
        const teamInfoRecords = normalizeTeamInfoRecords(teamInfoData);
        if (!Array.isArray(teamInfoData) && teamInfoRecords.length <= 1) {
          dashData = { ...dashData, ...(teamInfoRecords[0] || teamInfoData) };
        }
        setAccountBanInfo((prev) => ({
          isBanned:
            prev.isBanned || isBannedAccount(infoRes, unwrapData(infoRes)),
          reason: prev.reason || getBanReason(infoRes, unwrapData(infoRes)),
        }));
      } catch (err) {
        console.warn("KhÃ´ng táº£i Ä‘Æ°á»£c /api/Team/{teamId}/info:", err);
      }

      const historyEventRecords = mergeTeamInfoIntoHistoryEvents(
        extractHistoryEventRecordsForTeam(
          activeTeamHistoryRecords,
          currentTeam,
        ),
        teamInfoData,
      );
      setHistoryParticipationRecords(historyEventRecords);
      const teamInfoRecords = normalizeTeamInfoRecords(teamInfoData);
      const infoParticipations = [
        ...teamInfoRecords,
        ...normalizeList(dashData.participations),
        ...normalizeList(dashData.Participations),
        ...normalizeList(dashData.registeredEvents),
        ...normalizeList(dashData.RegisteredEvents),
        ...normalizeList(dashData.teamEvents),
        ...normalizeList(dashData.TeamEvents),
      ];

      dashData = {
        ...dashData,
        participations:
          historyEventRecords.length > 0
            ? [...historyEventRecords, ...infoParticipations]
            : infoParticipations,
      };

      let foundRoundId = extractRoundId(dashData);
      let foundTrackId = extractTrackId(dashData);
      let foundEventId = extractEventId(dashData);
      let foundTopicId = extractTopicId(dashData);

      if (!foundRoundId || !foundTrackId || !foundEventId || !foundTopicId) {
        try {
          const activeRoundsRes = await roundApi.getActiveRounds();
          const roundsArr = normalizeList(activeRoundsRes);

          for (const round of roundsArr) {
            const rId = round.roundID || round.id;
            if (!rId) continue;

            // Gá»i API láº¥y danh sÃ¡ch Ä‘á»™i cá»§a tá»«ng vÃ²ng thi
            const detailsRes = await teamApi.getTeamDetailsInRound(rId);
            const detailsList = normalizeList(detailsRes);

            // DÃ² tÃ¬m ID Ä‘á»™i cá»§a mÃ¬nh trong danh sÃ¡ch Ä‘Ã³
            const matchRecord = detailsList.find(
              (item: any) =>
                normalizeId(item.teamId || item.teamID) ===
                normalizeId(activeTeamId),
            );

            if (matchRecord) {
              foundRoundId = rId;
              foundTrackId = matchRecord.trackId || matchRecord.trackID;
              foundTopicId = matchRecord.topicId || matchRecord.topicID;
              foundEventId = round.eventID || round.eventId;
              setCurrentRoundName(round.roundName || "");

              // Gáº¯n vÃ o dashData Ä‘á»ƒ UI hiá»ƒn thá»‹
              dashData.teamInRound = matchRecord;
              dashData.status = matchRecord.status || dashData.status;
              dashData.score = matchRecord.score;
              break;
            }
          }
        } catch (e) {
          console.warn("Lá»—i rÃ  soÃ¡t teamInRound:", e);
        }
      }

      setDashboardData(dashData);
      const participationRecords = extractEventParticipations(dashData);
      setSelectedParticipationKey((prev) => {
        if (participationRecords.length === 0) return "";
        const stillExists = participationRecords.some(
          (record) => getParticipationKey(record) === prev,
        );
        return stillExists
          ? prev
          : getParticipationKey(participationRecords[0]);
      });
      setShowRegistrationForm(participationRecords.length === 0);

      const roundLabel = getRoundLabel(
        extractCurrentRoundIndex(dashData),
        extractRoundName(dashData),
      );

      if (roundLabel !== "Not Registered") setCurrentRoundName(roundLabel);

      try {
        const teamTracks = normalizeList(
          await teamApi.getTracksByTeam(activeTeamId),
        );
        setLbTracks(teamTracks);

        const roundsByTrackId = new Map<string, any[]>();
        await Promise.all(
          teamTracks.map(async (track: any) => {
            const trackId = readString(
              track.trackID || track.trackId || track.id,
            );
            if (!trackId) return;

            try {
              const rounds = normalizeList(
                await teamApi.getRoundsByTeamAndTrack(activeTeamId, trackId),
              );
              roundsByTrackId.set(trackId, rounds);
            } catch {
              roundsByTrackId.set(trackId, []);
            }
          }),
        );

        const trackParticipationRecords = teamTracks
          .map((track: any) => {
            const trackId = readString(
              track.trackID || track.trackId || track.id,
            );
            const rounds = roundsByTrackId.get(trackId) || [];
            const currentRound =
              rounds.find(
                (round: any) =>
                  normalizeId(round.roundID || round.roundId || round.id) ===
                  normalizeId(foundRoundId),
              ) || rounds[0];

            return buildTrackParticipationRecord({
              track,
              round: currentRound,
              activeTeamId,
              teamName: extractTeamName(dashData),
            });
          })
          .filter((record: any) => isUsableTrackRecord(record));

        if (
          trackParticipationRecords.length > 0 &&
          historyEventRecords.length === 0
        ) {
          dashData = {
            ...dashData,
            participations: [
              ...normalizeList(dashData.participations),
              ...trackParticipationRecords,
            ],
          };
          setDashboardData(dashData);

          const nextParticipationRecords = extractEventParticipations(dashData);
          setSelectedParticipationKey((prev) => {
            if (nextParticipationRecords.length === 0) return "";
            const stillExists = nextParticipationRecords.some(
              (record) => getParticipationKey(record) === prev,
            );
            return stillExists
              ? prev
              : getParticipationKey(nextParticipationRecords[0]);
          });
          setShowRegistrationForm(nextParticipationRecords.length === 0);
        }

        const defaultTrack =
          teamTracks.find(
            (track: any) =>
              normalizeId(track.trackID || track.trackId || track.id) ===
              normalizeId(foundTrackId),
          ) ||
          teamTracks.find(
            (track: any) =>
              readString(track.trackName || track.name).toLowerCase() ===
              extractTrackName(dashData).toLowerCase(),
          ) ||
          teamTracks[0];

        const defaultTrackId = readString(
          defaultTrack?.trackID || defaultTrack?.trackId || defaultTrack?.id,
        );
        setLbSelectedTrack(defaultTrackId);

        if (defaultTrackId) {
          const teamRounds =
            roundsByTrackId.get(defaultTrackId) ||
            normalizeList(
              await teamApi.getRoundsByTeamAndTrack(
                activeTeamId,
                defaultTrackId,
              ),
            );
          setLbRounds(teamRounds);

          const defaultRound =
            teamRounds.find(
              (round: any) =>
                normalizeId(round.roundID || round.roundId || round.id) ===
                normalizeId(foundRoundId),
            ) ||
            teamRounds.find(
              (round: any) =>
                readString(round.roundName || round.name).toLowerCase() ===
                roundLabel.toLowerCase(),
            ) ||
            teamRounds[0];

          setLbSelectedRound(
            readString(
              defaultRound?.roundID ||
                defaultRound?.roundId ||
                defaultRound?.id,
            ),
          );
        } else {
          setLbRounds([]);
          setLbSelectedRound("");
        }
      } catch (e) {
        console.warn("Failed to load team-scoped leaderboard filters:", e);
        setLbTracks([]);
        setLbRounds([]);
        setLbSelectedTrack("");
        setLbSelectedRound("");
      }

      // ==============================================================
      // Táº¢I Dá»® LIá»†U DROPDOWN CHO FORM ÄÄ‚NG KÃ
      // ==============================================================
      try {
        const eventsRes = await teamApi.getActiveEvents();
        setEvents(normalizeList(eventsRes));
      } catch (error) {}

      if (foundEventId || foundRoundId) {
        // Má»‘c thá»i gian Äáº¿m ngÆ°á»£c
        try {
          const countdownRes = await teamApi.getCountdown(activeTeamId);
          let dateStr = null;
          if (typeof countdownRes === "string") dateStr = countdownRes;
          else if (countdownRes && typeof countdownRes === "object") {
            dateStr =
              countdownRes.endDate ||
              countdownRes.targetDate ||
              countdownRes.deadline;
          }

          if (dateStr) {
            const dl = new Date(dateStr);
            if (!isNaN(dl.getTime())) {
              setDeadline(dl);
              setTimeLeft(calculateTimeLeft(dl));
            } else {
              setDeadline(null);
              setTimeLeft(emptyTimeLeft);
            }
          } else {
            setDeadline(null);
            setTimeLeft(emptyTimeLeft);
          }
        } catch (e: any) {
          setDeadline(null);
          setTimeLeft(emptyTimeLeft);
        }
      } else {
        setDeadline(null);
        setTimeLeft(emptyTimeLeft);
      }
    } catch (error: any) {
      console.error("Lá»—i load Dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    window.addEventListener("player-team-updated", fetchDashboard);
    return () =>
      window.removeEventListener("player-team-updated", fetchDashboard);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRoundsForTeamTrack = async () => {
      const activeTeamId = getTeamId(dashboardData);
      if (!activeTeamId || !lbSelectedTrack) {
        setLbRounds([]);
        setLbSelectedRound("");
        return;
      }

      try {
        const response = await teamApi.getRoundsByTeamAndTrack(
          activeTeamId,
          lbSelectedTrack,
        );
        if (cancelled) return;

        const rounds = normalizeList(response);
        setLbRounds(rounds);

        const currentRoundId = normalizeId(extractRoundId(dashboardData));
        const currentRoundLabel = getRoundLabel(
          extractCurrentRoundIndex(dashboardData),
          extractRoundName(dashboardData),
        ).toLowerCase();

        const selectedRoundStillExists = rounds.some(
          (round: any) =>
            normalizeId(round.roundID || round.roundId || round.id) ===
            normalizeId(lbSelectedRound),
        );

        if (!selectedRoundStillExists) {
          const defaultRound =
            rounds.find(
              (round: any) =>
                normalizeId(round.roundID || round.roundId || round.id) ===
                currentRoundId,
            ) ||
            rounds.find(
              (round: any) =>
                readString(round.roundName || round.name).toLowerCase() ===
                currentRoundLabel,
            ) ||
            rounds[0];

          setLbSelectedRound(
            readString(
              defaultRound?.roundID ||
                defaultRound?.roundId ||
                defaultRound?.id,
            ),
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to load team rounds for leaderboard:", error);
          setLbRounds([]);
          setLbSelectedRound("");
        }
      }
    };

    loadRoundsForTeamTrack();

    return () => {
      cancelled = true;
    };
  }, [dashboardData, lbSelectedTrack]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoadingLeaderboard(true);
      try {
        let resData = [];

        // Gá»i tháº³ng Detail theo roundId vÃ  trackId
        if (lbSelectedRound && lbSelectedTrack) {
          try {
            resData = await leaderboardApi.getLeaderboardDetail(
              lbSelectedRound,
              lbSelectedTrack,
            );
          } catch (err: any) {
            if (err.response?.status === 404) resData = [];
            else throw err;
          }

          const lbData = normalizeList(resData);
          const validTeams = lbData.filter(
            (t: any) => extractTeamName(t) !== "Unknown",
          );
          validTeams.sort((a, b) => extractScore(b) - extractScore(a));
          setLeaderboard(validTeams);
        } else {
          setLeaderboard([]);
        }
      } catch (error) {
        console.error("Lá»—i láº¥y Leaderboard:", error);
        setLeaderboard([]);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    const delayTimer = setTimeout(() => fetchLeaderboard(), 300);
    return () => clearTimeout(delayTimer);
  }, [lbSelectedRound, lbSelectedTrack]);

  const teamId = getTeamId(dashboardData);
  const currentUserIsLeader = isLeaderTeam(dashboardData);
  const currentAccountBanned =
    accountBanInfo.isBanned || isBannedAccount(dashboardData);
  const currentTeamHasBannedMember = teamHasBannedMember({
    ...dashboardData,
    members: activeTeamMembers,
  });
  const dashboardParticipationRecords =
    extractEventParticipations(dashboardData);
  const participationRecords =
    historyParticipationRecords.length > 0
      ? historyParticipationRecords
      : dashboardParticipationRecords;
  const selectedParticipation =
    participationRecords.find(
      (record) => getParticipationKey(record) === selectedParticipationKey,
    ) ||
    participationRecords[0] ||
    null;
  const activeEventContext = selectedParticipation || dashboardData;
  const registeredEventIds = new Set(
    participationRecords.map(extractEventId).filter(Boolean),
  );
  const registeredEventNames = new Set(
    participationRecords
      .map((record) => extractEventName(record).toLowerCase())
      .filter((name) => name && name !== "not registered"),
  );
  const availableRegistrationEvents = events.filter((event) => {
    const eventId = safeString(
      event.EventID || event.eventID || event.eventId || event.id,
    );
    const eventName = safeString(
      event.EventName || event.eventName || event.name,
    ).toLowerCase();
    return (
      !registeredEventIds.has(eventId) && !registeredEventNames.has(eventName)
    );
  });
  const eventName = extractEventName(activeEventContext);
  const trackName = extractTrackName(activeEventContext);
  const topicName = extractTopicName(activeEventContext);
  const currentRoundIndex = extractCurrentRoundIndex(activeEventContext);
  const currentRoundLabel = getRoundLabel(
    currentRoundIndex,
    extractRoundName(activeEventContext),
  );
  const eliminated =
    isTeamEliminated(activeEventContext) ||
    isEliminatedTeam(activeEventContext, dashboardData);
  const teamPermanentlyLocked = eliminated;
  const hasEventRegistration =
    participationRecords.length > 0 ||
    hasRegisteredEvent(activeEventContext, eventName);
  const hasKnownRound =
    currentRoundLabel !== "Not Registered" || Boolean(currentRoundName);
  const hasInfoRegistration = hasEventRegistration;
  const teamNotice = hasInfoRegistration
    ? getTeamNotice(activeEventContext)
    : null;
  const noticeToastKey =
    teamNotice && teamNotice.tone !== "success"
      ? `${getParticipationKey(activeEventContext)}|${teamNotice.tone}|${teamNotice.title}|${teamNotice.message}`
      : "";

  // Logic kiá»ƒm tra Ä‘á»ƒ hiá»ƒn thá»‹ cho khung Current Round
  const hasSubmittedRegistration = Boolean(
    hasInfoRegistration || dashboardData?.teamInRound,
  );
  const isActuallySubmitted = hasSubmittedRegistration;

  const isApprovedIntoRound = Boolean(
    selectedParticipation ||
    dashboardData?.teamInRound ||
    hasInfoRegistration ||
    hasKnownRound,
  );
  const displayRoundName =
    currentRoundLabel !== "Not Registered"
      ? currentRoundLabel
      : activeEventContext?.isRegisteredEvent
        ? "Registered"
        : currentRoundName || "Pending...";
  const registeredRoundName = isApprovedIntoRound
    ? displayRoundName
    : "Pending...";
  const isRoundLive =
    (currentRoundIndex !== null && currentRoundIndex > 0) ||
    (currentRoundIndex === null && isApprovedIntoRound && !eliminated);
  const roundDotClass = eliminated
    ? "bg-red-500"
    : currentRoundIndex === 0
      ? "bg-amber-500"
      : "bg-emerald-500";

  useEffect(() => {
    if (participationRecords.length === 0) {
      if (selectedParticipationKey) setSelectedParticipationKey("");
      return;
    }

    const selectedStillExists = participationRecords.some(
      (record) => getParticipationKey(record) === selectedParticipationKey,
    );
    if (!selectedParticipationKey || !selectedStillExists) {
      setSelectedParticipationKey(getParticipationKey(participationRecords[0]));
    }
  }, [dashboardData, historyParticipationRecords, selectedParticipationKey]);

  useEffect(() => {
    if (
      !noticeToastKey ||
      noticeToastKey === lastNoticeToastKey ||
      !teamNotice
    ) {
      return;
    }

    setLastNoticeToastKey(noticeToastKey);
    void Swal.fire({
      toast: true,
      position: "top-end",
      icon: teamNotice.tone === "danger" ? "error" : "warning",
      title: teamNotice.title,
      text: teamNotice.message,
      showConfirmButton: false,
      timer: teamNotice.tone === "danger" ? 6500 : 5000,
      timerProgressBar: true,
    });
  }, [noticeToastKey, lastNoticeToastKey, teamNotice]);

  const handleParticipationChange = (key: string) => {
    setSelectedParticipationKey(key);
    const record = participationRecords.find(
      (item) => getParticipationKey(item) === key,
    );
    if (!record) return;

    const trackId = extractTrackId(record);
    const roundId = extractRoundId(record);
    if (trackId) setLbSelectedTrack(trackId);
    if (roundId) setLbSelectedRound(roundId);
  };

  const handleEventChange = async (eventId: string) => {
    setSelectedEvent(eventId);
    setSelectedTrack("");
    setSelectedTopic("");
    setTracks([]);
    setTopics([]);

    if (!eventId) return;

    try {
      const response = await teamApi.getTracksByEvent(eventId);
      setTracks(normalizeList(response));
    } catch (error) {}
  };

  const handleTrackChange = async (trackId: string) => {
    setSelectedTrack(trackId);
    setSelectedTopic("");
    setTopics([]);

    if (!trackId) return;

    try {
      const response = await teamApi.getTopicsByTrack(trackId);
      setTopics(normalizeList(response));
    } catch (error) {}
  };

  const handleSubmitRegistration = () => {
    if (currentAccountBanned) {
      Swal.fire({
        icon: "error",
        title: "Account Banned",
        text:
          accountBanInfo.reason ||
          "This account cannot register a team for an event.",
      });
      return;
    }

    if (teamPermanentlyLocked) {
      Swal.fire({
        icon: "error",
        title: "Team Eliminated",
        text: "This team has been eliminated and can no longer be reused. Please create a new team.",
      });
      return;
    }

    if (currentTeamHasBannedMember) {
      Swal.fire({
        icon: "error",
        title: "Banned Member Detected",
        text: "Kick the banned member from this team before registering for an event.",
      });
      return;
    }

    if (!selectedEvent || !selectedTrack || !selectedTopic) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select Event, Track, and Topic.",
      });
      return;
    }
    setModalConfig({
      isOpen: true,
      title: "Confirm Registration",
      description:
        "Are you sure you want to register this team for the selected Event, Track, and Topic?",
    });
  };

  const executeSubmitRegistration = async () => {
    try {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
      if (!teamId) return;

      setIsSubmittingRegistration(true);

      await teamApi.submitRegistration(teamId, {
        eventId: selectedEvent,
        trackId: selectedTrack,
        topicId: selectedTopic,
      });

      localStorage.setItem(`team_${teamId}_submitted`, "true");
      setSelectedEvent("");
      setSelectedTrack("");
      setSelectedTopic("");
      setTracks([]);
      setTopics([]);
      setShowRegistrationForm(false);
      await fetchDashboard();

      Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: "Your team has successfully registered.",
      });
    } catch (error: any) {
      showApiError(error, {
        action: "register you for this event",
        hint: "Registration may have closed, or you may already be registered.",
      });
    } finally {
      setIsSubmittingRegistration(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-500">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Welcome back, {safeString(loggedInName, "Player")}.
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Loading Dashboard data...
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-[#c2410c] border border-orange-100 text-xs font-extrabold uppercase tracking-wider mb-4">
          FPT Edu Hackathon
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">
          Welcome back, {safeString(loggedInName, "Player")}.
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          The Team Leader needs to select the Event, Track, and Topic to
          register.
        </p>
      </header>

      {/* 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ================= LEFT COLUMN (Ratio 8) ================= */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Current Round Countdown
            </h2>

            {deadline ? (
              timeLeft.isExpired ? (
                <div className="bg-red-50 border border-red-200 text-red-600 font-bold px-4 py-3 rounded-radius-md inline-flex items-center gap-2">
                  â³ The submission time for this round has ended!
                </div>
              ) : (
                <div className="flex items-center gap-4 sm:gap-6">
                  <TimeUnit value={timeLeft.days} label="Days" />
                  <TimeDivider />
                  <TimeUnit value={timeLeft.hours} label="Hours" />
                  <TimeDivider />
                  <TimeUnit value={timeLeft.minutes} label="Minutes" />
                  <TimeDivider hiddenOnSmall />
                  <TimeUnit
                    value={timeLeft.seconds}
                    label="Seconds"
                    hiddenOnSmall
                  />
                </div>
              )
            ) : (
              <div className="text-muted-foreground font-medium italic py-4">
                No countdown available for this round.
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.06] group-hover:opacity-10 transition-opacity">
                <Trophy className="w-24 h-24 text-primary" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  My Team
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {safeString(extractTeamName(dashboardData), "No team")}
                </p>
              </div>
            </div>

            {/* KHUNG "CURRENT ROUND" CHUáº¨N THAY CHO "STATUS" */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.06] group-hover:opacity-10 transition-opacity">
                <Target className="w-24 h-24 text-primary" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Current Round
                </p>
                <div className="flex items-center gap-2">
                  {isApprovedIntoRound ? (
                    <>
                      <span className="relative flex h-3 w-3 shrink-0 mt-0.5">
                        {isRoundLive && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span
                          className={`relative inline-flex rounded-full h-3 w-3 ${roundDotClass}`}
                        ></span>
                      </span>
                      <p
                        className="text-xl font-bold text-foreground line-clamp-1"
                        title={registeredRoundName}
                      >
                        {registeredRoundName}
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="relative flex h-3 w-3 shrink-0 mt-0.5">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-300"></span>
                      </span>
                      <p className="text-xl font-bold text-slate-400">
                        {isActuallySubmitted ? "Pending..." : "Not Registered"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-8">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Leaderboard
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Team rankings by selected Track & Round
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  className="w-32 border border-slate-200 bg-white rounded-md px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-bold text-slate-700"
                  value={lbSelectedTrack}
                  onChange={(e) => setLbSelectedTrack(e.target.value)}
                >
                  <option value="">Select Track</option>
                  {lbTracks.map((t) => {
                    const tId = safeString(t.trackID || t.trackId || t.id);
                    return (
                      <option key={tId} value={tId}>
                        {safeString(t.trackName)}
                      </option>
                    );
                  })}
                </select>
                <select
                  className="w-32 border border-slate-200 bg-white rounded-md px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-bold text-slate-700"
                  value={lbSelectedRound}
                  onChange={(e) => setLbSelectedRound(e.target.value)}
                  disabled={!lbSelectedTrack}
                >
                  <option value="">Select Round</option>
                  {lbRounds.map((r) => {
                    const rId = safeString(r.roundID || r.roundId || r.id);
                    return (
                      <option key={rId} value={rId}>
                        {safeString(r.roundName)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="p-0 max-h-[400px] overflow-y-auto relative">
              {isLoadingLeaderboard ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500 animate-pulse">
                  Loading Leaderboard...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500">
                  Select a Track and Round to view the leaderboard, or scores
                  have not been updated yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-16 text-center">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                        Total Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((team, index) => {
                      const currentTeamIdFromData = getTeamId(team);
                      const isMyTeam =
                        currentTeamIdFromData === safeString(teamId) &&
                        safeString(teamId) !== "";
                      const rank = index + 1;
                      const score = extractScore(team);
                      const displayName = extractTeamName(team);

                      let rankNode = (
                        <span className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center text-sm font-bold mx-auto">
                          {rank}
                        </span>
                      );
                      if (rank === 1)
                        rankNode = (
                          <Crown className="w-6 h-6 text-amber-500 mx-auto" />
                        );
                      if (rank === 2)
                        rankNode = (
                          <Medal className="w-6 h-6 text-slate-400 mx-auto" />
                        );
                      if (rank === 3)
                        rankNode = (
                          <Medal className="w-6 h-6 text-orange-400 mx-auto" />
                        );

                      return (
                        <tr
                          key={index}
                          className={`transition-colors hover:bg-slate-50 ${
                            isMyTeam ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-center align-middle">
                            {rankNode}
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <span
                              className={`font-semibold ${
                                isMyTeam ? "text-blue-700" : "text-slate-800"
                              }`}
                            >
                              {safeString(displayName)}
                            </span>
                            {isMyTeam && (
                              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white border border-blue-700">
                                Your Team
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right align-middle">
                            <span
                              className={`inline-block px-3 py-1 font-mono font-bold text-sm rounded-md border ${
                                rank === 1
                                  ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : rank === 2
                                    ? "bg-slate-100 text-slate-700 border-slate-200"
                                    : rank === 3
                                      ? "bg-orange-100 text-orange-700 border-orange-200"
                                      : isMyTeam
                                        ? "bg-blue-100 text-blue-700 border-blue-200"
                                        : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {safeString(score)} pts
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        {/* ================= RIGHT COLUMN (Ratio 4): EVENT CONTEXT + REGISTRATION ================= */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2 shrink-0">
              <MapIcon className="w-4 h-4 text-slate-400" /> Team Events
            </h2>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
              {!teamId ? (
                <div className="bg-white border border-slate-200 rounded-radius-md p-4">
                  <p className="font-bold text-slate-900">No Team Yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Create team on the My Team page before registering for an
                    event.
                  </p>
                </div>
              ) : participationRecords.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-4">
                    <p className="font-bold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" /> Registered Events
                    </p>
                    <p className="text-sm mt-1">
                      Select an event to update the dashboard context.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-bold text-slate-700">
                        Registered events
                      </label>
                      <span className="text-xs font-bold text-slate-400">
                        {participationRecords.length} event
                        {participationRecords.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {participationRecords.map((record) => {
                        const key = getParticipationKey(record);
                        const active =
                          selectedParticipation &&
                          getParticipationKey(selectedParticipation) === key;
                        const recordTrack = extractTrackName(record);
                        const recordTopic = extractTopicName(record);
                        const recordRound = getParticipationRoundLabel(record);

                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => handleParticipationChange(key)}
                            className={`w-full rounded-radius-md border px-4 py-3 text-left transition-colors ${
                              active
                                ? "border-orange-200 bg-orange-50"
                                : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-extrabold text-slate-950">
                                  {extractEventName(record)}
                                </p>
                                <p className="mt-1 truncate text-xs font-bold text-slate-500">
                                  {recordTrack}
                                  {recordTopic !== "No topic"
                                    ? ` - ${recordTopic}`
                                    : ""}
                                </p>
                              </div>
                              {active && (
                                <span className="shrink-0 rounded-full bg-[#f26f21] px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                                  Viewing
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-xs font-bold text-slate-400">
                              {recordRound}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <InfoRow label="Event" value={eventName} />
                  <InfoRow
                    label="Track / Topic"
                    value={`${trackName}${topicName !== "No topic" ? ` - ${topicName}` : ""}`}
                  />
                  <InfoRow label="Current Round" value={registeredRoundName} />
                </div>
              ) : (
                <div className="bg-white border border-amber-200 rounded-radius-md p-4">
                  <p className="font-bold text-amber-700">
                    No Event Registered
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Register this team for an event to unlock event-specific
                    dashboard data.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-[#f26f21]" /> Register
                  Another Event
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Add this team to another eligible event.
                </p>
              </div>
              {teamId &&
                currentUserIsLeader &&
                hasInfoRegistration &&
                !currentAccountBanned &&
                !teamPermanentlyLocked &&
                !currentTeamHasBannedMember && (
                  <button
                    type="button"
                    onClick={() => setShowRegistrationForm((prev) => !prev)}
                    className="shrink-0 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-[#c2410c] hover:bg-orange-100 transition-colors"
                  >
                    {showRegistrationForm ? "Hide" : "+ Add"}
                  </button>
                )}
            </div>

            {currentAccountBanned ? (
              <div className="bg-red-50 border border-red-200 rounded-radius-md p-4">
                <p className="font-bold text-red-700">Account Banned</p>
                <p className="text-sm text-red-600 mt-1">
                  {accountBanInfo.reason ||
                    "This account cannot register teams for events."}
                </p>
              </div>
            ) : teamPermanentlyLocked ? (
              <div className="bg-red-50 border border-red-200 rounded-radius-md p-4">
                <p className="font-bold text-red-700">Team Eliminated</p>
                <p className="text-sm text-red-600 mt-1">
                  This team is permanently locked. Create a new team to join
                  another event.
                </p>
              </div>
            ) : currentTeamHasBannedMember ? (
              <div className="bg-amber-50 border border-amber-200 rounded-radius-md p-4">
                <p className="font-bold text-amber-700">
                  Banned Member Detected
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Kick the banned member from My Team before registering this
                  team for an event.
                </p>
              </div>
            ) : !teamId ? (
              <div className="bg-slate-50 border border-slate-200 rounded-radius-md p-4">
                <p className="font-bold text-slate-900">No Team Yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Create team on the My Team page before registering for an
                  event.
                </p>
              </div>
            ) : !currentUserIsLeader ? (
              <div className="bg-slate-50 border border-slate-200 rounded-radius-md p-4">
                <p className="font-bold text-slate-900">
                  Leader Registration Only
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  You are a Team Member. Wait for your Team Leader to select the
                  Event, Track, and Topic.
                </p>
              </div>
            ) : showRegistrationForm || !hasInfoRegistration ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    Event
                  </label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-radius-md text-sm outline-none focus:border-blue-500 disabled:opacity-70 disabled:bg-slate-100 disabled:cursor-not-allowed font-medium text-slate-800"
                    value={selectedEvent}
                    onChange={(e) => handleEventChange(e.target.value)}
                    disabled={availableRegistrationEvents.length === 0}
                  >
                    <option value="">
                      {availableRegistrationEvents.length === 0
                        ? "No more events available"
                        : "Choose an event..."}
                    </option>
                    {availableRegistrationEvents.map((event) => {
                      const evId = safeString(
                        event.EventID ||
                          event.eventID ||
                          event.eventId ||
                          event.id,
                      );
                      const evName = safeString(
                        event.EventName ||
                          event.eventName ||
                          event.name ||
                          "Unnamed Event",
                      );
                      return (
                        <option key={evId} value={evId}>
                          {evName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    Track
                  </label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-radius-md text-sm outline-none focus:border-blue-500 disabled:opacity-70 disabled:bg-slate-100 disabled:cursor-not-allowed font-medium text-slate-800"
                    value={selectedTrack}
                    onChange={(e) => handleTrackChange(e.target.value)}
                    disabled={!selectedEvent}
                  >
                    <option value="">Choose a track...</option>
                    {tracks.map((track) => {
                      const trId = safeString(
                        track.TrackID ||
                          track.trackID ||
                          track.trackId ||
                          track.id,
                      );
                      const trName = safeString(
                        track.TrackName ||
                          track.trackName ||
                          track.name ||
                          "Unnamed Track",
                      );
                      return (
                        <option key={trId} value={trId}>
                          {trName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    Topic
                  </label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-radius-md text-sm outline-none focus:border-blue-500 disabled:opacity-70 disabled:bg-slate-100 disabled:cursor-not-allowed font-medium text-slate-800"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    disabled={!selectedTrack}
                  >
                    <option value="">Choose a topic...</option>
                    {topics.map((topic) => {
                      const tpId = safeString(
                        topic.TopicID ||
                          topic.topicID ||
                          topic.topicId ||
                          topic.id,
                      );
                      const tpName = safeString(
                        topic.TopicDetail ||
                          topic.topicDetail ||
                          topic.topicName ||
                          topic.name ||
                          "Unnamed Topic",
                      );
                      return (
                        <option key={tpId} value={tpId}>
                          {tpName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  onClick={handleSubmitRegistration}
                  disabled={
                    isSubmittingRegistration ||
                    availableRegistrationEvents.length === 0 ||
                    currentAccountBanned ||
                    teamPermanentlyLocked ||
                    currentTeamHasBannedMember
                  }
                  className="w-full bg-[#f26f21] text-white font-bold py-3.5 rounded-lg hover:bg-[#d85f16] transition-colors text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  <MapIcon className="w-4 h-4" />
                  {isSubmittingRegistration
                    ? "Submitting..."
                    : "Confirm Registration"}
                </button>
              </div>
            ) : (
              <div className="rounded-radius-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-800">
                  Ready to join another event?
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Use the add button to open the registration form.
                </p>
              </div>
            )}
          </section>

          <MentorSupportCard
            teamId={teamId}
            teamName={safeString(extractTeamName(dashboardData), "No team")}
            trackName={trackName}
            topicName={topicName}
            canLoadMentor={hasInfoRegistration}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeSubmitRegistration}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText="Confirm Registration"
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-radius-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800 break-words">
        {value || "-"}
      </p>
    </div>
  );
}

function TimeUnit({
  value,
  label,
  hiddenOnSmall = false,
}: {
  value: number;
  label: string;
  hiddenOnSmall?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center ${
        hiddenOnSmall ? "hidden sm:flex" : "flex"
      }`}
    >
      <span className="text-5xl sm:text-7xl font-bold font-mono tracking-tighter drop-shadow-sm text-slate-900">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 sm:mt-3">
        {label}
      </span>
    </div>
  );
}

function TimeDivider({ hiddenOnSmall = false }: { hiddenOnSmall?: boolean }) {
  return (
    <div
      className={`text-4xl sm:text-6xl font-light text-slate-300 pb-6 sm:pb-8 ${
        hiddenOnSmall ? "hidden sm:block" : "block"
      }`}
    >
      :
    </div>
  );
}
