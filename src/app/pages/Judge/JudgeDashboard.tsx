import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hexagon,
  Search,
  PlayCircle,
  CheckCircle2,
  ListTodo,
  Activity,
  Clock,
} from "lucide-react";
import Swal from "sweetalert2";

// Import API Client & Store
import apiClient from "../../lib/api/apiClient";
import { eventApi } from "../../lib/api/eventApi";
import { roundApi } from "../../lib/api/roundApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { useAuthStore } from "../../stores/auth.store";

const getList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

// Giải mã payload JWT để lấy claims
const decodeJwt = (token: string | null): any => {
  if (!token) return {};
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(base64))));
  } catch {
    return {};
  }
};

export function JudgeDashboard() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackCount, setTrackCount] = useState(0);

  // Bóc ID của Giám khảo TỪ TOKEN
  const accessToken = useAuthStore((state: any) => state.accessToken);
  const user = decodeJwt(accessToken);
  const currentTeacherId =
    user?.teacherId ||
    user?.TeacherId ||
    user?.teacherID ||
    user?.nameid ||
    user?.sub ||
    user?.id ||
    user?.Id ||
    user?.[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ||
    "";

  useEffect(() => {
    const fetchTeamsAndEvaluations = async () => {
      if (!currentTeacherId) {
        setIsLoading(false);
        Swal.fire(
          "Lỗi phiên đăng nhập",
          "Không trích xuất được mã ID của Giám khảo. Vui lòng đăng nhập lại!",
          "error",
        );
        return;
      }

      try {
        setIsLoading(true);

        // 1. KÉO TOÀN BỘ DỮ LIỆU NỀN TẢNG (ALL EVENTS)
        const [
          eventsRes,
          roundsRes,
          tracksRes,
          teamsRes,
          teamInRoundRes,
          submissionsRes,
          evalRes,
        ] = await Promise.all([
          eventApi.getAllEvents().catch(() => []),
          roundApi.getAllRounds().catch(() => []),
          trackTopicApi.getAllTracks().catch(() => []),
          apiClient.get("/api/Team").catch(() => ({ data: [] })),
          apiClient.get("/api/TeamInRound").catch(() => ({ data: [] })),
          apiClient.get("/api/Submission").catch(() => ({ data: [] })),
          apiClient.get("/api/Evaluation").catch(() => ({ data: [] })),
        ]);

        const allEvents = getList(eventsRes);
        const allRounds = getList(roundsRes);
        const allTracks = getList(tracksRes);
        const allTeams = getList(teamsRes.data);
        const allTeamInRounds = getList(teamInRoundRes.data);
        const allSubmissions = getList(submissionsRes.data);
        const allEvaluations = getList(evalRes.data);

        // 2. QUÉT SẠCH MỌI NGÓC NGÁCH ĐỂ TÌM TRACK CỦA GIÁM KHẢO NÀY
        let myTrackIds: string[] = [];

        await Promise.all(
          allTracks.map(async (track: any) => {
            const tid = String(
              track.trackId || track.trackID || track.id || track.Id,
            );
            if (!tid || tid === "undefined") return;
            try {
              const judges = await apiClient.get(`/api/Judge/track/${tid}`);
              const isMine = getList(judges.data).some(
                (j: any) =>
                  String(
                    j.teacherId || j.teacherID || j.judgeId || j.id || j.Id,
                  ).toLowerCase() === String(currentTeacherId).toLowerCase(),
              );
              if (isMine) myTrackIds.push(tid);
            } catch (e) {
              // Track chưa có giám khảo thì bỏ qua
            }
          }),
        );

        setTrackCount(myTrackIds.length);

        const myEvaluations = allEvaluations.filter(
          (ev: any) =>
            String(ev.teacherId || ev.judgeId || ev.TeacherId).toLowerCase() ===
            String(currentTeacherId).toLowerCase(),
        );

        // 3. TRỘN DỮ LIỆU ĐỂ RENDER BẢNG (HIỆN TOÀN BỘ ĐỘI THI TRONG TRACK)
        const displayList: any[] = [];

        myTrackIds.forEach((trackId) => {
          const track = allTracks.find(
            (t: any) => String(t.id || t.trackId || t.trackID) === trackId,
          );
          const event = allEvents.find(
            (e: any) =>
              String(e.id) === String(track?.eventId || track?.eventID),
          );

          // Lấy Bộ tiêu chí của vòng hiện tại
          let criteriaSetId = null;
          if (event && event.currentRound >= 0) {
            const evRounds = allRounds.filter(
              (r: any) =>
                String(r.eventId || r.eventID).toLowerCase() ===
                String(event.id).toLowerCase(),
            );
            const curRound = evRounds.find(
              (r: any) =>
                Number(r.roundIndex ?? r.RoundIndex) ===
                Number(event.currentRound),
            );
            criteriaSetId =
              curRound?.criteriaSetID ||
              curRound?.criteriaSetId ||
              curRound?.CriteriaSetId;
          }

          // Lọc Đội thuộc Track này (Dò cả bên Team và TeamInRound để chống sót)
          const trackTeams = allTeams.filter((t: any) => {
            let tId = t.trackId || t.trackID || t.TrackId;
            if (!tId) {
              const tir = allTeamInRounds.find(
                (tr: any) =>
                  String(tr.teamId || tr.teamID || tr.TeamId).toLowerCase() ===
                  String(t.id || t.teamId).toLowerCase(),
              );
              tId = tir?.trackId || tir?.trackID || tir?.TrackId;
            }
            return String(tId).toLowerCase() === trackId.toLowerCase();
          });

          if (trackTeams.length > 0) {
            // HIỆN TẤT CẢ ĐỘI (Dù nộp bài hay chưa)
            trackTeams.forEach((team: any) => {
              const teamIdStr = String(team.id || team.teamId || team.teamID);
              const teamEval = myEvaluations.find(
                (ev: any) =>
                  String(ev.teamId || ev.teamID).toLowerCase() ===
                  teamIdStr.toLowerCase(),
              );

              // Đội đã nộp bài chưa? (Có link Github/Slide hoặc có record trong bảng Submission)
              const isSubmitted =
                allSubmissions.some(
                  (s: any) =>
                    String(s.teamId || s.teamID).toLowerCase() ===
                    teamIdStr.toLowerCase(),
                ) || !!(team.urlGithub || team.urlDemo || team.urlSlide);

              // Phân loại trạng thái
              let statusLabel = "Chưa nộp bài";
              if (teamEval) statusLabel = "Đã chấm";
              else if (isSubmitted) statusLabel = "Chưa chấm";

              displayList.push({
                id: teamIdStr,
                name: team.teamName || team.name || "Đội chưa đặt tên",
                track: track?.trackName || track?.name || "Chưa rõ",
                eventName:
                  event?.name || event?.eventName || "Sự kiện Hackathon",
                status: statusLabel,
                score: teamEval
                  ? `${teamEval.score ?? teamEval.totalScore ?? 0}đ`
                  : "—",
                evaluationId: teamEval
                  ? teamEval.id || teamEval.evaluationId
                  : null,
                criteriaSetId: criteriaSetId,
                isEmpty: false,
                isSubmitted: isSubmitted,
              });
            });
          } else {
            // NẾU TRACK HOÀN TOÀN TRỐNG TRƠN CHƯA CÓ ĐỘI NÀO ĐĂNG KÝ
            displayList.push({
              id: `empty-${trackId}`,
              name: "Hạng mục này chưa có đội thi nào đăng ký",
              track: track?.trackName || track?.name || "Chưa rõ",
              eventName: event?.name || event?.eventName || "Sự kiện Hackathon",
              status: "Trống",
              score: "—",
              isEmpty: true,
            });
          }
        });

        setTeams(displayList);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu chấm thi", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamsAndEvaluations();
  }, [currentTeacherId]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTeams = teams.filter((team) => {
    const matchSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.track.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(team.id).includes(searchTerm);
    const matchStatus =
      statusFilter === "Tất cả trạng thái" || team.status === statusFilter;
    return matchSearch && matchStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const indexOfLastTeam = currentPage * itemsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - itemsPerPage;
  const currentTeams = filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Chỉ đếm đội thực tế (Bỏ qua các đội ảo báo trống Track)
  const completedTeams = teams.filter(
    (t) => !t.isEmpty && t.status === "Đã chấm",
  ).length;
  const pendingTeams = teams.filter(
    (t) => !t.isEmpty && t.status === "Chưa chấm",
  ).length;
  const totalTeams = completedTeams + pendingTeams;
  const completedPercent =
    totalTeams === 0 ? 0 : Math.round((completedTeams / totalTeams) * 100);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Hexagon size={32} className="text-black" strokeWidth={2.5} />
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-tight">
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
              {user?.fullName || user?.name || user?.unique_name || "Giám Khảo"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Hội đồng chuyên môn
            </p>
          </div>
          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-blue-600 transition-colors uppercase">
            {(user?.fullName || user?.name || user?.unique_name || "G")[0]}
          </div>
        </button>
      </header>

      <main className="max-w-6xl mx-auto mt-8 space-y-6 px-4">
        <div className="bg-[#111111] rounded-2xl p-8 text-white shadow-xl flex justify-between items-center">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📊</span> TIẾN ĐỘ CHẤM THI
            </h2>
            <p className="text-slate-400 text-sm">
              Hãy hoàn thành việc đánh giá tất cả các đội trước thời hạn đóng
              cổng.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center bg-white/10 px-4 py-2 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Hạng mục phụ trách
                </span>
                <span className="text-2xl font-bold text-blue-400">
                  {trackCount}
                </span>
              </div>
              <div className="flex flex-col items-center px-4 py-2">
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  Đã chấm
                </span>
                <span className="text-2xl font-bold text-emerald-500">
                  {completedTeams}
                </span>
              </div>
              <div className="flex flex-col items-center px-4 py-2">
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  Chờ chấm điểm
                </span>
                <span className="text-2xl font-bold text-amber-500">
                  {pendingTeams}
                </span>
              </div>
            </div>
            <div className="w-48 space-y-2 border-l border-white/10 pl-8">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Hoàn thành</span>
                <span className="text-emerald-500">{completedPercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${completedPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="relative w-80">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên đội hoặc Hạng mục..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 transition-colors shadow-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none shadow-sm cursor-pointer"
            >
              <option value="Tất cả trạng thái">Tất cả trạng thái</option>
              <option value="Đã chấm">Đã chấm</option>
              <option value="Chưa chấm">Chưa chấm</option>
              <option value="Chưa nộp bài">Chưa nộp bài</option>
            </select>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-1/4">Tên đội thi</th>
                <th className="px-6 py-4">Hạng mục thi đấu</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-center w-24">Điểm số</th>
                <th className="px-6 py-4 text-right w-56">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500 font-medium"
                  >
                    <Activity
                      className="animate-spin inline mr-2 mb-1"
                      size={18}
                    />
                    Đang quét dữ liệu toàn hệ thống...
                  </td>
                </tr>
              ) : currentTeams.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500 font-medium"
                  >
                    {/* Đã sửa câu text gây hiểu lầm */}
                    Bạn chưa được phân công chấm Hạng mục nào trên hệ thống.
                  </td>
                </tr>
              ) : (
                currentTeams.map((team, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors bg-white ${team.isEmpty ? "opacity-70 bg-slate-50/50" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-6 py-5">
                      {team.isEmpty ? (
                        <span className="font-medium text-slate-400 italic flex items-center gap-2">
                          {team.name}
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900 text-sm">
                          {team.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-700 text-xs">
                        {team.track}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-medium">
                        {team.eventName}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {team.isEmpty ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[11px] font-bold border border-slate-200">
                          Trống
                        </span>
                      ) : team.status === "Đã chấm" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold border border-emerald-100">
                          <CheckCircle2 size={12} /> Đã chấm
                        </span>
                      ) : team.status === "Chưa chấm" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-200">
                          <ListTodo size={12} /> Chưa chấm
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[11px] font-bold border border-slate-200">
                          <Clock size={12} /> Chưa nộp bài
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-slate-900 text-base">
                      {team.score}
                    </td>
                    <td className="px-6 py-5 flex justify-end gap-2">
                      {team.isEmpty ? (
                        <button
                          disabled
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-sm"
                        >
                          <Clock size={14} /> Chờ đăng ký
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            navigate(`/judge/score/${team.id}`, {
                              state: { team },
                            })
                          }
                          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-sm ${team.status === "Đã chấm" ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-black text-white hover:bg-slate-800"}`}
                        >
                          {team.status === "Đã chấm" ? (
                            "Xem / Sửa điểm"
                          ) : (
                            <>
                              <PlayCircle size={14} /> Chấm ngay
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredTeams.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm bg-white">
              <span className="text-slate-500 font-medium">
                Đang hiển thị {indexOfFirstTeam + 1} -{" "}
                {Math.min(indexOfLastTeam, filteredTeams.length)} trong tổng số{" "}
                {filteredTeams.length} kết quả
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-colors ${currentPage === number ? "bg-black text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {number}
                    </button>
                  ),
                )}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${currentPage === totalPages || totalPages === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
