import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BookOpenCheck,
  FilterX,
  ExternalLink,
  Eye,
  Hexagon,
  Mail,
  Search,
  PlayCircle,
  CheckCircle2,
  ListTodo,
  FileX,
  RefreshCw,
  UsersRound,
  X,
} from "lucide-react";
import { showApiError } from "../../lib/utils/apiError";
import { jwtDecode } from "jwt-decode";
import { judgeApi } from "../../lib/api/judgeApi";
import {
  mentorApi,
  type MentorAssignedTeam,
  type MentorTeamDetail,
} from "../../lib/api/mentorApi";
import { useAuthStore } from "../../stores/auth.store";

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

const hasSubmissionLink = (detail: MentorTeamDetail | null) =>
  Boolean(detail?.urlGithub || detail?.urlDemo || detail?.urlSlide);

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

const getJudgeAssignmentId = (team: any) =>
  team?.teamInRoundId || team?.teamInRoundID || team?.teamId || "";

const getJudgeSubmissionId = (team: any) =>
  team?.submissionId || team?.submissionID || "";

const isJudgeSubmissionAvailable = (team: any) =>
  Boolean(
    getJudgeSubmissionId(team) ||
    team?.urlGithub ||
    team?.urlDemo ||
    team?.urlSlide,
  );

const isJudgeEvaluated = (team: any) =>
  Boolean(
    team?.evaluationId ||
    team?.evaluationID ||
    (team?.score !== null && team?.score !== undefined),
  );

const uniqueOptions = (items: any[], key: string) =>
  Array.from(
    new Set(
      items
        .map((item) => item?.[key])
        .filter((value) => typeof value === "string" && value.trim())
        .map((value) => value.trim()),
    ),
  ).sort((a, b) => a.localeCompare(b));

const getJudgeStatus = (team: any) => {
  if (!isJudgeSubmissionAvailable(team)) return "not-submitted";
  if (isJudgeEvaluated(team)) return "scored";
  return "pending";
};

export function JudgeDashboard() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [judgeEventFilter, setJudgeEventFilter] = useState("");
  const [judgeTrackFilter, setJudgeTrackFilter] = useState("");
  const [judgeRoundFilter, setJudgeRoundFilter] = useState("");
  const [judgeStatusFilter, setJudgeStatusFilter] = useState("");
  const [selectedJudgeTeam, setSelectedJudgeTeam] = useState<any | null>(null);
  const [mentorTeams, setMentorTeams] = useState<MentorAssignedTeam[]>([]);
  const [isMentorLoading, setIsMentorLoading] = useState(true);
  const [mentorSearchTerm, setMentorSearchTerm] = useState("");
  const [mentorEventFilter, setMentorEventFilter] = useState("");
  const [mentorTrackFilter, setMentorTrackFilter] = useState("");
  const [selectedMentorTeam, setSelectedMentorTeam] =
    useState<MentorAssignedTeam | null>(null);
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

  useEffect(() => {
    const fetchTeams = async () => {
      if (!currentTeacherId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await judgeApi.getAssignedTeams(currentTeacherId);
        setTeams(res);
      } catch (error: any) {
        console.error("Failed to load assigned teams:", error);
        showApiError(error, {
          action: "load your scoring list",
          hint: "If this keeps happening, ask an admin to check that you are assigned to a track.",
        });
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [currentTeacherId]);

  const loadMentorTeams = async () => {
    if (!currentTeacherId) {
      setMentorTeams([]);
      setIsMentorLoading(false);
      return;
    }

    try {
      setIsMentorLoading(true);
      const data = await mentorApi.getAssignedTeams(currentTeacherId);
      setMentorTeams(data);
    } catch (error) {
      console.error("Failed to load mentored teams:", error);
      setMentorTeams([]);
    } finally {
      setIsMentorLoading(false);
    }
  };

  useEffect(() => {
    loadMentorTeams();
  }, [currentTeacherId]);

  const judgeEventOptions = uniqueOptions(teams, "eventName");
  const judgeTrackOptions = uniqueOptions(teams, "trackName");
  const judgeRoundOptions = uniqueOptions(teams, "roundName");
  const mentorEventOptions = uniqueOptions(mentorTeams, "eventName");
  const mentorTrackOptions = uniqueOptions(mentorTeams, "trackName");

  const filteredTeams = teams.filter((team) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [team.teamName, team.eventName, team.trackName, team.roundName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    const matchesEvent =
      !judgeEventFilter || team.eventName === judgeEventFilter;
    const matchesTrack =
      !judgeTrackFilter || team.trackName === judgeTrackFilter;
    const matchesRound =
      !judgeRoundFilter || team.roundName === judgeRoundFilter;
    const matchesStatus =
      !judgeStatusFilter || getJudgeStatus(team) === judgeStatusFilter;

    return (
      matchesSearch &&
      matchesEvent &&
      matchesTrack &&
      matchesRound &&
      matchesStatus
    );
  });

  const filteredMentorTeams = mentorTeams.filter((team) => {
    const query = mentorSearchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [team.teamName, team.eventName, team.trackName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    const matchesEvent =
      !mentorEventFilter || team.eventName === mentorEventFilter;
    const matchesTrack =
      !mentorTrackFilter || team.trackName === mentorTrackFilter;

    return matchesSearch && matchesEvent && matchesTrack;
  });

  const resetJudgeFilters = () => {
    setSearchTerm("");
    setJudgeEventFilter("");
    setJudgeTrackFilter("");
    setJudgeRoundFilter("");
    setJudgeStatusFilter("");
  };

  const resetMentorFilters = () => {
    setMentorSearchTerm("");
    setMentorEventFilter("");
    setMentorTrackFilter("");
  };

  const handleViewMentorTeam = async (team: MentorAssignedTeam) => {
    if (!team.teamId) return;

    setSelectedMentorTeam(team);
    setMentorTeamDetail(null);
    setMentorDetailError("");
    setIsMentorDetailLoading(true);

    try {
      const detail = await mentorApi.getTeamDetail(team.teamId);
      setMentorTeamDetail(detail);
    } catch {
      setMentorDetailError("Unable to load team details. Please try again.");
    } finally {
      setIsMentorDetailLoading(false);
    }
  };

  const closeMentorDetail = () => {
    setSelectedMentorTeam(null);
    setMentorTeamDetail(null);
    setMentorDetailError("");
    setIsMentorDetailLoading(false);
  };

  const displayedMentorDetail = mentorTeamDetail || selectedMentorTeam;
  const mentorTeamSubmitted = hasSubmissionLink(mentorTeamDetail);
  const selectedJudgeTeamId = getJudgeAssignmentId(selectedJudgeTeam);
  const selectedJudgeSubmissionId = getJudgeSubmissionId(selectedJudgeTeam);
  const selectedJudgeSubmitted = isJudgeSubmissionAvailable(selectedJudgeTeam);
  const selectedJudgeEvaluated = isJudgeEvaluated(selectedJudgeTeam);
  const shouldShowJudgeEmpty =
    !isLoading && Boolean(currentTeacherId) && filteredTeams.length === 0;

  // ==========================================
  // TÍNH TOÁN THỐNG KÊ (Dựa trên data của API)
  // ==========================================
  const totalTeams = teams.length;
  const submittedTeams = teams.filter((t) =>
    Boolean(t.submissionId || t.submissionID || t.urlGithub || t.urlDemo),
  ).length;
  const notSubmittedTeams = totalTeams - submittedTeams;
  const evaluatedTeams = teams.filter((t) =>
    Boolean(
      t.evaluationId ||
      t.evaluationID ||
      (t.score !== null && t.score !== undefined),
    ),
  ).length;
  const pendingTeams = submittedTeams - evaluatedTeams; // Đã nộp nhưng chưa chấm

  return (
    <div className="min-h-screen bg-[#f7f8fb] font-sans text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#f26f21] text-white flex items-center justify-center shadow-sm">
            <Hexagon size={26} className="fill-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight leading-tight">
              FPT Hackathon
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              TEACHER PORTAL
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/judge/profile")}
          className="flex items-center gap-4 cursor-pointer text-left group bg-white border border-slate-100 px-5 py-2.5 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="text-right">
            <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {user?.fullName || user?.name || "Judge"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Judge & Mentor Panel
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-[#f26f21] to-[#0b7a3b] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:shadow-lg transition-all uppercase">
            {(user?.fullName || user?.name || "G")[0]}
          </div>
        </button>
      </header>

      <main className="max-w-7xl mx-auto mt-12 space-y-8 px-6">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-[#c2410c] border border-orange-100 text-xs font-extrabold uppercase tracking-wider mb-4">
            Judge & Mentor Workspace
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <ListTodo className="w-8 h-8 text-[#f26f21]" />
            Teacher Workspace
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Review assigned submissions and support the teams in tracks you
            mentor.
          </p>
        </header>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <h2 className="text-lg font-bold text-slate-800">
                Scoring Queue ({filteredTeams.length} of {teams.length})
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search scoring teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <select
                value={judgeEventFilter}
                onChange={(e) => setJudgeEventFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Events</option>
                {judgeEventOptions.map((eventName) => (
                  <option key={eventName} value={eventName}>
                    {eventName}
                  </option>
                ))}
              </select>
              <select
                value={judgeTrackFilter}
                onChange={(e) => setJudgeTrackFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Tracks</option>
                {judgeTrackOptions.map((trackName) => (
                  <option key={trackName} value={trackName}>
                    {trackName}
                  </option>
                ))}
              </select>
              <select
                value={judgeRoundFilter}
                onChange={(e) => setJudgeRoundFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Rounds</option>
                {judgeRoundOptions.map((roundName) => (
                  <option key={roundName} value={roundName}>
                    {roundName}
                  </option>
                ))}
              </select>
              <select
                value={judgeStatusFilter}
                onChange={(e) => setJudgeStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Status</option>
                <option value="not-submitted">Not Submitted</option>
                <option value="pending">Pending Score</option>
                <option value="scored">Scored</option>
              </select>
              <button
                type="button"
                onClick={resetJudgeFilters}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FilterX className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {shouldShowJudgeEmpty ? (
            <div className="px-6 py-14 text-center border-t border-slate-100">
              <Search className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700">
                No scoring assignments found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Try another keyword or reset the filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Team Info</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-400 font-medium animate-pulse"
                    >
                      Loading assigned teams...
                    </td>
                  </tr>
                ) : !currentTeacherId ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-amber-500 font-bold bg-amber-50"
                    >
                      Please sign in again so the system can identify your judge
                      account.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team, index) => {
                    // Support the standardized API shape from the backend.
                    const uniqueId = getJudgeAssignmentId(team);
                    const submissionId = getJudgeSubmissionId(team);
                    const isSubmitted = isJudgeSubmissionAvailable(team);
                    const hasEvaluated = isJudgeEvaluated(team);

                    let statusNode = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[11px] font-bold border border-slate-200">
                        <FileX size={12} /> Not Submitted
                      </span>
                    );

                    if (isSubmitted) {
                      if (hasEvaluated) {
                        statusNode = (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold border border-emerald-200">
                            <CheckCircle2 size={12} /> Scored
                          </span>
                        );
                      } else {
                        statusNode = (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-200">
                            <ListTodo size={12} /> Pending Score
                          </span>
                        );
                      }
                    }

                    return (
                      <tr
                        key={uniqueId || index}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-sm">
                            {team.teamName || "Unnamed Team"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono uppercase mt-0.5">
                            ID: {(uniqueId || "N/A").substring(0, 8)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">{statusNode}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900 text-base">
                          {hasEvaluated ? team.score || "0" : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedJudgeTeam(team)}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm bg-orange-50 border border-orange-100 text-[#c2410c] hover:bg-orange-100"
                            >
                              <Eye size={14} />
                              View Detail
                            </button>

                            <button
                              disabled={!isSubmitted}
                              onClick={() =>
                                navigate(
                                  `/judge/score/${submissionId || uniqueId}`,
                                  { state: { team } },
                                )
                              }
                              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${
                                !isSubmitted
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : hasEvaluated
                                    ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                                    : "bg-[#f26f21] text-white hover:bg-[#d85f16]"
                              }`}
                            >
                              {!isSubmitted ? (
                                "No Submission"
                              ) : hasEvaluated ? (
                                "Edit Score"
                              ) : (
                                <>
                                  <PlayCircle size={14} /> Score Now
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-10">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BookOpenCheck className="w-5 h-5 text-[#0b7a3b]" />
                  Mentoring Teams ({filteredMentorTeams.length} of{" "}
                  {mentorTeams.length})
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Teams here belong to the track you are assigned to mentor.
                </p>
              </div>

              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search team, event, track..."
                  value={mentorSearchTerm}
                  onChange={(e) => setMentorSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <select
                value={mentorEventFilter}
                onChange={(e) => setMentorEventFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Events</option>
                {mentorEventOptions.map((eventName) => (
                  <option key={eventName} value={eventName}>
                    {eventName}
                  </option>
                ))}
              </select>
              <select
                value={mentorTrackFilter}
                onChange={(e) => setMentorTrackFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Tracks</option>
                {mentorTrackOptions.map((trackName) => (
                  <option key={trackName} value={trackName}>
                    {trackName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={resetMentorFilters}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FilterX className="w-4 h-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={loadMentorTeams}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {isMentorLoading ? (
            <div className="p-10 text-center text-sm font-medium text-slate-400 animate-pulse">
              Loading mentored teams...
            </div>
          ) : !currentTeacherId ? (
            <div className="p-10 text-center text-sm font-bold text-amber-600 bg-amber-50">
              Please sign in again so the system can identify your teacher
              account.
            </div>
          ) : filteredMentorTeams.length === 0 ? (
            <div className="p-10 text-center">
              <UsersRound className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">
                No mentored teams found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                You may not be assigned as a mentor for any track yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Team</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Track</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMentorTeams.map((team) => (
                    <tr
                      key={team.teamId || team.teamName}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-sm">
                          {team.teamName || "Unnamed Team"}
                        </p>
                        {team.teamId && (
                          <p className="text-[11px] text-slate-400 font-mono uppercase mt-0.5">
                            ID: {team.teamId.substring(0, 8)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {team.eventName || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {team.trackName || "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewMentorTeam(team)}
                          disabled={!team.teamId}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0b7a3b] bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedJudgeTeam && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 px-4 py-6 flex items-center justify-center">
          <section className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  Scoring Detail
                </p>
                <h3 className="text-2xl font-extrabold tracking-tight mt-1">
                  {selectedJudgeTeam.teamName || "Unnamed Team"}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {selectedJudgeTeamId || "N/A"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJudgeTeam(null)}
                className="inline-flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close scoring details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Track
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-2">
                    {selectedJudgeTeam.trackName || "-"}
                  </p>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current Round
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-2">
                    {selectedJudgeTeam.roundName || "-"}
                  </p>
                </div>
              </div>

              <div
                className={`border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  selectedJudgeSubmitted
                    ? selectedJudgeEvaluated
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {selectedJudgeSubmitted ? (
                    selectedJudgeEvaluated ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    ) : (
                      <ListTodo className="w-5 h-5 text-amber-600 mt-0.5" />
                    )
                  ) : (
                    <FileX className="w-5 h-5 text-slate-500 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-extrabold ${
                        selectedJudgeSubmitted
                          ? selectedJudgeEvaluated
                            ? "text-emerald-700"
                            : "text-amber-700"
                          : "text-slate-600"
                      }`}
                    >
                      {!selectedJudgeSubmitted
                        ? "Not submitted"
                        : selectedJudgeEvaluated
                          ? "Scored"
                          : "Pending score"}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        selectedJudgeSubmitted
                          ? selectedJudgeEvaluated
                            ? "text-emerald-700"
                            : "text-amber-700"
                          : "text-slate-500"
                      }`}
                    >
                      {!selectedJudgeSubmitted
                        ? "This team has no submission available for scoring yet."
                        : selectedJudgeEvaluated
                          ? `Score recorded: ${selectedJudgeTeam.score ?? "0"}`
                          : "This submission is ready for your evaluation."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedJudgeSubmitted}
                  onClick={() =>
                    navigate(
                      `/judge/score/${selectedJudgeSubmissionId || selectedJudgeTeamId}`,
                      { state: { team: selectedJudgeTeam } },
                    )
                  }
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${
                    !selectedJudgeSubmitted
                      ? "bg-white border border-slate-200 text-slate-400 cursor-not-allowed"
                      : selectedJudgeEvaluated
                        ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <PlayCircle className="w-4 h-4" />
                  {selectedJudgeEvaluated ? "Edit Score" : "Score Now"}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="border border-slate-200 bg-white p-4 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Submission ID
                  </p>
                  <p className="text-xs font-mono text-slate-600 mt-2 break-all">
                    {selectedJudgeSubmissionId || "-"}
                  </p>
                </div>
                <div className="border border-slate-200 bg-white p-4 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Score
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-2">
                    {selectedJudgeEvaluated
                      ? (selectedJudgeTeam.score ?? "0")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {selectedMentorTeam && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 px-4 py-6 flex items-center justify-center">
          <section className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  Mentoring Detail
                </p>
                <h3 className="text-2xl font-extrabold tracking-tight mt-1">
                  {displayedMentorDetail?.teamName || "Unnamed Team"}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {displayedMentorDetail?.teamId || selectedMentorTeam.teamId}
                </p>
              </div>
              <button
                type="button"
                onClick={closeMentorDetail}
                className="inline-flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close team details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isMentorDetailLoading ? (
              <div className="p-8 text-center text-sm font-medium text-slate-400 animate-pulse">
                Loading team details...
              </div>
            ) : mentorDetailError ? (
              <div className="m-6 p-4 border border-red-100 bg-red-50 text-sm font-bold text-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {mentorDetailError}
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Event
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-2">
                      {displayedMentorDetail?.eventName || "-"}
                    </p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Track
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-2">
                      {displayedMentorDetail?.trackName || "-"}
                    </p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Current Round
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-2">
                      {mentorTeamDetail?.roundName || "-"}
                    </p>
                  </div>
                </div>

                <div
                  className={`border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    mentorTeamSubmitted
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {mentorTeamSubmitted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-extrabold ${
                          mentorTeamSubmitted
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {mentorTeamSubmitted
                          ? "Submitted"
                          : "Not submitted yet"}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          mentorTeamSubmitted
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {mentorTeamSubmitted
                          ? "This team has provided at least one project link."
                          : "No GitHub, demo, or slide link has been submitted."}
                      </p>
                    </div>
                  </div>

                  {mentorTeamDetail?.leaderEmail && (
                    <button
                      type="button"
                      onClick={() =>
                        openLeaderGmailCompose({
                          leaderEmail: mentorTeamDetail.leaderEmail || "",
                          teamName:
                            displayedMentorDetail?.teamName || "Unnamed Team",
                          eventName: displayedMentorDetail?.eventName,
                          trackName: displayedMentorDetail?.trackName,
                          roundName: mentorTeamDetail?.roundName,
                        })
                      }
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Open Gmail
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h4 className="text-base font-extrabold text-slate-900">
                      Submission Links
                    </h4>
                    {mentorTeamDetail?.leaderEmail && (
                      <p className="text-xs font-medium text-slate-500">
                        Leader: {mentorTeamDetail.leaderEmail}
                      </p>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    {[
                      ["GitHub", mentorTeamDetail?.urlGithub],
                      ["Demo", mentorTeamDetail?.urlDemo],
                      ["Slide", mentorTeamDetail?.urlSlide],
                    ].map(([label, url]) => (
                      <div
                        key={label}
                        className="px-4 py-3 border-b last:border-b-0 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {label}
                          </p>
                          <p className="text-xs font-medium text-slate-500 break-all mt-1">
                            {url || "Not provided"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openUrl(url)}
                          disabled={!url}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
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
      )}
    </div>
  );
}
