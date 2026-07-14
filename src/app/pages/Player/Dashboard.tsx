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
import apiClient from "../../lib/api/apiClient";
import { useAuthStore } from "../../stores/auth.store";
import { jwtDecode } from "jwt-decode";

// ==========================================
// 1. CÁC HÀM TIỆN ÍCH (HELPER FUNCTIONS)
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

const getTeamId = (team: any) => {
  return (
    team?.teamId ||
    team?.teamID ||
    team?.id ||
    team?.team?.teamId ||
    team?.team?.teamID ||
    ""
  );
};

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

  if (defaultTeam) {
    localStorage.setItem("activeTeamId", getTeamId(defaultTeam));
  }
  return defaultTeam;
};

const isLeaderTeam = (team: any) => {
  const rawRole = String(
    team?.role || team?.teamRole || team?.memberRole || team?.position || "",
  ).toLowerCase();
  return (
    team?.isLeader === true ||
    team?.isLeader === 1 ||
    team?.leader === true ||
    team?.isTeamLeader === true ||
    rawRole === "leader" ||
    rawRole === "team leader" ||
    rawRole === "teamleader"
  );
};

const getEventId = (event: any) =>
  event?.id || event?.eventId || event?.eventID || "";
const getEventName = (event: any) =>
  event?.name || event?.eventName || event?.EventName || "Unnamed Event";
const getTrackId = (track: any) =>
  track?.trackID || track?.trackId || track?.id || "";
const getTrackName = (track: any) =>
  track?.trackName || track?.name || "Unnamed Track";
const getTopicId = (topic: any) =>
  topic?.topicID || topic?.topicId || topic?.id || "";
const getTopicName = (topic: any) =>
  topic?.topicDetail || topic?.topicName || topic?.name || "Unnamed Topic";

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

  const [events, setEvents] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isSubmittingRegistration, setIsSubmittingRegistration] =
    useState(false);

  // Leaderboard States
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
  });

  const [deadline, setDeadline] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);

      const historyResponse = await teamApi.getMyTeamsHistory();
      const teamHistory = normalizeList(historyResponse);
      const currentTeam = getCurrentTeamFromHistory(teamHistory);

      if (!currentTeam) {
        setDashboardData(null);
        return;
      }

      const activeTeamId = getTeamId(currentTeam);
      let dashData = currentTeam;

      try {
        const dashRes = await teamApi.getTeamDashboard(activeTeamId);
        dashData = { ...currentTeam, ...unwrapData(dashRes) };
      } catch (err) {
        console.warn(
          "Không lấy được chi tiết Dashboard, dùng dữ liệu Team History",
        );
      }

      setDashboardData(dashData);

      try {
        const eventsRes = await teamApi.getActiveEvents();
        setEvents(normalizeList(eventsRes));
      } catch (error) {
        console.error("Lỗi lấy danh sách events:", error);
      }

      const currentSelectedTrackId =
        dashData?.trackID ||
        dashData?.trackId ||
        dashData?.teamInRound?.trackId;
      const currentSelectedTopicId =
        dashData?.topicID ||
        dashData?.topicId ||
        dashData?.teamInRound?.topicId;

      if (currentSelectedTrackId)
        setSelectedTrack(String(currentSelectedTrackId));
      if (currentSelectedTopicId)
        setSelectedTopic(String(currentSelectedTopicId));

      if (!currentSelectedTrackId && !currentSelectedTopicId) {
        const savedEvent =
          localStorage.getItem(`team_${activeTeamId}_event`) ||
          sessionStorage.getItem("draftEvent");
        const savedTrack =
          localStorage.getItem(`team_${activeTeamId}_track`) ||
          sessionStorage.getItem("draftTrack");
        const savedTopic =
          localStorage.getItem(`team_${activeTeamId}_topic`) ||
          sessionStorage.getItem("draftTopic");

        if (savedEvent) {
          setSelectedEvent(savedEvent);
          try {
            const trackRes = await teamApi.getTracksByEvent(savedEvent);
            setTracks(normalizeList(trackRes));
          } catch (e) {}
        }
        if (savedTrack) {
          setSelectedTrack(savedTrack);
          try {
            const topicRes = await teamApi.getTopicsByTrack(savedTrack);
            setTopics(normalizeList(topicRes));
          } catch (e) {}
        }
        if (savedTopic) setSelectedTopic(savedTopic);
      }

      // ==========================================
      // LẤY LEADERBOARD VÀ LỌC RÁC
      // ==========================================
      try {
        setIsLoadingLeaderboard(true);
        let lbData = [];

        const rId =
          dashData?.teamInRound?.roundId ||
          dashData?.roundID ||
          dashData?.roundId;
        const tId =
          dashData?.teamInRound?.trackId ||
          dashData?.trackID ||
          dashData?.trackId;

        // Nếu team đã đăng ký và có roundId, trackId thì lấy leaderbard chi tiết.
        // Còn không thì lấy cái general
        if (rId && tId) {
          const res = await apiClient.get(`/api/LeaderBoard/${rId}/${tId}`);
          lbData = normalizeList(res);
        } else {
          const res = await apiClient.get(`/api/LeaderBoard`);
          lbData = normalizeList(res);
        }

        // BỘ LỌC RÁC: Chỉ giữ lại những object thực sự có tên đội
        const validTeams = lbData.filter(
          (team: any) => team && (team.teamName || team.name || team.TeamName),
        );

        // Sort giảm dần theo điểm
        const sortedData = validTeams.sort((a, b) => {
          const scoreA = a.score || a.Score || a.totalScore || 0;
          const scoreB = b.score || b.Score || b.totalScore || 0;
          return scoreB - scoreA;
        });

        // Bỏ .slice(0,5) để lấy toàn bộ danh sách đội thi
        setLeaderboard(sortedData);
      } catch (e) {
        console.warn("Lỗi load Leaderboard:", e);
        setLeaderboard([]);
      } finally {
        setIsLoadingLeaderboard(false);
      }

      // ĐẾM NGƯỢC
      try {
        const countdownRes = await teamApi.getCountdown(activeTeamId);
        let dateStr = null;
        if (typeof countdownRes === "string") {
          dateStr = countdownRes;
        } else if (countdownRes && typeof countdownRes === "object") {
          dateStr =
            countdownRes.endDate ||
            countdownRes.targetDate ||
            countdownRes.deadline ||
            countdownRes.endTime ||
            countdownRes.data ||
            countdownRes.time;
        }

        if (dateStr) {
          const dl = new Date(dateStr);
          if (!isNaN(dl.getTime())) {
            setDeadline(dl);
            setTimeLeft(calculateTimeLeft(dl));
          } else {
            setDeadline(null);
          }
        } else {
          setDeadline(null);
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
    dashboardData?.trackID ||
    dashboardData?.topicID ||
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

    if (eventId) sessionStorage.setItem("draftEvent", eventId);
    else sessionStorage.removeItem("draftEvent");
    sessionStorage.removeItem("draftTrack");
    sessionStorage.removeItem("draftTopic");

    if (!eventId) return;

    try {
      const response = await teamApi.getTracksByEvent(eventId);
      setTracks(normalizeList(response));
    } catch (error) {
      console.error("Lỗi lấy track:", error);
    }
  };

  const handleTrackChange = async (trackId: string) => {
    setSelectedTrack(trackId);
    setSelectedTopic("");
    setTopics([]);

    if (trackId) sessionStorage.setItem("draftTrack", trackId);
    else sessionStorage.removeItem("draftTrack");
    sessionStorage.removeItem("draftTopic");

    if (!trackId) return;

    try {
      const response = await teamApi.getTopicsByTrack(trackId);
      setTopics(normalizeList(response));
    } catch (error) {
      console.error("Lỗi lấy topic:", error);
    }
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    if (topicId) sessionStorage.setItem("draftTopic", topicId);
    else sessionStorage.removeItem("draftTopic");
  };

  const handleSubmitRegistration = () => {
    if (!selectedEvent || !selectedTrack || !selectedTopic) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng chọn đầy đủ Event, Track và Topic.",
      });
      return;
    }
    setModalConfig({
      isOpen: true,
      title: "Xác nhận đăng ký",
      description:
        "Bạn có chắc chắn với lựa chọn Event, Track và Topic này không? Sau khi submit sẽ không thể tự thay đổi.",
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

      localStorage.setItem(`team_${teamId}_event`, selectedEvent);
      localStorage.setItem(`team_${teamId}_track`, selectedTrack);
      localStorage.setItem(`team_${teamId}_topic`, selectedTopic);
      localStorage.setItem(`team_${teamId}_submitted`, "true");

      sessionStorage.removeItem("draftEvent");
      sessionStorage.removeItem("draftTrack");
      sessionStorage.removeItem("draftTopic");

      await fetchDashboard();

      Swal.fire({
        icon: "success",
        title: "Đăng ký thành công",
        text: "Team đã đăng ký Event, Track và Topic thành công.",
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Không thể đăng ký",
        text: error.response?.data?.message || "Lỗi hệ thống từ Backend.",
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
            Welcome back, {loggedInName}.
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Đang tải dữ liệu Dashboard...
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Welcome back, {loggedInName}.
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Team tạo trước. Team Leader sẽ chọn Event, Track và Topic để đăng ký
          tham gia.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-card border border-border rounded-radius-lg p-6 shadow-sm">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Vòng thi hiện tại
              (Countdown)
            </h2>

            {deadline ? (
              timeLeft.isExpired ? (
                <div className="bg-red-50 border border-red-200 text-red-600 font-bold px-4 py-3 rounded-radius-md inline-flex items-center gap-2">
                  ⏳ Thời gian nộp bài của vòng thi này đã kết thúc!
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
                Chưa có thông tin đếm ngược (Countdown) cho vòng thi này.
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
                  {dashboardData?.teamName ||
                    dashboardData?.name ||
                    "Chưa có team"}
                </p>
                {dashboardData?.score !== undefined &&
                  dashboardData?.score !== null && (
                    <p className="text-sm font-medium text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded-md border border-emerald-200">
                      Điểm hiện tại: {dashboardData.score}
                    </p>
                  )}
              </div>
            </div>

            <div className="bg-white border border-border p-6 rounded-radius-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileCheck className="w-24 h-24 text-primary" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Trạng thái
                </p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <p className="text-xl font-bold text-foreground">
                    {dashboardData?.status || "Active"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white border border-border rounded-radius-lg overflow-hidden shadow-sm mt-8">
            <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Bảng xếp hạng
                  Vòng thi
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Vị trí của các đội trong cùng Track & Round hiện tại
                </p>
              </div>
            </div>

            <div className="p-0 max-h-[400px] overflow-y-auto relative">
              {isLoadingLeaderboard ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500 animate-pulse">
                  Đang tải bảng xếp hạng...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500">
                  Chưa có dữ liệu bảng xếp hạng từ Giám khảo.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-16 text-center">
                        Hạng
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Đội thi
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                        Tổng điểm
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((team, index) => {
                      const isMyTeam =
                        team.teamId === teamId || team.id === teamId;
                      const rank = index + 1;
                      const score =
                        team.score ?? team.Score ?? team.totalScore ?? 0;

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
                          className={`transition-colors hover:bg-slate-50 ${isMyTeam ? "bg-blue-50/50" : ""}`}
                        >
                          <td className="px-6 py-4 text-center align-middle">
                            {rankNode}
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <span
                              className={`font-semibold ${isMyTeam ? "text-blue-700" : "text-slate-800"}`}
                            >
                              {team.teamName ||
                                team.name ||
                                team.TeamName ||
                                "Ẩn danh"}
                            </span>
                            {isMyTeam && (
                              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white border border-blue-700">
                                Đội của bạn
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
                              {score} pts
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

        <div className="lg:col-span-4">
          <section className="bg-slate-50 border border-slate-200 rounded-radius-lg p-6 shadow-sm h-full flex flex-col">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2 shrink-0">
              <Map className="w-4 h-4 text-slate-400" /> Event & Track
            </h2>

            <div className="flex-1 bg-white border border-slate-200 rounded-radius-lg p-6 shadow-sm space-y-5">
              {!teamId ? (
                <div className="bg-slate-50 border border-slate-200 rounded-radius-md p-4">
                  <p className="font-bold text-slate-900">Bạn chưa có team</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Hãy tạo team ở trang My Team trước khi đăng ký tham gia
                    event.
                  </p>
                </div>
              ) : !currentUserIsLeader ? (
                <div className="bg-slate-50 border border-slate-200 rounded-radius-md p-4">
                  <p className="font-bold text-slate-900">
                    Chỉ Team Leader mới được đăng ký
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Bạn đang là Team Member. Hãy chờ Team Leader chọn Event,
                    Track và Topic.
                  </p>
                </div>
              ) : (
                <>
                  {isActuallySubmitted && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-radius-md p-4 mb-4">
                      <p className="font-bold flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> Đã chốt đăng ký!
                      </p>
                      <p className="text-sm mt-1">
                        Dưới đây là thông tin Event, Track và Topic mà team bạn
                        đã chọn.
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
                      {events.map((event) => (
                        <option
                          key={getEventId(event)}
                          value={getEventId(event)}
                        >
                          {getEventName(event)}
                        </option>
                      ))}
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
                      {tracks.map((track) => (
                        <option
                          key={getTrackId(track)}
                          value={getTrackId(track)}
                        >
                          {getTrackName(track)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Topic
                    </label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-radius-md text-sm outline-none focus:border-blue-500 disabled:opacity-70 disabled:bg-slate-100 disabled:cursor-not-allowed font-medium text-slate-800"
                      value={selectedTopic}
                      onChange={(e) => handleTopicChange(e.target.value)}
                      disabled={!selectedTrack || isActuallySubmitted}
                    >
                      <option value="">Choose a topic...</option>
                      {topics.map((topic) => (
                        <option
                          key={getTopicId(topic)}
                          value={getTopicId(topic)}
                        >
                          {getTopicName(topic)}
                        </option>
                      ))}
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
                        ? "Đang đăng ký..."
                        : "Xác nhận đăng ký tham gia"}
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
        confirmText="Xác nhận đăng ký"
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
      className={`flex flex-col items-center ${hiddenOnSmall ? "hidden sm:flex" : "flex"}`}
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
      className={`text-4xl sm:text-6xl font-light text-slate-300 pb-6 sm:pb-8 ${hiddenOnSmall ? "hidden sm:block" : "block"}`}
    >
      :
    </div>
  );
}
