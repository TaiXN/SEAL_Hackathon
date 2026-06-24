import { useState, useEffect } from "react";
import { Search, AlertTriangle, X, HelpCircle } from "lucide-react";
import Swal from "sweetalert2";

// [NOTE] Thêm Interface để TypeScript không báo lỗi never[]
interface Team {
  id: string;
  name: string;
  status: string;
  reason: string;
}

export function AdminViolationsPage() {
  // [NOTE] Khởi tạo mảng rỗng, chờ dữ liệu từ API
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả tình trạng");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [violationReason, setViolationReason] = useState("");

  // ==========================================
  // [NOTE] HÀM GỌI API LẤY DANH SÁCH ĐỘI THI
  // ==========================================
  const fetchTeams = async () => {
    // [GỌI API CHỖ NÀY]: GET /api/teams?search={searchTerm}&status={statusFilter}
    // Ví dụ: const res = await axios.get(`/api/teams?search=${searchTerm}&status=${statusFilter}`);
    // setTeams(res.data);
    console.log(
      "Đang gọi API lấy danh sách đội thi với filter:",
      statusFilter,
      "và search:",
      searchTerm,
    );
  };

  // Tự động gọi API mỗi khi load trang hoặc khi user gõ tìm kiếm/đổi bộ lọc
  useEffect(() => {
    fetchTeams();
  }, [searchTerm, statusFilter]);

  const openDisqualifyModal = (id: string, name: string) => {
    setSelectedTeam({ id, name });
    setViolationReason("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeam(null);
  };

  const handleConfirmDisqualify = async () => {
    if (!violationReason.trim()) {
      Swal.fire({
        icon: "error",
        title: "Thiếu thông tin",
        text: "Vui lòng nhập lý do loại đội thi!",
      });
      return;
    }

    // ==========================================
    // [NOTE] HÀM GỌI API ĐỂ LOẠI ĐỘI THI
    // ==========================================
    // [GỌI API CHỖ NÀY]: PUT hoặc POST /api/teams/{selectedTeam?.id}/disqualify
    // Body truyền lên: { reason: violationReason }
    console.log(
      `Đã gửi API loại đội ID: ${selectedTeam?.id} với lý do: ${violationReason}`,
    );

    // Đợi gọi API thành công xong thì báo và Load lại DB:
    closeModal();
    Swal.fire({
      icon: "success",
      title: "Đã xử lý!",
      text: `Đội ${selectedTeam?.name} đã bị loại.`,
      confirmButtonColor: "#0f172a",
      timer: 2000,
      showConfirmButton: false,
    });

    fetchTeams(); // Cập nhật lại danh sách mới nhất từ server
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
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          Kiểm soát vi phạm quy chế
        </h3>
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
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-slate-400 transition-colors shadow-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none shadow-sm cursor-pointer"
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
              {/* [NOTE] Đổi filteredTeams thành mảng teams thẳng luôn */}
              {teams.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500 font-medium"
                  >
                    Không tìm thấy đội thi nào phù hợp.
                  </td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr
                    key={team.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-5 font-bold text-slate-900">
                      {team.name}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {team.status === "Hợp lệ" ? (
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
                      className={`px-6 py-5 font-medium text-xs ${team.reason === "-" || !team.reason ? "text-slate-400" : "text-slate-700"}`}
                    >
                      {team.reason || "-"}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {team.status === "Hợp lệ" ? (
                        <button
                          onClick={() =>
                            openDisqualifyModal(team.id, team.name)
                          }
                          className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-red-700 transition-colors"
                        >
                          Loại đội thi
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-xs font-semibold pr-4">
                          Đã xử lý
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <button className="fixed bottom-6 right-6 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-500 hover:text-black hover:border-black transition-colors z-20">
        <HelpCircle size={18} />
      </button>

      {/* MODAL XÁC NHẬN LOẠI */}
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
                Hành động này sẽ loại đội <b>{selectedTeam?.name}</b> khỏi cuộc
                thi và ghi vào nhật ký hệ thống. Không thể hoàn tác.
              </p>
              <div>
                <label className="text-sm font-bold text-slate-900 flex gap-1 items-center">
                  Lý do loại <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2 mt-0.5">
                  Bắt buộc nhập vào nhật ký hệ thống
                </p>
                <textarea
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-4 text-sm font-medium focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all resize-none h-28"
                  placeholder="Nhập lý do vi phạm..."
                ></textarea>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDisqualify}
                className="px-5 py-2.5 bg-[#ef4444] text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors shadow-sm"
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
