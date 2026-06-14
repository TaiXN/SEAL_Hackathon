import { useState, useEffect } from "react";
import { Plus, HelpCircle, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { adminApi } from "../../lib/api/adminApi";

export function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. GỌI API LẤY DANH SÁCH SỰ KIỆN
  useEffect(() => {
  const fetchEvents = async () => {
    try {
      setIsLoading(true);

      const response: any = await adminApi.getAllEvents();

      const eventList = Array.isArray(response)
        ? response
        : response?.data || response?.items || [];

      const activeEvents = eventList.filter((event: any) => {
        return (
          event.isActive !== false &&
          event.isDeleted !== true &&
          event.deleted !== true
        );
      });

      setEvents(activeEvents);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sự kiện:", error);
      Swal.fire({
        icon: "error",
        title: "Mất kết nối",
        text: "Không thể lấy dữ liệu từ Backend.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  fetchEvents();
}, []);

  // 2. GỌI API XÓA SỰ KIỆN
  const handleDeleteEvent = (id: string, name: string) => {
    Swal.fire({
      title: "Xóa sự kiện?",
      html: `Bạn có chắc chắn muốn xóa sự kiện <b>${name}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await adminApi.deleteEvent(id);

          setEvents((prev) =>
            prev.filter((event) => {
              const eventId = event.id || event.eventID || event.eventId;
              return String(eventId) !== String(id);
            }),
          );

          Swal.fire({
            icon: "success",
            title: "Đã xóa!",
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (error) {
          console.error("Lỗi khi xóa sự kiện:", error);
          Swal.fire(
            "Lỗi",
            "Không thể xóa sự kiện lúc này. Có thể sự kiện đã có đội thi tham gia!",
            "error",
          );
        }
      }
    });
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

        <button
          onClick={() => navigate("create")}
          className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2"
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
                <th className="px-6 py-4 text-center">Số hạng mục</th>
                <th className="px-6 py-4 text-center">Số đội thi</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500 font-medium"
                  >
                    Đang tải dữ liệu từ máy chủ...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500 font-medium"
                  >
                    Chưa có sự kiện nào.
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const eventId = event.id || event.eventID || event.eventId;
                  const eventName =
                    event.eventName || event.name || "Không có tên";

                  const semester =
                    event.season && event.year
                      ? `${event.season} ${event.year}`
                      : event.semester || event.term || "Không rõ";

                  return (
                    <tr
                      key={eventId}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-5 font-bold text-slate-900">
                        {eventName}
                      </td>

                      <td className="px-6 py-5 text-slate-500 font-medium text-xs">
                        {semester}
                      </td>

                      <td className="px-6 py-5 text-center font-bold text-slate-700">
                        {event.trackCount || event.tracks?.length || 0}
                      </td>

                      <td className="px-6 py-5 text-center font-bold text-slate-700">
                        {event.teams || event.teamCount || 0}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-[11px] font-bold border border-slate-200">
                          Round {event.currentRound ?? 0}
                        </span>
                      </td>

                      <td className="px-6 py-5 flex justify-end gap-3">
                        <button
                          onClick={() => handleDeleteEvent(eventId, eventName)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>

                        <button
                          onClick={() => navigate(`/admin/events/${eventId}`)}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-xs font-bold transition-colors p-1.5"
                        >
                          <Eye size={16} /> Xem chi tiết
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

      <button className="fixed bottom-6 right-6 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-500 hover:text-black hover:border-black transition-colors z-20">
        <HelpCircle size={18} />
      </button>
    </main>
  );
}