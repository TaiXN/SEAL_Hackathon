import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  Hexagon,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import {
  mentorApi,
  type MentorAssignedTeam,
  type MentorTeamDetail,
} from "../../lib/api/mentorApi";
import { useAuthStore } from "../../stores/auth.store";

const readString = (value: any, fallback = "") => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
};

const getMentorFromToken = (accessToken?: string | null) => {
  if (!accessToken) return { id: "", name: "Mentor", email: "" };

  try {
    const decoded: any = jwtDecode(accessToken);
    const id = readString(
      decoded?.id ||
        decoded?.Id ||
        decoded?.sub ||
        decoded?.nameid ||
        decoded?.teacherId ||
        decoded?.teacherID ||
        decoded?.TeacherId ||
        decoded?.TeacherID ||
        decoded?.[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ],
    );

    return {
      id,
      name: readString(
        decoded?.fullName ||
          decoded?.FullName ||
          decoded?.name ||
          decoded?.Name ||
          decoded?.email,
        "Mentor",
      ),
      email: readString(decoded?.email || decoded?.Email),
    };
  } catch {
    return { id: "", name: "Mentor", email: "" };
  }
};

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

export function MentorDashboard() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state: any) => state.accessToken);
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const mentor = getMentorFromToken(accessToken);

  const [teams, setTeams] = useState<MentorAssignedTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<MentorAssignedTeam | null>(
    null,
  );
  const [teamDetail, setTeamDetail] = useState<MentorTeamDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const filteredTeams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) =>
      [team.teamName, team.eventName, team.trackName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [teams, searchTerm]);

  const loadAssignedTeams = async () => {
    if (!mentor.id) {
      setTeams([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await mentorApi.getAssignedTeams(mentor.id);
      setTeams(data);
    } catch (error) {
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignedTeams();
  }, [mentor.id]);

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem("seal-hackathon-auth");
    navigate("/login", { replace: true });
  };

  const handleViewDetail = async (team: MentorAssignedTeam) => {
    if (!team.teamId) return;

    setSelectedTeam(team);
    setTeamDetail(null);
    setDetailError("");
    setIsDetailLoading(true);

    try {
      const detail = await mentorApi.getTeamDetail(team.teamId);
      setTeamDetail(detail);
    } catch {
      setDetailError("Unable to load team details. Please try again.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedTeam(null);
    setTeamDetail(null);
    setDetailError("");
    setIsDetailLoading(false);
  };

  const displayedDetail = teamDetail || selectedTeam;
  const submitted = hasSubmissionLink(teamDetail);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Hexagon className="w-8 h-8 fill-blue-600 text-blue-600" />
          <div>
            <h1 className="font-extrabold text-lg tracking-tight">
              SEAL Hackathon
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Mentor Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900">{mentor.name}</p>
            <p className="text-xs font-medium text-slate-500">
              {mentor.email || "Track Mentor"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 border border-red-100 bg-red-50 hover:bg-red-100 transition-colors rounded-radius-md"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <BookOpenCheck className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-extrabold tracking-tight">
              Assigned Teams
            </h2>
          </div>
          <p className="text-sm font-medium text-slate-500 max-w-2xl">
            Teams shown here belong to the track you are assigned to mentor.
            Use this page to identify who may contact you for support.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-radius-lg shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {teams.length} assigned team{teams.length === 1 ? "" : "s"}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-1">
                One mentor is assigned per track.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search team, event, track..."
                  className="w-64 max-w-full pl-9 pr-3 py-2.5 text-sm font-medium border border-slate-200 bg-white rounded-radius-md outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={loadAssignedTeams}
                className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors rounded-radius-md"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-sm font-medium text-slate-400 animate-pulse">
              Loading assigned teams...
            </div>
          ) : !mentor.id ? (
            <div className="p-10 text-center text-sm font-bold text-amber-600 bg-amber-50">
              Mentor ID was not found in your login token. Please sign in again.
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="p-10 text-center">
              <UsersRound className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">
                No assigned teams found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Your assigned track may not have any registered teams yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white border-b border-slate-100">
                    <th className="px-6 py-4">Team</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Track</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeams.map((team) => (
                    <tr
                      key={team.teamId || team.teamName}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">
                          {team.teamName || "Unnamed Team"}
                        </p>
                        {team.teamId && (
                          <p className="text-[11px] font-mono text-slate-400 mt-1">
                            {team.teamId.slice(0, 8)}
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
                          onClick={() => handleViewDetail(team)}
                          disabled={!team.teamId}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-radius-md"
                        >
                          <Eye className="w-4 h-4" />
                          View
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

      {selectedTeam && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 px-4 py-6 flex items-center justify-center">
          <section className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-radius-lg">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  Team Details
                </p>
                <h3 className="text-2xl font-extrabold tracking-tight mt-1">
                  {displayedDetail?.teamName || "Unnamed Team"}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {displayedDetail?.teamId || selectedTeam.teamId}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="inline-flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-radius-md transition-colors"
                aria-label="Close team details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="p-8 text-center text-sm font-medium text-slate-400 animate-pulse">
                Loading team details...
              </div>
            ) : detailError ? (
              <div className="m-6 p-4 border border-red-100 bg-red-50 text-sm font-bold text-red-600 rounded-radius-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {detailError}
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-radius-md">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Event
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-2">
                      {displayedDetail?.eventName || "-"}
                    </p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-radius-md">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Track
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-2">
                      {displayedDetail?.trackName || "-"}
                    </p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-radius-md">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Current Round
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-2">
                      {teamDetail?.roundName || "-"}
                    </p>
                  </div>
                </div>

                <div
                  className={`border p-4 rounded-radius-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    submitted
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {submitted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-extrabold ${
                          submitted ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {submitted ? "Submitted" : "Not submitted yet"}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          submitted ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {submitted
                          ? "This team has provided at least one project link."
                          : "No GitHub, demo, or slide link has been submitted."}
                      </p>
                    </div>
                  </div>

                  {teamDetail?.leaderEmail && (
                    <button
                      type="button"
                      onClick={() =>
                        openLeaderGmailCompose({
                          leaderEmail: teamDetail.leaderEmail || "",
                          teamName: displayedDetail?.teamName || "Unnamed Team",
                          eventName: displayedDetail?.eventName,
                          trackName: displayedDetail?.trackName,
                          roundName: teamDetail?.roundName,
                        })
                      }
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-radius-md transition-colors"
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
                    {teamDetail?.leaderEmail && (
                      <p className="text-xs font-medium text-slate-500">
                        Leader: {teamDetail.leaderEmail}
                      </p>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-radius-md overflow-hidden">
                    {[
                      ["GitHub", teamDetail?.urlGithub],
                      ["Demo", teamDetail?.urlDemo],
                      ["Slide", teamDetail?.urlSlide],
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
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-radius-md transition-colors"
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
