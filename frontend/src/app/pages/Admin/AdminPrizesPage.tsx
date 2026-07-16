import { useState, useEffect } from "react";
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Gift,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Filter,
  Search,
} from "lucide-react";
import Swal from "sweetalert2";
import { eventApi } from "../../lib/api/eventApi";
import { prizeApi, type PrizeData } from "../../lib/api/prizeApi";

const isInactiveRecord = (obj: any): boolean => {
  if (!obj) return false;
  if (obj.isDeleted === true || obj.IsDeleted === true) return true;
  if (obj.isActive === false || obj.IsActive === false) return true;
  const statusStr = String(obj.status ?? obj.Status ?? "").toLowerCase();
  if (statusStr === "deleted" || statusStr === "inactive") return true;
  return false;
};
// create new page for admin to show & manage prizes
export function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<PrizeData[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // State phục vụ cho Bộ lọc và Tìm kiếm
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Tải danh sách Sự kiện (Chỉ chạy 1 lần lúc mở trang)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await eventApi.getAllEvents();
        setEvents(eventsData || []);
      } catch (err) {
        console.error("Lỗi tải sự kiện:", err);
      }
    };
    fetchEvents();
  }, []);

  // 2. Tải danh sách Giải thưởng (Chạy mỗi khi đổi Event hoặc F5)
  const fetchPrizes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let prizesData;

      // LOGIC XÀI API MỚI NHƯ BÀ YÊU CẦU NÈ:
      if (selectedEventId) {
        prizesData = await prizeApi.getPrizesByEvent(selectedEventId);
      } else {
        prizesData = await prizeApi.getAllPrizes();
      }

      setPrizes(prizesData || []);
    } catch (err: any) {
      console.error("Lỗi tải dữ liệu:", err);
      setError("Không thể tải danh sách Giải thưởng. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Lắng nghe sự thay đổi của Dropdown Event để gọi lại API
  useEffect(() => {
    fetchPrizes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  // Lọc dữ liệu hiển thị (kết hợp Tìm kiếm chữ)
  const filteredPrizes = prizes.filter((p) =>
    p.prizeName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const activePrizes = filteredPrizes.filter((p) => !isInactiveRecord(p));
  const deletedPrizes = filteredPrizes.filter((p) => isInactiveRecord(p));

  // ==========================================
  // CÁC HÀM CRUD BÊN DƯỚI GIỮ NGUYÊN NHƯ CŨ
  // ==========================================

  const handleCreatePrize = async () => {
    if (events.length === 0) {
      return Swal.fire(
        "Khoan đã!",
        "Hệ thống chưa có Sự kiện nào. Hãy tạo Sự kiện trước khi tạo Giải thưởng.",
        "warning",
      );
    }

    const eventOptions = events
      .map(
        (e) =>
          `<option value="${e.id || e.eventID}">${e.name || e.eventName}</option>`,
      )
      .join("");

    const { value: formValues } = await Swal.fire({
      title: "Tạo Giải Thưởng Mới",
      html: `
        <input id="sw-name" class="swal2-input" placeholder="Tên Giải Thưởng (VD: Giải Nhất)">
        <input id="sw-desc" class="swal2-input" placeholder="Mô tả / Phần thưởng">
        <select id="sw-event" class="swal2-input" style="display:flex; width: 275px; font-size: 16px;">
          <option value="" disabled selected>-- Chọn Sự Kiện --</option>
          ${eventOptions}
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Tạo mới",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#0f172a",
      preConfirm: () => {
        const name = (document.getElementById("sw-name") as HTMLInputElement)
          .value;
        const desc = (document.getElementById("sw-desc") as HTMLInputElement)
          .value;
        const eventId = (
          document.getElementById("sw-event") as HTMLSelectElement
        ).value;
        if (!name || !eventId) {
          Swal.showValidationMessage("Vui lòng nhập Tên giải và chọn Sự kiện!");
          return false;
        }
        return { prizeName: name, description: desc, eventId };
      },
    });

    if (formValues) {
      try {
        await prizeApi.createPrize(formValues);
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          timer: 1200,
          showConfirmButton: false,
        });
        fetchPrizes(); // Gọi lại để load data mới
      } catch (err: any) {
        Swal.fire(
          "Lỗi",
          "Không thể tạo giải thưởng. " + (err.response?.data?.message || ""),
          "error",
        );
      }
    }
  };

  const handleEditPrize = async (prize: PrizeData) => {
    const pId = prize.id || prize.prizeId;
    if (!pId) return;

    const { value: formValues } = await Swal.fire({
      title: "Cập nhật Giải Thưởng",
      html: `
        <input id="sw-name" class="swal2-input" placeholder="Tên Giải" value="${prize.prizeName || ""}">
        <input id="sw-desc" class="swal2-input" placeholder="Mô tả" value="${prize.description || ""}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#0f172a",
      preConfirm: () => {
        const name = (document.getElementById("sw-name") as HTMLInputElement)
          .value;
        const desc = (document.getElementById("sw-desc") as HTMLInputElement)
          .value;
        if (!name) {
          Swal.showValidationMessage("Tên giải không được để trống!");
          return false;
        }
        return { prizeName: name, description: desc };
      },
    });

    if (formValues) {
      try {
        await prizeApi.updatePrize(pId, formValues);
        Swal.fire({
          icon: "success",
          title: "Đã lưu!",
          timer: 1200,
          showConfirmButton: false,
        });
        fetchPrizes();
      } catch (err: any) {
        Swal.fire(
          "Lỗi",
          "Không thể cập nhật. " + (err.response?.data?.message || ""),
          "error",
        );
      }
    }
  };

  const handleDeletePrize = async (prize: PrizeData) => {
    const pId = prize.id || prize.prizeId;
    if (!pId) return;

    const result = await Swal.fire({
      title: "Xóa giải thưởng?",
      text: `Bạn có chắc muốn xóa "${prize.prizeName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await prizeApi.deletePrize(pId);
        Swal.fire({
          icon: "success",
          title: "Đã xóa!",
          timer: 1200,
          showConfirmButton: false,
        });
        fetchPrizes();
      } catch (err: any) {
        Swal.fire(
          "Lỗi",
          "Không thể xóa. " + (err.response?.data?.message || ""),
          "error",
        );
      }
    }
  };

  const handleRestorePrize = async (prize: PrizeData) => {
    const pId = prize.id || prize.prizeId;
    if (!pId) return;
    try {
      await prizeApi.restorePrize(pId);
      Swal.fire({
        icon: "success",
        title: "Đã khôi phục!",
        timer: 1200,
        showConfirmButton: false,
      });
      fetchPrizes();
    } catch (err: any) {
      Swal.fire(
        "Lỗi",
        "Khôi phục thất bại. " + (err.response?.data?.message || ""),
        "error",
      );
    }
  };

  const handleManualAssign = async (prize: PrizeData) => {
    const pId = prize.id || prize.prizeId;
    if (!pId) return;

    const { value: teamId } = await Swal.fire({
      title: "Trao giải cho đội",
      text: `Nhập ID của đội thi để trao giải "${prize.prizeName}"`,
      input: "text",
      inputPlaceholder: "Nhập Team ID...",
      showCancelButton: true,
      confirmButtonText: "Trao giải",
      confirmButtonColor: "#10b981",
      inputValidator: (val) => {
        if (!val.trim()) return "Team ID không được để trống!";
      },
    });

    if (teamId) {
      try {
        await prizeApi.manualAssign({ prizeId: pId, teamId: teamId.trim() });
        Swal.fire({
          icon: "success",
          title: "Đã trao giải!",
          timer: 1200,
          showConfirmButton: false,
        });
        fetchPrizes();
      } catch (err: any) {
        Swal.fire(
          "Lỗi",
          "Trao giải thất bại. Hãy kiểm tra lại Team ID. " +
            (err.response?.data?.message || ""),
          "error",
        );
      }
    }
  };

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Trophy size={32} className="text-amber-500" />
              Quản lý Giải thưởng
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              Khởi tạo và trao giải cho các đội xuất sắc nhất.
            </p>
          </div>
          <button
            onClick={handleCreatePrize}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus size={18} /> Thêm Giải Thưởng
          </button>
        </div>

        {/* THANH CÔNG CỤ FILTER VÀ SEARCH */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          {/* Filter Dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Filter size={18} />
            </div>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 min-w-[250px] w-full cursor-pointer transition-colors"
            >
              <option value="">🏆 Tất cả Sự kiện</option>
              {events.map((e) => (
                <option key={e.id || e.eventID} value={e.id || e.eventID}>
                  {e.name || e.eventName}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="flex items-center relative w-full sm:w-72">
            <Search size={16} className="text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Tìm tên giải thưởng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="font-semibold text-sm flex-1">{error}</p>
            <button
              onClick={fetchPrizes}
              className="px-3 py-1.5 bg-red-100 rounded-lg hover:bg-red-200 text-xs font-bold transition"
            >
              <RefreshCw size={14} className="inline mr-1" /> Thử lại
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-slate-500">
            <Loader2 size={30} className="animate-spin text-blue-500" />
            <p className="font-medium">Đang tải danh sách giải thưởng...</p>
          </div>
        ) : (
          <>
            {/* DANH SÁCH GIẢI THƯỞNG ACTIVE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activePrizes.length === 0 && !error ? (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-300 rounded-2xl">
                  <Gift size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">
                    {searchTerm || selectedEventId
                      ? "Không tìm thấy giải thưởng nào khớp với bộ lọc."
                      : "Chưa có giải thưởng nào. Hãy tạo mới nhé!"}
                  </p>
                </div>
              ) : (
                activePrizes.map((prize, idx) => {
                  const eventName =
                    events.find((e) => (e.id || e.eventID) === prize.eventId)
                      ?.name || "N/A";
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col h-full"
                    >
                      {prize.teamId && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 z-10 shadow-sm">
                          <CheckCircle size={12} /> ĐÃ TRAO
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-800 mb-2 mt-1 pr-16 leading-tight">
                          {prize.prizeName}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                          {prize.description || "Không có mô tả"}
                        </p>

                        <div className="bg-slate-50 rounded-lg p-3 text-xs font-medium text-slate-600 mb-4 border border-slate-100">
                          <div className="mb-1 truncate" title={eventName}>
                            <strong>Sự kiện:</strong> {eventName}
                          </div>
                          {prize.teamId && (
                            <div>
                              <strong className="text-emerald-600">
                                Team ID:
                              </strong>{" "}
                              {prize.teamId}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => handleManualAssign(prize)}
                          className="flex-1 bg-emerald-50 text-emerald-700 font-bold text-xs py-2 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
                        >
                          {prize.teamId ? "Đổi đội" : "Trao giải"}
                        </button>
                        <button
                          onClick={() => handleEditPrize(prize)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition"
                          title="Sửa giải thưởng"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePrize(prize)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition"
                          title="Xóa giải thưởng"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* THÙNG RÁC - GIẢI THƯỞNG ĐÃ XÓA */}
            {deletedPrizes.length > 0 && (
              <div className="mt-12 pt-6 border-t-2 border-dashed border-slate-200">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <RotateCcw size={16} /> Các giải thưởng đã xóa
                </h3>
                <div className="flex flex-wrap gap-3">
                  {deletedPrizes.map((prize, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white border border-slate-200 pl-4 pr-2 py-2 rounded-xl shadow-sm opacity-70"
                    >
                      <div>
                        <p
                          className="text-sm font-bold text-slate-600 line-through max-w-[200px] truncate"
                          title={prize.prizeName}
                        >
                          {prize.prizeName}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestorePrize(prize)}
                        title="Khôi phục giải thưởng"
                        className="p-2 bg-slate-100 text-emerald-600 rounded-lg hover:bg-emerald-50 transition shrink-0"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
