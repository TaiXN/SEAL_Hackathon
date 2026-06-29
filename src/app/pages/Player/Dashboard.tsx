import { useEffect, useMemo, useState } from "react";
import { Clock, Trophy, Map, ShieldCheck, FileCheck } from "lucide-react";
import Swal from "sweetalert2";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
import { teamApi } from "../../lib/api/teamApi";

const unwrapData = (value: any) => value?.data ?? value;

const normalizeList = (value: any): any[] => {
  const data = unwrapData(value);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;

  return [];
};

const getCurrentTeamFromHistory = (history: any[]) => {
  return (
    history.find((item) => item?.isActive === true) ||
    history.find((item) => item?.status !== "Deleted") ||
    history[0] ||
    null
  );
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

const isLeaderTeam = (team: any) => {
  const rawRole = String(
    team?.role ||
      team?.teamRole ||
      team?.memberRole ||
      team?.position ||
      "",
  ).toLowerCase();

  return (
    team?.isLeader === true ||
    team?.isLeader === 1 ||
    team?.leader === true ||
    team?.isTeamLeader === true ||
    rawRole.includes("leader")
  );
};

const getEventId = (event: any) => {
  return event?.eventId || event?.eventID || event?.id || "";
};

const getEventName = (event: any) => {
  return event?.eventName || event?.name || event?.title || "Unnamed Event";
};

const getTrackId = (track: any) => {
  return track?.trackId || track?.trackID || track?.id || "";
};

const getTrackEventId = (track: any) => {
  return track?.eventId || track?.eventID || track?.event?.eventId || "";
};

const getTrackName = (track: any) => {
  return track?.trackName || track?.name || "Unnamed Track";
};

const getTopicId = (topic: any) => {
  return topic?.topicId || topic?.topicID || topic?.id || "";
};

const getTopicTrackId = (topic: any) => {
  return topic?.trackId || topic?.trackID || topic?.track?.trackId || "";
};

const getTopicName = (topic: any) => {
  return topic?.topicDetail || topic?.topicName || topic?.name || "Unnamed Topic";
};

const getRankings = (dashboard: any): any[] => {
  return (
    dashboard?.rankings ||
    dashboard?.leaderboard ||
    dashboard?.leaderBoards ||
    dashboard?.teams ||
    []
  );
};

const getTeamRank = (team: any, index: number) => {
  return team?.rank || team?.ranking || index + 1;
};

const getTeamName = (team: any) => {
  return team?.teamName || team?.name || "Unnamed Team";
};

const getTeamScore = (team: any) => {
  return team?.score ?? team?.points ?? team?.totalScore ?? 0;
};

const getPlayerName = (dashboard: any, currentTeam: any) => {
  return (
    dashboard?.playerName ||
    dashboard?.leaderName ||
    dashboard?.currentUser?.fullName ||
    dashboard?.currentUser?.name ||
    currentTeam?.playerName ||
    currentTeam?.studentName ||
    currentTeam?.fullName ||
    "Player"
  );
};

const getDeadlineValue = (countdown: any) => {
  return (
    countdown?.deadline ||
    countdown?.targetDate ||
    countdown?.endDate ||
    countdown?.trackSelectionDeadline ||
    null
  );
};

const getStatusLabel = (dashboard: any) => {
  return (
    dashboard?.status ||
    dashboard?.trackStatus ||
    dashboard?.teamStatus ||
    "Pending approval"
  );
};

const getSelectedTrackId = (dashboard: any) => {
  return (
    dashboard?.selectedTrackId ||
    dashboard?.selectedTrackID ||
    dashboard?.trackId ||
    dashboard?.trackID ||
    dashboard?.selectedTrack?.trackId ||
    dashboard?.selectedTrack?.trackID ||
    dashboard?.selectedTrack?.id ||
    ""
  );
};

const getSelectedTrackName = (dashboard: any) => {
  return (
    dashboard?.selectedTrackName ||
    dashboard?.trackName ||
    dashboard?.selectedTrack?.trackName ||
    dashboard?.selectedTrack?.name ||
    ""
  );
};

const getSelectedTopicId = (dashboard: any) => {
  return (
    dashboard?.selectedTopicId ||
    dashboard?.selectedTopicID ||
    dashboard?.topicId ||
    dashboard?.topicID ||
    dashboard?.selectedTopic?.topicId ||
    dashboard?.selectedTopic?.topicID ||
    dashboard?.selectedTopic?.id ||
    ""
  );
};

const getSelectedTopicName = (dashboard: any) => {
  return (
    dashboard?.selectedTopicName ||
    dashboard?.topicName ||
    dashboard?.topicDetail ||
    dashboard?.selectedTopic?.topicDetail ||
    dashboard?.selectedTopic?.topicName ||
    dashboard?.selectedTopic?.name ||
    ""
  );
};

export function Dashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [teamId, setTeamId] = useState("");
  const [countdown, setCountdown] = useState<any>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);

  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRegistration, setIsSubmittingRegistration] =
    useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    isDestructive: boolean;
    hideCancel: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "",
    isDestructive: false,
    hideCancel: false,
    onConfirm: () => {},
  });

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);

      const historyResponse = await teamApi.getMyTeamsHistory();
      const teamHistory = normalizeList(historyResponse);
      const activeTeam = getCurrentTeamFromHistory(teamHistory);
      const activeTeamId = getTeamId(activeTeam);

      setCurrentTeam(activeTeam);
      setTeamId(activeTeamId);

      if (!activeTeam || !activeTeamId) {
        setDashboard({
          noTeam: true,
          status: "Bạn chưa có team",
          rankings: [],
          currentUserIsLeader: false,
        });
        setCountdown(null);
        return;
      }

      const currentUserIsLeader = isLeaderTeam(activeTeam);

      const [dashboardResponse, countdownResponse, eventsResponse] =
        await Promise.allSettled([
          teamApi.getTeamDashboard(activeTeamId),
          teamApi.getCountdown(activeTeamId),
          teamApi.getActiveEvents(),
        ]);

      const dashboardData =
        dashboardResponse.status === "fulfilled"
          ? unwrapData(dashboardResponse.value)
          : {};

      const countdownData =
        countdownResponse.status === "fulfilled"
          ? unwrapData(countdownResponse.value)
          : null;

      const eventList =
        eventsResponse.status === "fulfilled"
          ? normalizeList(eventsResponse.value)
          : [];

      setEvents(eventList);
      setTracks([]);
      setTopics([]);

      // const trackList =
      //   tracksResponse.status === "fulfilled"
      //     ? normalizeList(tracksResponse.value)
      //     : [];

      // const topicList =
      //   topicsResponse.status === "fulfilled"
      //     ? normalizeList(topicsResponse.value)
      //     : [];

      setDashboard({
        ...dashboardData,
        currentUserIsLeader,
      });

      setCountdown(countdownData);
      setEvents(eventList);
      setTracks([]);
      setTopics([]);

      const currentSelectedTrackId = getSelectedTrackId(dashboardData);
      const currentSelectedTopicId = getSelectedTopicId(dashboardData);

      if (currentSelectedTrackId) {
        setSelectedTrack(String(currentSelectedTrackId));
      }

      if (currentSelectedTopicId) {
        setSelectedTopic(String(currentSelectedTopicId));
      }
    } catch (error: any) {
      console.error("Load player dashboard failed:", error);

      Swal.fire({
        icon: "error",
        title: "Không tải được dashboard",
        text:
          error.response?.data?.message ||
          error.response?.data ||
          "Không thể lấy dữ liệu dashboard từ backend.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const currentUserIsLeader = Boolean(dashboard?.currentUserIsLeader);
  const selectedTrackName = getSelectedTrackName(dashboard);
  const selectedTopicName = getSelectedTopicName(dashboard);
  const selectedTrackIdFromDashboard = getSelectedTrackId(dashboard);
  const selectedTopicIdFromDashboard = getSelectedTopicId(dashboard);

  const hasSubmittedRegistration = Boolean(
    selectedTrackName ||
      selectedTopicName ||
      selectedTrackIdFromDashboard ||
      selectedTopicIdFromDashboard,
  );

  const filteredTracks = useMemo(() => {
    if (!selectedEvent) return [];

    return tracks.filter((track) => {
      const trackEventId = getTrackEventId(track);

      if (!trackEventId) return true;

      return String(trackEventId) === String(selectedEvent);
    });
  }, [tracks, selectedEvent]);

  const filteredTopics = useMemo(() => {
    if (!selectedTrack) return [];

    return topics.filter((topic) => {
      const topicTrackId = getTopicTrackId(topic);

      if (!topicTrackId) return true;

      return String(topicTrackId) === String(selectedTrack);
    });
  }, [topics, selectedTrack]);

  const rankings = getRankings(dashboard);
  const playerName = getPlayerName(dashboard, currentTeam);
  const deadlineValue = getDeadlineValue(countdown);
  const statusLabel = getStatusLabel(dashboard);
  const targetDate = deadlineValue ? new Date(deadlineValue) : null;

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
    } catch (error) {
      console.error("Load tracks by event failed:", error);

      Swal.fire({
        icon: "error",
        title: "Không tải được Track",
        text: "Không thể lấy danh sách track của event này.",
      });
    }
  };

  const handleTrackChange = async (trackId: string) => {
    setSelectedTrack(trackId);
    setSelectedTopic("");
    setTopics([]);

    if (!trackId) return;

    try {
      const response = await teamApi.getTopicsByTrack(trackId);
      setTopics(normalizeList(response));
    } catch (error) {
      console.error("Load topics by track failed:", error);

      Swal.fire({
        icon: "error",
        title: "Không tải được Topic",
        text: "Không thể lấy danh sách topic của track này.",
      });
    }
  };

  const executeSubmitRegistration = async () => {
    try {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));

      if (!teamId) {
        Swal.fire({
          icon: "warning",
          title: "Bạn chưa có team",
          text: "Hãy tạo team trước khi đăng ký tham gia.",
        });
        return;
      }

      setIsSubmittingRegistration(true);

      await teamApi.submitRegistration(teamId, {
        eventId: selectedEvent,
        trackId: selectedTrack,
        topicId: selectedTopic,
      });

      await fetchDashboard();

      Swal.fire({
        icon: "success",
        title: "Đăng ký thành công",
        text: "Team đã đăng ký Track và Topic thành công.",
      });
    } catch (error: any) {
      console.error("Submit registration failed:", error);

      Swal.fire({
        icon: "error",
        title: "Không thể đăng ký",
        text:
          error.response?.data?.message ||
          error.response?.data ||
          "Backend từ chối thao tác đăng ký.",
      });
    } finally {
      setIsSubmittingRegistration(false);
    }
  };

  const handleSubmitRegistration = () => {
    if (!selectedEvent) {
      setModalConfig({
        isOpen: true,
        title: "Event Required",
        description: "Vui lòng chọn Event trước.",
        confirmText: "OK",
        isDestructive: true,
        hideCancel: true,
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    if (!selectedTrack) {
      setModalConfig({
        isOpen: true,
        title: "Track Required",
        description: "Vui lòng chọn Track trước.",
        confirmText: "OK",
        isDestructive: true,
        hideCancel: true,
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    if (!selectedTopic) {
      setModalConfig({
        isOpen: true,
        title: "Topic Required",
        description: "Vui lòng chọn Topic trước.",
        confirmText: "OK",
        isDestructive: true,
        hideCancel: true,
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    setModalConfig({
      isOpen: true,
      title: "Confirm Registration",
      description:
        "Xác nhận đăng ký Track và Topic này cho team? API submit chỉ gửi trackId và topicId.",
      confirmText: "Yes, Register",
      isDestructive: false,
      hideCancel: false,
      onConfirm: () => {
        void executeSubmitRegistration();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 relative">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Team Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Đang tải dữ liệu dashboard...
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Welcome back, {playerName}.
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Team tạo trước. Team Leader sẽ chọn Event, Track và Topic để đăng ký tham gia.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-primary text-primary-foreground rounded-radius-lg p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white opacity-5 rounded-full blur-xl"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center gap-2 mb-8">
                <Clock className="w-5 h-5 text-primary-foreground/80" />
                <span className="font-bold text-primary-foreground/90 uppercase tracking-wider text-sm">
                  Registration Deadline
                </span>
              </div>

              {targetDate ? (
                <CountdownTimer targetDate={targetDate} />
              ) : (
                <p className="text-primary-foreground/80 font-semibold">
                  Backend chưa trả deadline/countdown.
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 pb-2">
            <h2 className="text-xl font-bold mb-6 text-foreground">
              Event Registration Flow
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FlowStep
                number="1"
                title="Select Event"
                active
                done={Boolean(selectedEvent)}
              />

              <FlowStep
                number="2"
                title="Select Track"
                active={Boolean(selectedEvent)}
                done={Boolean(selectedTrack)}
              />

              <FlowStep
                number="3"
                title="Select Topic"
                active={Boolean(selectedTrack)}
                done={Boolean(selectedTopic)}
              />
            </div>

            <div className="mt-6 bg-card border border-border rounded-radius-lg p-6 shadow-sm space-y-5">
              {hasSubmittedRegistration ? (
                <div className="bg-chart-2/10 border border-chart-2/20 text-chart-2 rounded-radius-md p-4">
                  <p className="font-bold">Team đã đăng ký</p>
                  <p className="text-sm mt-1">
                    Track: {selectedTrackName || selectedTrackIdFromDashboard || "N/A"}
                  </p>
                  <p className="text-sm">
                    Topic: {selectedTopicName || selectedTopicIdFromDashboard || "N/A"}
                  </p>
                  <p className="text-sm mt-1">Status: {statusLabel}</p>
                </div>
              ) : !teamId ? (
                <div className="bg-muted/30 border border-border rounded-radius-md p-4">
                  <p className="font-bold text-foreground">Bạn chưa có team</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hãy tạo team ở trang My Team trước khi đăng ký tham gia event.
                  </p>
                </div>
              ) : !currentUserIsLeader ? (
                <div className="bg-muted/30 border border-border rounded-radius-md p-4">
                  <p className="font-bold text-foreground">
                    Chỉ Team Leader mới được đăng ký
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bạn đang là Team Member. Hãy chờ Team Leader chọn Event, Track và Topic.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Event
                    </label>
                    <select
                      className="w-full p-3 bg-input-background border border-border rounded-radius-md text-sm outline-none focus:border-primary"
                      value={selectedEvent}
                      onChange={(e) => handleEventChange(e.target.value)}
                    >
                      <option value="">Choose an event...</option>

                      {events.map((event) => {
                        const eventId = String(getEventId(event));
                        const eventName = getEventName(event);

                        return (
                          <option key={eventId || eventName} value={eventId}>
                            {eventName}
                          </option>
                        );
                      })}
                    </select>

                    {events.length === 0 && (
                      <p className="text-xs text-destructive font-bold">
                        Backend chưa trả danh sách event hoặc player chưa có quyền gọi /api/Event.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Track
                    </label>
                    <select
                      className="w-full p-3 bg-input-background border border-border rounded-radius-md text-sm outline-none focus:border-primary disabled:opacity-50"
                      value={selectedTrack}
                      onChange={(e) => handleTrackChange(e.target.value)}
                      disabled={!selectedEvent}
                    >
                      <option value="">Choose a track...</option>

                      {filteredTracks.map((track) => {
                        const trackId = String(getTrackId(track));
                        const trackName = getTrackName(track);

                        return (
                          <option key={trackId || trackName} value={trackId}>
                            {trackName}
                          </option>
                        );
                      })}
                    </select>

                    {selectedEvent && filteredTracks.length === 0 && (
                      <p className="text-xs text-destructive font-bold">
                        Event này chưa có track hoặc dữ liệu Track không có eventId để lọc.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Topic
                    </label>
                    <select
                      className="w-full p-3 bg-input-background border border-border rounded-radius-md text-sm outline-none focus:border-primary disabled:opacity-50"
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      disabled={!selectedTrack}
                    >
                      <option value="">Choose a topic...</option>

                      {filteredTopics.map((topic) => {
                        const topicId = String(getTopicId(topic));
                        const topicName = getTopicName(topic);

                        return (
                          <option key={topicId || topicName} value={topicId}>
                            {topicName}
                          </option>
                        );
                      })}
                    </select>

                    {selectedTrack && filteredTopics.length === 0 && (
                      <p className="text-xs text-destructive font-bold">
                        Track này chưa có topic hoặc dữ liệu Topic không có trackId để lọc.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleSubmitRegistration}
                    disabled={isSubmittingRegistration}
                    className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-radius-md hover:opacity-90 transition-opacity text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Map className="w-4 h-4" />
                    {isSubmittingRegistration ? "Đang đăng ký..." : "Submit Registration"}
                  </button>

                  <p className="text-xs font-bold text-muted-foreground text-center uppercase tracking-wide">
                    Submit API chỉ gửi trackId và topicId. Event dùng để lọc Track trên UI.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-radius-lg flex flex-col h-full overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
                <Trophy className="w-5 h-5 text-primary" />
                Live Rankings
              </h2>
            </div>

            <div className="flex-1 p-6 space-y-4 flex flex-col">
              <div className="flex text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 border-b border-border/50 pb-2">
                <div className="w-12">Rank</div>
                <div className="flex-1">Team Name</div>
                <div className="text-right w-20">Score</div>
              </div>

              <div className="space-y-1">
                {rankings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Backend chưa trả dữ liệu leaderboard.
                  </p>
                ) : (
                  rankings.map((team: any, index: number) => {
                    const rank = getTeamRank(team, index);
                    const name = getTeamName(team);
                    const score = getTeamScore(team);

                    return (
                      <div
                        key={team?.teamId || team?.id || `${name}-${index}`}
                        className={`flex items-center p-3 rounded-radius-md transition-colors ${
                          rank === 1
                            ? "bg-primary/5 border border-primary/20"
                            : rank === 2
                              ? "bg-muted/50 border border-transparent"
                              : rank === 3
                                ? "bg-muted/30 border border-transparent"
                                : "hover:bg-muted/20 border border-transparent"
                        }`}
                      >
                        <div className="w-12 font-bold">
                          {rank === 1 ? (
                            <span className="text-chart-2">#1</span>
                          ) : rank === 2 ? (
                            <span className="text-muted-foreground">#2</span>
                          ) : rank === 3 ? (
                            <span className="text-destructive/70">#3</span>
                          ) : (
                            <span className="text-muted-foreground">
                              #{rank}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 font-semibold text-foreground text-sm">
                          {name}
                        </div>

                        <div className="text-right w-20 font-mono text-sm font-bold text-primary">
                          {score}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border text-center bg-muted/10">
              <button
                type="button"
                className="text-sm text-primary font-bold transition-colors opacity-60 cursor-not-allowed"
                disabled
              >
                View All Team Names
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText={modalConfig.confirmText}
        isDestructive={modalConfig.isDestructive}
        hideCancel={modalConfig.hideCancel}
      />
    </div>
  );
}

function FlowStep({
  number,
  title,
  active,
  done,
}: {
  number: string;
  title: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`border rounded-radius-lg p-5 bg-card ${
        active ? "border-primary" : "border-border opacity-60"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
            done
              ? "bg-chart-2 text-primary-foreground"
              : active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {done ? <FileCheck className="w-5 h-5" /> : number}
        </div>

        <span className="font-bold text-foreground">{title}</span>
      </div>
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-4 sm:gap-8 items-center">
      <TimeUnit value={timeLeft.days} label="Days" />
      <TimeDivider />
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <TimeDivider />
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <TimeDivider hiddenOnSmall />
      <TimeUnit value={timeLeft.seconds} label="Seconds" hiddenOnSmall />
    </div>
  );
}

function calculateTimeLeft(targetDate: Date) {
  const difference = targetDate.getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
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
      <span className="text-5xl sm:text-7xl font-bold font-mono tracking-tighter drop-shadow-sm">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-primary-foreground/80 text-sm font-bold mt-1 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

function TimeDivider({ hiddenOnSmall = false }: { hiddenOnSmall?: boolean }) {
  return (
    <div
      className={`text-4xl sm:text-6xl font-light text-primary-foreground/30 -mt-6 ${hiddenOnSmall ? "hidden sm:block" : "block"}`}
    >
      :
    </div>
  );
}