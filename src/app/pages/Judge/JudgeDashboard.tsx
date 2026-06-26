import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hexagon,
  Search,
  PlayCircle,
  CheckCircle2,
  ListTodo,
  Activity,
} from "lucide-react";

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

export function JudgeDashboard() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

// Bóc ID của Giám khảo đang đăng nhập (Thêm các trường hợp viết hoa)
  const user = useAuthStore((state: any) => state.user);
  const currentTeacherId = user?.id || user?.Id || user?.teacherId || user?.teacherID || user?.sub || "";

  // ĐỌC DỮ LIỆU BẰNG API THẬT 100%
  useEffect(() => {
    const fetchTeamsAndEvaluations = async () => {
      // 🛡️ CHỐT CHẶN: Nếu không có ID, tắt loading ngay và in log ra để kiểm tra
      if (!currentTeacherId) {
        console.error("🔴 LỖI: Không tìm thấy ID Giám khảo trong Store! Dữ liệu user hiện tại:", user);
        setIsLoading(false); // Phải tắt vòng quay
        Swal.fire("Lỗi phiên đăng nhập", "Không trích xuất được mã ID của Giám khảo. Vui lòng đăng nhập lại hoặc kiểm tra F12 Console!", "error");
        return;
      }

      try {
        setIsLoading(true);

        // 1. Fetch toàn bộ dữ liệu nền tảng
        const [eventsRes, roundsRes, tracksRes, teamsRes, evalRes] = await Promise.all([
          eventApi.getAllEvents().catch(() => []),
          roundApi.getAllRounds().catch(() => []),
          trackTopicApi.getAllTracks().catch(() => []),
          apiClient.get("/api/Team").catch(() => ({ data: [] })), 
          apiClient.get("/api/Evaluation").catch(() => ({ data: [] }))
        ]);

        const allEvents = getList(eventsRes);
        const allRounds = getList(roundsRes);
        const allTracks = getList(tracksRes);
        const allTeams = getList(teamsRes.data);
        const allEvaluations = getList(evalRes.data);

        // 2. TÌM XEM GIÁM KHẢO NÀY QUẢN LÝ TRACK NÀO
        let myTrackIds: string[] = [];
        try {
          const judgesRes = await apiClient.get("/api/Judge");
          myTrackIds = getList(judgesRes.data)
            .filter((j: any) => String(j.teacherId || j.judgeId || j.Id || j.id) === String(currentTeacherId))
            .map((j: any) => String(j.trackId || j.trackID));
        } catch {
          // Backup: Quét từng track nếu BE không có API lấy toàn bộ Judge
          await Promise.all(
            allTracks.map(async (track: any) => {
              const tid = track.trackId || track.id;
              try {
                const judges = await apiClient.get(`/api/Judge/track/${tid}`);
                const isMine = getList(judges.data).some((j: any) => 
                  String(j.id || j.Id || j.judgeId || j.teacherId) === String(currentTeacherId)
                );
                if (isMine) myTrackIds.push(String(tid));
              } catch (e) {}
            })
          );
        }

        // 3. Lọc ra Đội thi & Điểm số của riêng Giám khảo này
        const myTeams = allTeams.filter((t: any) => myTrackIds.includes(String(t.trackId || t.trackID)));
        const myEvaluations = allEvaluations.filter((ev: any) => 
          String(ev.teacherId || ev.judgeId || ev.TeacherId) === String(currentTeacherId)
        );

        // 4. Trộn dữ liệu & Dò tìm criteriaSetId của Vòng thi
        const enrichedTeams = myTeams.map((team: any) => {
          const track = allTracks.find((t: any) => String(t.id || t.trackId) === String(team.trackId || team.trackID));
          const event = allEvents.find((e: any) => String(e.id) === String(track?.eventId || track?.eventID));
          
          let criteriaSetId = null;
          if (event && event.currentRound >= 0) {
             const evRounds = allRounds.filter((r: any) => String(r.eventId || r.eventID) === String(event.id));
             const curRound = evRounds.find((r: any) => r.roundIndex === event.currentRound);
             criteriaSetId = curRound?.criteriaSetID || curRound?.criteriaSetId;
          }

          const teamEval = myEvaluations.find((ev: any) => String(ev.teamId || ev.teamID) === String(team.id));

          return {
            id: team.id,
            name: team.teamName || team.name || "Đội chưa đặt tên",
            track: track?.trackName || "Chưa rõ",
            status: teamEval ? "Đã chấm" : "Chưa chấm",
            score: teamEval ? `${teamEval.score ?? teamEval.totalScore ?? 0}đ` : "—",
            evaluationId: teamEval ? (teamEval.id || teamEval.evaluationId) : null,
            details: teamEval ? teamEval.details : null,
            feedback: teamEval ? teamEval.feedback : "",
            criteriaSetId: criteriaSetId
          };
        });

        setTeams(enrichedTeams);
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
      String(team.id).includes(searchTerm);
    const matchStatus =
      statusFilter === "Tất cả trạng thái" || team.status === statusFilter;
    return matchSearch && matchStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const indexOfLastTeam = currentPage * itemsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - itemsPerPage;
  const currentTeams = filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalTeams = teams.length;
  const completedTeams = teams.filter((t) => t.status === "Đã chấm").length;
  const pendingTeams = teams.filter((t) => t.status === "Chưa chấm").length;
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
              {user?.fullName || user?.name || "Giám Khảo"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Hội đồng chuyên môn
            </p>
          </div>
          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-blue-600 transition-colors uppercase">
            {(user?.fullName || user?.name || "G")[0]}
          </div>
        </button>
      </header>

      <main className="max-w-6xl mx-auto mt-8 space-y-6 px-4">
        {/* STATS CARD */}
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
                  Đội của tôi
                </span>
                <span className="text-2xl font-bold">{totalTeams}</span>
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
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  Chưa chấm
                </span>
                <span className="text-2xl font-bold text-slate-400">
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

        {/* TABLE */}
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
                placeholder="Tìm kiếm tên đội thi..."
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
                    Đang tải dữ liệu từ Server...
                  </td>
                </tr>
              ) : currentTeams.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500 font-medium"
                  >
                    Bạn chưa được phân công đội thi nào, hoặc chưa có đội nào
                    nộp bài.
                  </td>
                </tr>
              ) : (
                currentTeams.map((team, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 transition-colors bg-white"
                  >
                    <td className="px-6 py-5 font-bold text-slate-900 text-sm">
                      {team.name}
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium text-xs">
                      {team.track}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {team.status === "Đã chấm" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold border border-emerald-100">
                          <CheckCircle2 size={12} /> Đã chấm
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[11px] font-bold border border-slate-200">
                          <ListTodo size={12} /> Chưa chấm
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-slate-900 text-base">
                      {team.score}
                    </td>
                    <td className="px-6 py-5 flex justify-end gap-2">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
