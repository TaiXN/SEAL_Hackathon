import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hexagon,
  Search,
  Lock,
  Unlock,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import Swal from "sweetalert2";

export function JudgeDashboard() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<any[]>([]);

  // ĐỌC DỮ LIỆU LÚC MỞ TRANG
  useEffect(() => {
    // DÀNH CHO BACKEND:
    // TODO: Gọi API GET /api/judge/teams để lấy danh sách đội thi được phân công chấm

    // Tạm thời dùng Mock Data để hiển thị
    const mockTeams = [
      {
        id: "01",
        name: "TechWizards",
        track: "Business Analysis App",
        status: "Đã khóa điểm",
        score: "85.0đ",
      },
      {
        id: "02",
        name: "Syntax Errors",
        track: "Code Generation & Review",
        status: "Đang chấm",
        score: "—",
      },
      {
        id: "03",
        name: "Alpha Coders",
        track: "AI / Machine Learning",
        status: "Chưa chấm",
        score: "—",
      },
      {
        id: "04",
        name: "Logic Legion",
        track: "Requirements Engineering",
        status: "Đã khóa điểm",
        score: "92.0đ",
      },
      {
        id: "05",
        name: "Ctrl Alt Defeat",
        track: "Software Design App",
        status: "Chưa chấm",
        score: "—",
      },
      {
        id: "06",
        name: "Byte Me",
        track: "Business Analysis App",
        status: "Chưa chấm",
        score: "—",
      },
      {
        id: "07",
        name: "Code Blooded",
        track: "AI / Machine Learning",
        status: "Đã khóa điểm",
        score: "78.0đ",
      },
      {
        id: "08",
        name: "Data Pirates",
        track: "Requirements Engineering",
        status: "Đang chấm",
        score: "—",
      },
      {
        id: "09",
        name: "Error 404",
        track: "Software Design App",
        status: "Chưa chấm",
        score: "—",
      },
      {
        id: "10",
        name: "FrontEnd Fanatics",
        track: "Code Generation & Review",
        status: "Đã khóa điểm",
        score: "88.0đ",
      },
      {
        id: "11",
        name: "Git Commit",
        track: "Business Analysis App",
        status: "Chưa chấm",
        score: "—",
      },
      {
        id: "12",
        name: "Hello World",
        track: "AI / Machine Learning",
        status: "Đã khóa điểm",
        score: "95.0đ",
      },
      {
        id: "13",
        name: "Infinite Loop",
        track: "Requirements Engineering",
        status: "Chưa chấm",
        score: "—",
      },
      {
        id: "14",
        name: "Java Jugglers",
        track: "Software Design App",
        status: "Đang chấm",
        score: "—",
      },
      {
        id: "15",
        name: "Null Pointers",
        track: "Code Generation & Review",
        status: "Chưa chấm",
        score: "—",
      },
    ];
    setTeams(mockTeams);
  }, []);

  // --- HÀM MỞ KHÓA TRỰC TIẾP TỪ DASHBOARD ---
  const handleUnlockTeam = (teamId: string, teamName: string) => {
    Swal.fire({
      title: "Mở khóa điểm?",
      html: `Bạn có chắc muốn mở khóa cho đội <b>${teamName}</b>?<br/>Điểm số sẽ được chuyển về trạng thái Đang chấm.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Mở khóa ngay",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        // DÀNH CHO BACKEND:
        // TODO: Gọi API PUT/PATCH /api/judge/teams/{teamId}/unlock để mở khóa điểm
        console.log("API Mở khóa điểm cho đội ID:", teamId);

        // Cập nhật State cục bộ để giao diện đổi ngay lập tức
        setTeams((prevTeams) =>
          prevTeams.map((t) =>
            t.id === teamId ? { ...t, status: "Đang chấm", score: "—" } : t,
          ),
        );

        Swal.fire({
          icon: "success",
          title: "Đã mở khóa!",
          text: "Bạn có thể tiếp tục chấm điểm cho đội này.",
          confirmButtonColor: "#0f172a",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [trackFilter, setTrackFilter] = useState("Tất cả hạng mục");
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueTracks = Array.from(new Set(teams.map((t) => t.track)));

  const filteredTeams = teams.filter((team) => {
    const matchSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.id.includes(searchTerm);
    const matchStatus =
      statusFilter === "Tất cả trạng thái" || team.status === statusFilter;
    const matchTrack =
      trackFilter === "Tất cả hạng mục" || team.track === trackFilter;
    return matchSearch && matchStatus && matchTrack;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, trackFilter]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const indexOfLastTeam = currentPage * itemsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - itemsPerPage;
  const currentTeams = filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalTeams = teams.length;
  const completedTeams = teams.filter(
    (t) => t.status === "Đã khóa điểm",
  ).length;
  const inProgressTeams = teams.filter((t) => t.status === "Đang chấm").length;
  const pendingTeams = teams.filter((t) => t.status === "Chưa chấm").length;

  const completedPercent =
    totalTeams === 0 ? 0 : Math.round((completedTeams / totalTeams) * 100);
  const inProgressPercent =
    totalTeams === 0 ? 0 : Math.round((inProgressTeams / totalTeams) * 100);

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
          onClick={() => navigate("profile")}
          className="flex items-center gap-3 cursor-pointer text-left group"
        >
          <div className="text-right">
            <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              GK. Nguyễn Văn A
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Hội đồng chấm thi Vòng Bảng
            </p>
          </div>
          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-blue-600 transition-colors">
            A
          </div>
        </button>
      </header>

      <main className="max-w-6xl mx-auto mt-8 space-y-6 px-4">
        {/* STATS CARD */}
        <div className="bg-[#111111] rounded-2xl p-8 text-white shadow-xl flex justify-between items-center">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📊</span> TIẾN ĐỘ CHẤM THI CỦA BẠN
            </h2>
            <p className="text-slate-400 text-sm">
              Hệ thống tự động ghi nhận và khóa điểm sau khi hoàn tất phiếu
              chấm.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center bg-white/10 px-4 py-2 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Tổng số
                </span>
                <span className="text-2xl font-bold">{totalTeams}</span>
              </div>
              <div className="flex flex-col items-center px-4 py-2">
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{" "}
                  Đã chấm
                </span>
                <span className="text-2xl font-bold text-emerald-500">
                  {completedTeams}
                </span>
              </div>
              <div className="flex flex-col items-center px-4 py-2">
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>{" "}
                  Đang chấm
                </span>
                <span className="text-2xl font-bold text-amber-500">
                  {inProgressTeams}
                </span>
              </div>
              <div className="flex flex-col items-center px-4 py-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>{" "}
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
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${completedPercent}%` }}
                ></div>
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${inProgressPercent}%` }}
                ></div>
              </div>
              <div className="flex gap-3 text-[9px] text-slate-400 pt-1 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{" "}
                  Đã chấm
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>{" "}
                  Đang chấm
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>{" "}
                  Chưa chấm
                </span>
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
                placeholder="Tìm kiếm tên đội thi hoặc lượt thi..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 transition-colors shadow-sm"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none shadow-sm cursor-pointer"
              >
                <option value="Tất cả trạng thái">Tất cả trạng thái</option>
                <option value="Đã khóa điểm">Đã khóa điểm</option>
                <option value="Đang chấm">Đang chấm</option>
                <option value="Chưa chấm">Chưa chấm</option>
              </select>
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none shadow-sm cursor-pointer"
              >
                <option value="Tất cả hạng mục">Tất cả hạng mục</option>
                {uniqueTracks.map((track) => (
                  <option key={track as string} value={track as string}>
                    {track as string}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-center w-24">Lượt thi</th>
                <th className="px-6 py-4 w-1/4">Tên đội thi</th>
                <th className="px-6 py-4">Hạng mục thi đấu</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-center w-24">Điểm số</th>
                <th className="px-6 py-4 text-right w-56">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentTeams.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <p className="font-semibold">
                      Không tìm thấy đội thi nào phù hợp với bộ lọc.
                    </p>
                  </td>
                </tr>
              ) : (
                currentTeams.map((team, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 transition-colors group bg-white"
                  >
                    <td className="px-6 py-5 text-center font-bold text-slate-400 text-xs">
                      {team.id}
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-900 text-sm">
                      {team.name}
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium text-xs">
                      {team.track}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {team.status === "Đã khóa điểm" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold border border-emerald-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>{" "}
                          Đã khóa điểm
                        </span>
                      )}
                      {team.status === "Đang chấm" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>{" "}
                          Đang chấm
                        </span>
                      )}
                      {team.status === "Chưa chấm" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[11px] font-bold border border-slate-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>{" "}
                          Chưa chấm
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-slate-900 text-base">
                      {team.score}
                    </td>
                    <td className="px-6 py-5 flex justify-end gap-2">
                      {team.status === "Đã khóa điểm" && (
                        <>
                          <button
                            onClick={() => handleUnlockTeam(team.id, team.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
                          >
                            <Unlock size={14} /> Mở khóa
                          </button>

                          <button
                            onClick={() =>
                              navigate("score", { state: { team } })
                            }
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            Xem lại
                          </button>
                        </>
                      )}
                      {team.status === "Đang chấm" && (
                        <button
                          onClick={() => navigate("score", { state: { team } })}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          Tiếp tục <ArrowRight size={14} />
                        </button>
                      )}
                      {team.status === "Chưa chấm" && (
                        <button
                          onClick={() => navigate("score", { state: { team } })}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm"
                        >
                          <PlayCircle size={14} className="text-blue-500" />{" "}
                          Chấm ngay
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
