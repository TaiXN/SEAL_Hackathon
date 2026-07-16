import { useEffect, useState } from "react";
import {
  Clock,
  Trophy,
  Map,
  ShieldCheck,
  FileCheck,
  Medal,
  TrendingUp,
  Crown,
} from "lucide-react";
import Swal from "sweetalert2";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
import { teamApi } from "../../lib/api/teamApi";
import { roundApi } from "../../lib/api/roundApi";
import { leaderboardApi } from "../../lib/api/leaderboardApi";
import { useAuthStore } from "../../stores/auth.store";
import { jwtDecode } from "jwt-decode";

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

const unwrapData = (value: any) => value?.data ?? value;

const normalizeList = (value: any): any[] => {
  const data = unwrapData(value);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const normalizeId = (id: any) =>
  String(id || "")
    .toLowerCase()
    .trim();

const safeString = (val: any, fallback: string = ""): string => {
  if (typeof val === "string" || typeof val === "number") return String(val);
  return fallback;
};

// MÁY QUÉT 1: Lấy Tên Đội từ tận 4 lớp dữ liệu lồng nhau của BE
const extractTeamName = (obj: any): string => {
  if (!obj) return "Unknown";
  if (obj.submission?.teamInRound?.team?.teamName)
    return obj.submission.teamInRound.team.teamName;
  if (obj.submission?.teamInRound?.team?.TeamName)
    return obj.submission.teamInRound.team.TeamName;
  if (typeof obj.teamName === "string") return obj.teamName;
  if (typeof obj.TeamName === "string") return obj.TeamName;
  if (obj.team?.teamName) return obj.team.teamName;
  if (obj.name) return obj.name;
  return "Unknown";
};

// MÁY QUÉT 2: Lấy Điểm
const extractScore = (obj: any): number => {
  if (!obj) return 0;
  const s = obj.score ?? obj.Score ?? obj.totalScore ?? obj.TotalScore ?? 0;
  if (typeof s === "number") return s;
  if (typeof s === "string" && !isNaN(parseFloat(s))) return parseFloat(s);
  return 0;
};

// MÁY QUÉT 3: Lấy ID Đội
const extractTeamId = (obj: any): string => {
  if (!obj) return "";
  return normalizeId(
    obj.submission?.teamInRound?.teamId ||
      obj.teamId ||
      obj.teamID ||
      obj.id ||
      obj.team?.teamId ||
      obj.team?.teamID,
  );
};

const getTeamId = (team: any) => extractTeamId(team);

const getCurrentTeamFromHistory = (history: any[]) => {
  if (!history || history.length === 0) return null;
  const savedTeamId = localStorage.getItem("activeTeamId");
  if (savedTeamId === "NEW") return null;

  if (savedTeamId) {
    const found = history.find((t) => getTeamId(t) === savedTeamId);
    if (found) return found;
  }

  const defaultTeam =
    history.find((item) => item?.isActive === true) ||
    history.find((item) => item?.status !== "Deleted") ||
    history[0];
  if (defaultTeam) localStorage.setItem("activeTeamId", getTeamId(defaultTeam));
  return defaultTeam;
};

const isLeaderTeam = (team: any) => {
  const rawRole = String(
    team?.role || team?.teamRole || team?.memberRole || team?.position || "",
  ).toLowerCase();
  return (
    team?.isLeader === true || team?.isLeader === 1 || rawRole === "leader"
  );
};

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
  const [isSubmittingRegistration, setIsSubmittingRegistration] =
    useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
  });

  // States Timer
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  // States Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [currentRoundName, setCurrentRoundName] = useState<string>("");

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(
      () => setTimeLeft(calculateTimeLeft(deadline)),
      1000,
    );
    return () => clearInterval(timer);
  }, [deadline]);

  // LOAD DASHBOARD INFO & LEADERBOARD (Theo yêu cầu Backend gọi API Detail)
  const fetchDashboard = async () => {
    try {
      setIsLoading(true);

      const historyResponse = await teamApi.getMyTeamsHistory();
      const teamHistory = normalizeList(historyResponse);
      const currentTeam = getCurrentTeamFromHistory(teamHistory);

      if (!currentTeam) {
        setDashboardData(null);
        setIsLoading(false);
        return;
      }

      const activeTeamId = getTeamId(currentTeam);
      let dashData = { ...currentTeam };

      try {
        const infoRes = await teamApi.getTeamDashboard(activeTeamId);
        dashData = { ...dashData, ...unwrapData(infoRes) };
      } catch (err) {}

      // ==============================================================
      // VÒNG LẶP DO THÁM: TÌM KIẾM ROUND ID VÀ TRACK ID CỦA TEAM
      // ==============================================================
      let foundRoundId = "";
      let foundTrackId = "";
      let foundEventId = "";
      let foundTopicId = "";

      try {
        const allRoundsRes = await roundApi.getAllRounds();
        const roundsArr = normalizeList(allRoundsRes);

        for (const round of roundsArr) {
          const rId = round.roundID || round.id;
          if (!rId) continue;

          // Gọi API lấy danh sách đội của từng vòng thi
          const detailsRes = await teamApi.getTeamDetailsInRound(rId);
          const detailsList = normalizeList(detailsRes);

          // Dò tìm ID đội của mình trong danh sách đó
          const matchRecord = detailsList.find(
            (item: any) =>
              normalizeId(item.teamId || item.teamID) ===
              normalizeId(activeTeamId),
          );

          if (matchRecord) {
            // Đã bắt được thông tin đội thi
            foundRoundId = rId;
            foundTrackId = matchRecord.trackId || matchRecord.trackID;
            foundTopicId = matchRecord.topicId || matchRecord.topicID;
            foundEventId = round.eventID || round.eventId;
            setCurrentRoundName(round.roundName || "");

            // Gắn vào dashData để UI hiển thị
            dashData.teamInRound = matchRecord;
            dashData.status = matchRecord.status || dashData.status;
            dashData.score = matchRecord.score;
            break; // Tìm thấy thì dừng
          }
        }
      } catch (e) {
        console.warn("Lỗi rà soát teamInRound:", e);
      }

      setDashboardData(dashData);

      // ==============================================================
      // GỌI LEADERBOARD DETAIL NGAY LẬP TỨC NẾU TÌM THẤY ID
      // ==============================================================
      if (foundRoundId && foundTrackId) {
        try {
          setIsLoadingLeaderboard(true);
          const resDetail = await leaderboardApi.getLeaderboardDetail(
            foundRoundId,
            foundTrackId,
          );
          const lbData = normalizeList(resDetail);

          const validTeams = lbData.filter(
            (t: any) => extractTeamName(t) !== "Unknown",
          );
          validTeams.sort((a, b) => extractScore(b) - extractScore(a));

          setLeaderboard(validTeams);
        } catch (err: any) {
          console.error("Lỗi lấy Leaderboard Detail:", err);
          setLeaderboard([]);
        } finally {
          setIsLoadingLeaderboard(false);
        }
      } else {
        // Đội chưa đăng ký thi vòng nào
        setIsLoadingLeaderboard(false);
      }

      // ==============================================================
      // TẢI DỮ LIỆU DROPDOWN CHO FORM ĐĂNG KÝ
      // ==============================================================
      try {
        const eventsRes = await teamApi.getActiveEvents();
        setEvents(normalizeList(eventsRes));
      } catch (error) {}

      if (foundEventId) {
        setSelectedEvent(String(foundEventId));
        try {
          const tRes = await teamApi.getTracksByEvent(String(foundEventId));
          setTracks(normalizeList(tRes));
        } catch (e) {}
      }
      if (foundTrackId) {
        setSelectedTrack(String(foundTrackId));
        try {
          const tpRes = await teamApi.getTopicsByTrack(String(foundTrackId));
          setTopics(normalizeList(tpRes));
        } catch (e) {}
      }
      if (foundTopicId) setSelectedTopic(String(foundTopicId));

      // Mốc thời gian Đếm ngược
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
          }
        }
      } catch (e: any) {
        setDeadline(null);
      }
    } catch (error: any) {
      console.error("Lỗi load Dashboard:", error);
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

  const teamId = getTeamId(dashboardData);
  const currentUserIsLeader = isLeaderTeam(dashboardData);
  const hasSubmittedRegistration = Boolean(
    dashboardData?.eventID ||
    dashboardData?.eventId ||
    dashboardData?.trackID ||
    dashboardData?.trackId ||
    dashboardData?.topicID ||
    dashboardData?.topicId ||
    dashboardData?.teamInRound,
  );
  const isActuallySubmitted =
    hasSubmittedRegistration ||
    localStorage.getItem(`team_${teamId}_submitted`) === "true";

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
        "Are you sure you want to register with this Event, Track, and Topic? You cannot change this later.",
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
      await fetchDashboard();

      Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: "Your team has successfully registered.",
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.response?.data?.message || "Server Error.",
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
    <div className="animate-in fade-in duration-500 max-w-5xl">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
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
          <section className="bg-card border border-border rounded-radius-lg p-6 shadow-sm">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Current Round Countdown
            </h2>

            {deadline ? (
              timeLeft.isExpired ? (
                <div className="bg-red-50 border border-red-200 text-red-600 font-bold px-4 py-3 rounded-radius-md inline-flex items-center gap-2">
                  ⏳ The submission time for this round has ended!
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
            <div className="bg-white border border-border p-6 rounded-radius-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
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

            <div className="bg-white border border-border p-6 rounded-radius-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileCheck className="w-24 h-24 text-primary" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <p className="text-xl font-bold text-foreground">
                    {safeString(
                      dashboardData?.status || dashboardData?.Status,
                      "Active",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white border border-border rounded-radius-lg overflow-hidden shadow-sm mt-8">
            <div className="p-6 border-b border-border bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Leaderboard
                  {currentRoundName && (
                    <span className="text-sm text-blue-600 ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                      {currentRoundName}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Team rankings in the current Track & Round
                </p>
              </div>
            </div>

            <div className="p-0 max-h-[400px] overflow-y-auto relative">
              {isLoadingLeaderboard ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500 animate-pulse">
                  Loading Leaderboard...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500">
                  {isActuallySubmitted
                    ? "Scores have not been updated for this round yet."
                    : "Your team has not registered for an Event and Track."}
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
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((team, index) => {
                      const currentTeamIdFromData = extractTeamId(team);
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

        {/* ================= RIGHT COLUMN (Ratio 4): REGISTRATION FORM ================= */}
        <div className="lg:col-span-4">
          <section className="bg-slate-50 border border-slate-200 rounded-radius-lg p-6 shadow-sm h-full flex flex-col">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2 shrink-0">
              <Map className="w-4 h-4 text-slate-400" /> Event & Track
            </h2>

            <div className="flex-1 bg-white border border-slate-200 rounded-radius-lg p-6 shadow-sm space-y-5">
              {!teamId ? (
                <div className="bg-slate-50 border border-slate-200 rounded-radius-md p-4">
                  <p className="font-bold text-slate-900">No Team Yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Create a team on the My Team page before registering for an
                    event.
                  </p>
                </div>
              ) : !currentUserIsLeader ? (
                <div className="bg-slate-50 border border-slate-200 rounded-radius-md p-4">
                  <p className="font-bold text-slate-900">
                    Leader Registration Only
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    You are a Team Member. Wait for your Team Leader to select
                    the Event, Track, and Topic.
                  </p>
                </div>
              ) : (
                <>
                  {isActuallySubmitted && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-radius-md p-4 mb-4">
                      <p className="font-bold flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> Registration Locked!
                      </p>
                      <p className="text-sm mt-1">
                        Below is the Event, Track, and Topic your team has
                        registered for.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Event
                    </label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-radius-md text-sm outline-none focus:border-blue-500 disabled:opacity-70 disabled:bg-slate-100 disabled:cursor-not-allowed font-medium text-slate-800"
                      value={selectedEvent}
                      onChange={(e) => handleEventChange(e.target.value)}
                      disabled={isActuallySubmitted}
                    >
                      <option value="">Choose an event...</option>
                      {events.map((event) => {
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
                      disabled={!selectedEvent || isActuallySubmitted}
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
                      disabled={!selectedTrack || isActuallySubmitted}
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

                  {!isActuallySubmitted && (
                    <button
                      onClick={handleSubmitRegistration}
                      disabled={isSubmittingRegistration}
                      className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-radius-md hover:bg-blue-700 transition-colors text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                      <Map className="w-4 h-4" />
                      {isSubmittingRegistration
                        ? "Submitting..."
                        : "Confirm Registration"}
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
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
