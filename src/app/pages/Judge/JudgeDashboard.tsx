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

import apiClient from "../../lib/api/apiClient";
import { useAuthStore } from "../../stores/auth.store";

const decodeJwt = (token: string | null): any => {
  if (!token) return {};
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(base64))));
  } catch {
    return {};
  }
};

export default function JudgeDashboard() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // FETCH DATA TỪ API "CHÂN ÁI" CỦA BACKEND
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!currentTeacherId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await apiClient.get(
          `/api/Judge/dashboard-assignments/${currentTeacherId}`,
        );

        // Map data trả về từ Backend để khớp với UI của Frontend
        const mappedTeams = (res.data || []).map((item: any) => {
          // Xác định trạng thái dựa trên ID trả về
          let statusLabel = "Chưa nộp bài";
          if (item.evaluationId) {
            statusLabel = "Đã chấm";
          } else if (item.submissionId) {
            statusLabel = "Chưa chấm";
          }

          return {
            id: item.teamId,
            name: item.teamName,
            track: item.trackName,
            eventName: item.eventName,
            criteriaSetId: item.criteriaSetId,
            submissionId: item.submissionId,
            evaluationId: item.evaluationId,
            score: item.score ?? "—",
            status: statusLabel,
            isEmpty: false,
          };
        });

        setTeams(mappedTeams);
      } catch (error) {
        console.error("Lỗi lấy danh sách phân công:", error);
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [currentTeacherId]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTeams = teams.filter((team) => {
    const matchSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.track.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Thống kê
  const completedTeams = teams.filter((t) => t.status === "Đã chấm").length;
  const pendingTeams = teams.filter((t) => t.status === "Chưa chấm").length;
  const totalTeams = completedTeams + pendingTeams;
  const completedPercent =
    totalTeams === 0 ? 0 : Math.round((completedTeams / totalTeams) * 100);

  // Đếm số hạng mục duy nhất
  const uniqueTracks = new Set(teams.map((t) => t.track)).size;

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
                  {uniqueTracks}
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
                    />{" "}
                    Đang tải dữ liệu phân công...
                  </td>
                </tr>
              ) : currentTeams.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500 font-medium"
                  >
                    Không tìm thấy bài thi nào phù hợp.
                  </td>
                </tr>
              ) : (
                currentTeams.map((team, idx) => (
                  <tr
                    key={idx}
                    className="transition-colors bg-white hover:bg-slate-50"
                  >
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-900 text-sm">
                        {team.name}
                      </span>
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
                      {team.status === "Đã chấm" ? (
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
                      {team.status === "Chưa nộp bài" ? (
                        <button
                          disabled
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-sm"
                        >
                          <Clock size={14} /> Chờ nộp bài
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            navigate(`/judge/score/${team.submissionId}`, {
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
          {/* Phân trang (Giữ nguyên) */}
        </div>
      </main>
    </div>
  );
}
