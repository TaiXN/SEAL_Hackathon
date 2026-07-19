import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hexagon,
  Search,
  PlayCircle,
  CheckCircle2,
  ListTodo,
  FileX,
  FileText,
  Clock,
  Award,
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
        console.error("Error fetching teams:", error);
        Swal.fire({
          icon: "error",
          title: "Data Loading Error",
          text:
            error.response?.data?.message ||
            "Could not load the assigned teams.",
          customClass: { popup: "rounded-[2rem]" },
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
    <div className="min-h-screen bg-[#f4f6f8] font-sans text-slate-900 pb-12 animate-in fade-in duration-500">
      <header className="bg-white border-b border-slate-100 px-10 py-5 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <Hexagon size={28} className="text-[#0a192f]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-[#0a192f] leading-tight">
              SEAL Hackathon
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
              JUDGE PORTAL
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/judge/profile")}
          className="flex items-center gap-4 cursor-pointer text-left group bg-white border border-slate-100 px-5 py-2.5 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="text-right">
            <h2 className="text-sm font-extrabold text-[#0a192f] group-hover:text-blue-600 transition-colors">
              {user?.fullName || user?.name || "Judge"}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Expert Panel
            </p>
          </div>
          <div className="w-10 h-10 bg-[#0a192f] text-white rounded-xl flex items-center justify-center font-black text-sm uppercase shadow-sm">
            {(user?.fullName || user?.name || "J")[0]}
          </div>
        </button>
      </header>

      <main className="max-w-7xl mx-auto mt-12 space-y-8 px-6">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-[#0a192f] tracking-tight flex items-center gap-4">
            <ListTodo className="w-9 h-9 text-blue-600" />
            Dashboard Overview
          </h1>
          <p className="text-slate-500 mt-3 text-base font-medium max-w-2xl">
            Track submission statuses and manage your evaluation progress for
            all assigned teams.
          </p>
        </header>

        {/* ========================================== */}
        {/* STATS OVERVIEW CARDS (THỐNG KÊ)             */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Đã nộp bài */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <FileText size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                Submitted
              </p>
              <h3 className="text-3xl font-black text-[#0a192f] leading-none">
                {submittedTeams}{" "}
                <span className="text-sm font-bold text-slate-400">teams</span>
              </h3>
            </div>
          </div>

          {/* Chưa nộp bài */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200">
              <FileX size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                Not Submitted
              </p>
              <h3 className="text-3xl font-black text-[#0a192f] leading-none">
                {notSubmittedTeams}{" "}
                <span className="text-sm font-bold text-slate-400">teams</span>
              </h3>
            </div>
          </div>

          {/* Đã chấm điểm */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Award size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-emerald-500 uppercase tracking-widest mb-1">
                Evaluated
              </p>
              <h3 className="text-3xl font-black text-[#0a192f] leading-none">
                {evaluatedTeams}{" "}
                <span className="text-sm font-bold text-slate-400">teams</span>
              </h3>
            </div>
          </div>

          {/* Cần chấm (Đã nộp nhưng chưa chấm) */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-amber-500 uppercase tracking-widest mb-1">
                Pending Scoring
              </p>
              <h3 className="text-3xl font-black text-[#0a192f] leading-none">
                {pendingTeams}{" "}
                <span className="text-sm font-bold text-slate-400">teams</span>
              </h3>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* EVALUATION LIST (BẢNG DANH SÁCH)             */}
        {/* ========================================== */}
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row gap-6 justify-between items-center bg-slate-50/50">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">
              Evaluation Roster ({teams.length})
            </h2>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">Team Info</th>
                  <th className="px-6 py-5">Track & Round</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-center">Score</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-8 py-20 text-center text-slate-400 font-bold text-sm"
                    >
                      Loading assigned teams...
                    </td>
                  </tr>
                ) : !currentTeacherId ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-8 py-20 text-center text-amber-500 font-bold bg-amber-50/50"
                    >
                      Session expired. Please log in again to authenticate your
                      Judge account.
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-8 py-20 text-center text-slate-400 font-medium"
                    >
                      No teams assigned or no submissions found matching your
                      search.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team, index) => {
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
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border border-slate-200">
                        <FileX size={12} /> Not Submitted
                      </span>
                    );

                    if (isSubmitted) {
                      if (hasEvaluated) {
                        statusNode = (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border border-emerald-100">
                            <CheckCircle2 size={12} /> Evaluated
                          </span>
                        );
                      } else {
                        statusNode = (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border border-amber-100">
                            <ListTodo size={12} /> Pending
                          </span>
                        );
                      }
                    }

                    return (
                      <tr
                        key={uniqueId || index}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <p className="font-extrabold text-[#0a192f] text-sm">
                            {team.teamName || "Unnamed Team"}
                          </p>
                        </td>
                        <td className="px-6 py-6">
                          <p className="font-bold text-slate-600 text-xs">
                            {team.trackName || "N/A"}
                          </p>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                            {team.roundName || team.eventName || "N/A"}
                          </p>
                        </td>
                        <td className="px-6 py-6 text-center">{statusNode}</td>
                        <td className="px-6 py-6 text-center font-black text-[#0a192f] text-lg">
                          {hasEvaluated ? team.score || "0" : "-"}
                        </td>
                        <td className="px-8 py-6 flex justify-end gap-2">
                          <button
                            disabled={!isSubmitted}
                            onClick={() =>
                              navigate(
                                `/judge/score/${team.submissionId || team.submissionID || uniqueId}`,
                                { state: { team } },
                              )
                            }
                            className={`flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-extrabold rounded-xl transition-all shadow-sm ${
                              !isSubmitted
                                ? "bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed"
                                : hasEvaluated
                                  ? "bg-white border border-slate-200 text-[#0a192f] hover:bg-slate-50 hover:border-slate-300"
                                  : "bg-[#0a192f] text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                            }`}
                          >
                            {!isSubmitted ? (
                              "No Submission"
                            ) : hasEvaluated ? (
                              "Edit Score"
                            ) : (
                              <>
                                <PlayCircle size={14} /> Evaluate
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
        </div>
      </main>
    </div>
  );
}
