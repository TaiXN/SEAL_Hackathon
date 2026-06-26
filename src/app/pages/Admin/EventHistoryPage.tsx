import { useState, useEffect } from "react";
import { Plus, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { eventApi } from "../../lib/api/eventApi";
import { roundApi } from "../../lib/api/roundApi";

export function EventHistoryPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const [data, allRounds] = await Promise.all([
        eventApi.getAllEvents(),
        roundApi.getAllRounds().catch(() => []),
      ]);

      const enrichedData = data.map((e: any) => {
        const evRounds = allRounds.filter(
          (r: any) => String(r.eventId || r.eventID) === String(e.id),
        );
        return {
          ...e,
          maxRounds: evRounds.length > 0 ? evRounds.length : 2,
        };
      });

      setEvents(enrichedData);
    } catch (error) {
      Swal.fire("Lỗi", "Không tải được danh sách sự kiện", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center font-medium text-slate-500">
        Đang tải danh sách...
      </div>
    );
  }

  const handleDeleteEvent = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Xóa sự kiện?",
      html: `Bạn có chắc chắn muốn xóa sự kiện <b>${name}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await eventApi.deleteEvent(id);
        Swal.fire("Đã xóa!", "Sự kiện đã được xóa.", "success");
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.id !== id),
        );
      } catch (error) {
        Swal.fire("Lỗi", "Xóa thất bại, check lại mạng hoặc quyền.", "error");
      }
    }
  };

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Quản lý Sự kiện
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Xem lịch sử lưu trữ các kỳ thi trước hoặc khởi tạo kỳ thi mới.
          </p>
        </div>
        {/* [NEW] ĐÃ MỞ KHÓA TẠO SỰ KIỆN TỰ DO */}
        <button
          onClick={() => navigate("create")}
          className="px-6 py-3 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 bg-black hover:bg-slate-800"
        >
          <Plus size={18} /> Tạo sự kiện mới
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-2">
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-1/3">Tên sự kiện</th>
                <th className="px-6 py-4">Học kỳ</th>
                <th className="px-6 py-4 text-center">Năm</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {events.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500 font-medium"
                  >
                    Chưa có sự kiện nào.
                  </td>
                </tr>
              ) : (
                events.map((event, index) => (
                  <tr
                    key={event.id ?? index}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5 font-bold text-slate-900">
                      {event.name || event.eventName}
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium text-xs">
                      {event.semester || "-"}
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium text-xs">
                      {event.year}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {event.currentRound < 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                          Sắp diễn ra
                        </span>
                      )}
                      {event.currentRound >= 0 &&
                        event.currentRound < (event.maxRounds || 2) && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold border border-blue-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            Đang diễn ra
                          </span>
                        )}
                      {event.currentRound >= (event.maxRounds || 2) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[11px] font-bold border border-purple-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                          Đã kết thúc
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 flex justify-end gap-3">
                      <button
                        onClick={() =>
                          handleDeleteEvent(
                            event.id,
                            event.name || event.eventName,
                          )
                        }
                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-xs font-bold transition-colors p-1.5"
                      >
                        <Eye size={16} /> Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
