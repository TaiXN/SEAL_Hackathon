import { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  X,
  History,
  ArrowRight,
  Calendar,
  FileCode2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// --- MOCK DATA: DỮ LIỆU MẪU ĐỂ HIỂN THỊ ---
const MOCK_LOGS = [
  {
    id: "LOG001",
    timestamp: "2026-08-03 21:38:15",
    actor: { name: "Trần Văn Giám Khảo", id: "JUDGE_09" },
    role: "Judge",
    action: "Update Score",
    target: "Team_404_Project",
    ip: "192.168.1.45 (Chrome/Win)",
    details: {
      type: "score",
      reason: "Chấm sót tiêu chí Tính khả thi ở phần thuyết trình.",
      before: { total: 7.5, criteria: { Creativity: 4, Feasibility: 3.5 } },
      after: { total: 9.0, criteria: { Creativity: 4, Feasibility: 5.0 } },
    },
  },
  {
    id: "LOG002",
    timestamp: "2026-08-03 20:15:02",
    actor: { name: "Nguyễn Huỳnh Thành Viên", id: "SE18000" },
    role: "Member",
    action: "Re-submit File",
    target: "Submission_Final_Round",
    ip: "14.232.112.9 (Safari/Mac)",
    details: {
      type: "file",
      reason: "Cập nhật file source code fix lỗi API rớt mạng.",
      before: {
        filename: "main_v1.js",
        size: "12 KB",
        snippet: "axios.get('/api/data');",
      },
      after: {
        filename: "main_vfinal.js",
        size: "14 KB",
        snippet: "await axios.get('/api/data', { timeout: 5000 });",
      },
    },
  },
];

export function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // --- HÀM RENDER BADGE MÀU SẮC THEO ROLE ---
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Judge":
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[11px] font-black uppercase tracking-widest">
            Judge
          </span>
        );
      case "Member":
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-[11px] font-black uppercase tracking-widest">
            Member
          </span>
        );
      case "Admin":
        return (
          <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg text-[11px] font-black uppercase tracking-widest">
            Admin
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-black uppercase">
            {role}
          </span>
        );
    }
  };

  // --- HÀM RENDER BADGE MÀU SẮC THEO ACTION ---
  const getActionBadge = (action: string) => {
    if (action.includes("Score")) {
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
          <CheckCircle2 size={14} /> {action}
        </span>
      );
    }
    if (action.includes("Re-submit") || action.includes("File")) {
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
          <FileCode2 size={14} /> {action}
        </span>
      );
    }
    return <span className="text-xs font-bold text-slate-600">{action}</span>;
  };

  return (
    <main className="w-full bg-[#f4f6f8] min-h-screen p-10 font-sans selection:bg-orange-200 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-black text-[#0a192f] tracking-tight flex items-center gap-3">
            <History className="text-orange-500" size={32} strokeWidth={2.5} />{" "}
            System Audit Logs
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-2">
            Theo dõi, giám sát và đối chiếu mọi thay đổi nhạy cảm trong hệ
            thống.
          </p>
        </div>

        {/* BƯỚC 1: BỘ LỌC THÔNG MINH (FILTER BAR) */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex w-full md:w-auto gap-4">
            <div className="relative">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-11 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#0a192f] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 cursor-pointer appearance-none"
              >
                <option value="All">Tất cả Vai trò</option>
                <option value="Judge">Giám khảo (Judge)</option>
                <option value="Member">Thí sinh (Member)</option>
              </select>
            </div>
            <div className="relative hidden md:block">
              <Calendar
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <select className="pl-11 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#0a192f] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 cursor-pointer appearance-none">
                <option>7 Ngày qua</option>
                <option>Hôm nay</option>
                <option>Tháng này</option>
              </select>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm theo ID, Tên, Target..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#0a192f] outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* BƯỚC 2: BẢNG DỮ LIỆU TỔNG QUAN (LOG TABLE) */}
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 whitespace-nowrap">Thời gian</th>
                  <th className="px-6 py-5">Đối tác động (Actor)</th>
                  <th className="px-6 py-5">Vai trò</th>
                  <th className="px-6 py-5">Hành động</th>
                  <th className="px-6 py-5">Đối tượng (Target)</th>
                  <th className="px-6 py-5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_LOGS.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-500">
                        {log.timestamp}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-[#0a192f]">
                          {log.actor.name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          ID: {log.actor.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(log.role)}</td>
                    <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        {log.target}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        <Eye size={14} strokeWidth={2.5} /> Xem Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BƯỚC 3: TRÌNH SO SÁNH CHI TIẾT (DIFF VIEWER MODAL) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-[#0a192f] flex items-center gap-2">
                  Chi tiết thay đổi
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  Log ID: {selectedLog.id} • IP: {selectedLog.ip}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Lý do thay đổi */}
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start">
                <AlertCircle
                  className="text-amber-500 shrink-0 mt-0.5"
                  size={18}
                  strokeWidth={2.5}
                />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/70 block mb-1">
                    Lý do ghi nhận
                  </span>
                  <p className="text-sm font-bold text-amber-900">
                    {selectedLog.details.reason}
                  </p>
                </div>
              </div>

              {/* DIFF VIEWER CỤ THỂ THEO LOẠI ACTION */}
              <div className="grid grid-cols-2 gap-6 relative">
                {/* Mũi tên ở giữa */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-sm border border-slate-100 z-10 text-slate-400">
                  <ArrowRight size={20} strokeWidth={3} />
                </div>

                {/* Cột BEFORE (Cũ) */}
                <div className="border border-red-100 rounded-2xl overflow-hidden">
                  <div className="bg-red-50/50 px-4 py-2 border-b border-red-100 text-[10px] font-black text-red-500 uppercase tracking-widest text-center">
                    Trước khi đổi (Before)
                  </div>
                  <div className="p-5 bg-white">
                    {selectedLog.details.type === "score" ? (
                      <div className="text-center">
                        <div className="text-3xl font-black text-slate-400 line-through decoration-red-400 decoration-2 mb-2">
                          {selectedLog.details.before.total}
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                          Điểm tổng cũ
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-slate-700 line-through decoration-red-400">
                          {selectedLog.details.before.filename}
                        </p>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-500">
                          <span className="bg-red-100 text-red-700 line-through px-1">
                            - {selectedLog.details.before.snippet}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cột AFTER (Mới) */}
                <div className="border border-emerald-100 rounded-2xl overflow-hidden">
                  <div className="bg-emerald-50/50 px-4 py-2 border-b border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">
                    Sau khi đổi (After)
                  </div>
                  <div className="p-5 bg-white">
                    {selectedLog.details.type === "score" ? (
                      <div className="text-center">
                        <div className="text-3xl font-black text-emerald-600 mb-2">
                          {selectedLog.details.after.total}
                        </div>
                        <p className="text-xs font-bold text-emerald-600/70">
                          Điểm tổng mới
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-emerald-700">
                          {selectedLog.details.after.filename}
                        </p>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-600">
                          <span className="bg-emerald-100 text-emerald-700 px-1">
                            + {selectedLog.details.after.snippet}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 bg-[#0a192f] text-white text-sm font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
