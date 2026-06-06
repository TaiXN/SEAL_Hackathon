import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, PlayCircle } from "lucide-react";

const DEFAULT_EVENTS = [
  {
    id: "summer-2025",
    name: "SEAL Hackathon Summer 2025",
    semester: "Summer 2025",
    tracksCount: 2,
    teams: 38,
    status: "Đã kết thúc",
  },
  {
    id: "spring-2025",
    name: "SEAL Hackathon Spring 2025",
    semester: "Spring 2025",
    tracksCount: 1,
    teams: 30,
    status: "Đã kết thúc",
  },
];

export function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // 1. Đọc dữ liệu từ localStorage (kho chứa dữ liệu do trang CreateEvent lưu vào)
    const localEvents = JSON.parse(localStorage.getItem("SEAL_EVENTS") || "[]");

    // 2. Nếu kho rỗng thì lấy danh sách mặc định, nếu có thì lôi ra xài
    if (localEvents.length === 0) {
      localStorage.setItem("SEAL_EVENTS", JSON.stringify(DEFAULT_EVENTS));
      setEvents(DEFAULT_EVENTS);
    } else {
      setEvents(localEvents);
    }
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Sự kiện</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Xem lịch sử lưu trữ các kỳ thi trước hoặc khởi tạo kỳ thi mới.
          </p>
        </div>
        <Link
          to="/create-event"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
        >
          + Tạo sự kiện mới
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-semibold">TÊN SỰ KIỆN</th>
              <th className="px-6 py-4 font-semibold">HỌC KỲ</th>
              <th className="px-6 py-4 font-semibold text-center">
                SỐ HẠNG MỤC
              </th>
              <th className="px-6 py-4 font-semibold text-center">
                SỐ ĐỘI THI
              </th>
              <th className="px-6 py-4 font-semibold">TRẠNG THÁI</th>
              <th className="px-6 py-4 font-semibold text-right">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((evt) => (
              <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">
                  {evt.name}
                </td>
                <td className="px-6 py-4 text-slate-500">{evt.semester}</td>
                {/* Lấy đúng số lượng Track đã tạo từ form */}
                <td className="px-6 py-4 text-center text-slate-600 font-medium">
                  {evt.tracksCount || evt.tracks?.length || 0}
                </td>
                <td className="px-6 py-4 text-center text-slate-600 font-medium">
                  {evt.teams}
                </td>
                <td className="px-6 py-4">
                  {evt.status === "Sắp diễn ra" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-bold border border-emerald-200">
                      <PlayCircle size={12} /> Sắp diễn ra
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-md text-[11px] font-semibold border border-slate-200">
                      <Lock size={12} /> Đã kết thúc
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    to={`/events/${evt.id}`}
                    className="text-slate-500 hover:text-slate-900 font-semibold text-sm transition-colors"
                  >
                    Xem chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
