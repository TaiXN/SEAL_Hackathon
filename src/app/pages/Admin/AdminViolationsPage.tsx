import { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  X,
  HelpCircle,
  Ban,
  Unlock,
  Activity,
} from "lucide-react";
import Swal from "sweetalert2";

import apiClient from "../../lib/api/apiClient";

const getList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

export function AdminViolationsPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả tình trạng");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [violationReason, setViolationReason] = useState("");

  // 1. Lấy danh sách vòng thi
  useEffect(() => {
    apiClient
      .get("/api/Round")
      .then((res) => setRounds(getList(res.data)))
      .catch((err) => console.error("Lỗi lấy danh sách Vòng thi", err));
  }, []);

  // 2. Khi chọn vòng thi, lấy danh sách đội
  const fetchTeams = async (roundId: string) => {
    if (!roundId) {
      setTeams([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await apiClient.get(
        `/api/TeamInRound/details/round/${roundId}`,
      );

      const mappedTeams = getList(res.data).map((t: any) => ({
        id: t.id || t.teamInRoundId,
        name: t.teamName || t.name || `Đội ${t.teamId}`,
        isBanned: t.isBanned || t.status === "Banned",
        reason: "-", // API có thể chưa support gửi kèm lý do lúc fetch về
      }));

      setTeams(mappedTeams);
    } catch (error) {
      console.error("Lỗi lấy danh sách đội:", error);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams(selectedRoundId);
  }, [selectedRoundId]);

  const filteredTeams = teams.filter((team) => {
    const matchSearch = team.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "Tất cả tình trạng" ||
      (statusFilter === "Hợp lệ" && !team.isBanned) ||
      (statusFilter === "Đã loại" && team.isBanned);
    return matchSearch && matchStatus;
  });

  const openDisqualifyModal = (id: string, name: string) => {
    setSelectedTeam({ id, name });
    setViolationReason("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeam(null);
  };

  // 3. API BAN (CẤM)
  const handleConfirmDisqualify = async () => {
    if (!violationReason.trim()) {
      return Swal.fire(
        "Thiếu thông tin",
        "Vui lòng nhập lý do loại đội thi!",
        "error",
      );
    }

    try {
      // Vì API không yêu cầu Body cho BAN, nhưng ta vẫn truyền reason đề phòng BE lấy vào Logs
      await apiClient.put(`/api/TeamInRound/ban/${selectedTeam?.id}`, {
        reason: violationReason,
      });

      closeModal();
      Swal.fire({
        icon: "success",
        title: "Đã xử lý!",
        text: `Đội ${selectedTeam?.name} đã bị loại khỏi hệ thống.`,
        timer: 1500,
        showConfirmButton: false,
      });
      fetchTeams(selectedRoundId); // Cập nhật lại list
    } catch (error: any) {
      Swal.fire(
        "Lỗi",
        error?.response?.data || "Không thể loại đội thi này!",
        "error",
      );
    }
  };

  // 4. API UNBAN (GỠ CẤM)
  const handleUnbanTeam = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Gỡ lệnh cấm?",
      text: `Đội ${name} sẽ được phép tiếp tục thi đấu.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý Gỡ cấm",
    });

    if (result.isConfirmed) {
      try {
        await apiClient.put(`/api/TeamInRound/unban/${id}`);
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchTeams(selectedRoundId);
      } catch (error) {
        Swal.fire("Lỗi", "Không thể gỡ cấm đội thi này!", "error");
      }
    }
  };

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300 relative">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Vi phạm & Kỷ luật
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Kiểm soát vi phạm quy chế và ghi nhận lý do vào nhật ký hệ thống.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {/* DROPDOWN CHỌN VÒNG THI */}
        <div className="mb-8 pb-6 border-b border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Chọn Vòng thi để kiểm soát
          </label>
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            className="w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer"
          >
            <option value="">-- Chọn Vòng thi --</option>
            {rounds.map((r: any) => (
              <option key={r.id || r.roundId} value={r.id || r.roundId}>
                {r.roundName || r.name}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`transition-all duration-300 ${!selectedRoundId ? "opacity-30 pointer-events-none" : ""}`}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-[400px]">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên đội thi..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none"
            >
              <option value="Tất cả tình trạng">Tất cả tình trạng</option>
              <option value="Hợp lệ">Hợp lệ</option>
              <option value="Đã loại">Đã loại</option>
            </select>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Tên Đội</th>
                  <th className="px-6 py-4 text-center">Tình trạng</th>
                  <th className="px-6 py-4">Lý do vi phạm</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      <Activity
                        className="animate-spin inline mr-2 mb-1"
                        size={18}
                      />{" "}
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500 font-medium"
                    >
                      {!selectedRoundId
                        ? "Vui lòng chọn Vòng thi."
                        : "Không tìm thấy đội thi nào phù hợp."}
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 font-bold text-slate-900">
                        {team.name}
                      </td>
                      <td className="px-6 py-5 text-center">
                        {!team.isBanned ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold border border-emerald-100">
                            Hợp lệ
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[11px] font-bold border border-red-100">
                            Đã loại
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-5 font-medium text-xs ${!team.reason || team.reason === "-" ? "text-slate-400" : "text-slate-700"}`}
                      >
                        {team.reason || "-"}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {!team.isBanned ? (
                          <button
                            onClick={() =>
                              openDisqualifyModal(team.id, team.name)
                            }
                            className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 flex items-center gap-1 ml-auto"
                          >
                            <Ban size={14} /> Loại đội thi
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnbanTeam(team.id, team.name)}
                            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-black flex items-center gap-1 ml-auto"
                          >
                            <Unlock size={14} /> Gỡ cấm
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3 text-red-500">
                <div className="bg-red-50 p-2 rounded-full">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Xác nhận loại đội thi {selectedTeam?.name}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Hành động này sẽ cấm đội <b>{selectedTeam?.name}</b> tiếp tục
                thi đấu.
              </p>
              <div>
                <label className="text-sm font-bold text-slate-900 flex gap-1 items-center">
                  Lý do loại <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  className="w-full mt-2 border border-slate-200 rounded-xl p-4 text-sm focus:border-red-500 outline-none resize-none h-28"
                  placeholder="Nhập lý do vi phạm quy chế..."
                ></textarea>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDisqualify}
                className="px-5 py-2.5 bg-[#ef4444] text-white text-sm font-bold rounded-xl hover:bg-red-600"
              >
                Xác nhận Loại
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
