import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hexagon,
  Search,
  PlayCircle,
  CheckCircle2,
  ListTodo,
  FileX,
} from "lucide-react";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import { judgeApi } from "../../lib/api/judgeApi";
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

export function JudgeDashboard() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
        Swal.fire({
          icon: "error",
          title: "Failed to Load Data",
          text:
            error.response?.data?.message ||
            "Could not load the assigned scoring list.",
        });
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [currentTeacherId]);

  const filteredTeams = teams.filter((team) =>
    (team.teamName || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Hexagon size={32} className="text-blue-600" strokeWidth={2.5} />
          <div>
            <h1 className="font-extrabold text-lg tracking-tight leading-tight">
              SEAL Hackathon
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              JUDGE PORTAL
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/judge/profile")}
          className="flex items-center gap-3 cursor-pointer text-left group"
        >
          <div className="text-right">
            <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {user?.fullName || user?.name || "Judge"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Judging Panel
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:shadow-lg transition-all uppercase">
            {(user?.fullName || user?.name || "G")[0]}
          </div>
        </button>
      </header>

      <main className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <ListTodo className="w-8 h-8 text-blue-600" />
            Scoring Queue
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Review and score the teams assigned to you for this Hackathon.
          </p>
        </header>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">
              Assigned Teams ({teams.length})
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Team Info</th>
                <th className="px-6 py-4">Category & Round</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 font-medium animate-pulse"
                  >
                    Loading assigned teams...
                  </td>
                </tr>
              ) : !currentTeacherId ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-amber-500 font-bold bg-amber-50"
                  >
                    Please sign in again so the system can identify your judge
                    account.
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 font-medium"
                  >
                    You have not been assigned yet, or no teams in your tracks
                    have submitted.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team, index) => {
                  // Support the standardized API shape from the backend.
                  const uniqueId =
                    team.teamInRoundId || team.teamInRoundID || team.teamId;
                  const isSubmitted = Boolean(
                    team.submissionId ||
                    team.submissionID ||
                    team.urlGithub ||
                    team.urlDemo,
                  );
                  const hasEvaluated = Boolean(
                    team.evaluationId ||
                    team.evaluationID ||
                    (team.score !== null && team.score !== undefined),
                  );

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
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700 text-xs">
                          {team.trackName || "N/A"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {team.roundName || team.eventName || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">{statusNode}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900 text-base">
                        {hasEvaluated ? team.score || "0" : "-"}
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button
                          disabled={!isSubmitted}
                          onClick={() =>
                            navigate(
                              `/judge/score/${team.submissionId || team.submissionID || uniqueId}`,
                              { state: { team } },
                            )
                          }
                          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${
                            !isSubmitted
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : hasEvaluated
                                ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                                : "bg-blue-600 text-white hover:bg-blue-700"
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
