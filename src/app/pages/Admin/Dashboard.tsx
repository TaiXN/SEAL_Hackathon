import { useState } from "react";
import {
  Users,
  AlertCircle,
  Calendar,
  Download,
  Trophy,
  CheckCircle,
} from "lucide-react";

const initialTeams = [
  {
    rank: 1,
    name: "Alpha Coders",
    track: "AI & Data",
    score: "98.5đ",
    status: "Thăng vòng",
  },
  {
    rank: 2,
    name: "TechWizards",
    track: "Web App",
    score: "92.0đ",
    status: "Thăng vòng",
  },
  {
    rank: 3,
    name: "DataDrifters",
    track: "AI & Data",
    score: "89.5đ",
    status: "Thăng vòng",
  },
  {
    rank: 4,
    name: "NeuralNinjas",
    track: "AI & Data",
    score: "88.0đ",
    status: "Thăng vòng",
  },
  {
    rank: 5,
    name: "CloudChasers",
    track: "Web App",
    score: "85.5đ",
    status: "Thăng vòng",
  },
  {
    rank: 6,
    name: "ByteMe",
    track: "Mobile",
    score: "82.0đ",
    status: "Thăng vòng",
  },
  {
    rank: 7,
    name: "CodeMonks",
    track: "Web App",
    score: "65.5đ",
    status: "Bị loại",
  },
  {
    rank: 8,
    name: "PixelPirates",
    track: "Mobile",
    score: "55.0đ",
    status: "Bị loại",
  },
];

export function Dashboard() {
  const [teams] = useState(initialTeams);
  const [isApproved, setIsApproved] = useState(false);

  const handleExportCSV = () => {
    const headers = ["Hạng", "Tên đội", "Hạng mục", "Tổng điểm", "Trạng thái"];
    const csvContent = [
      headers.join(","),
      ...teams.map(
        (t) => `${t.rank},${t.name},${t.track},${t.score},${t.status}`,
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "bang_xep_hang.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApprove = () => {
    if (!isApproved) {
      const confirmApprove = window.confirm(
        "Xác nhận chốt danh sách 6 đội thăng vòng Chung kết?",
      );
      if (confirmApprove) setIsApproved(true);
    } else {
      setIsApproved(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Tổng quan sự kiện - Spring 2026
        </h1>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download size={16} /> Xuất CSV Xếp hạng
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm">Tổng Đội thi</span>
            <Users className="text-slate-400" size={20} />
          </div>
          <div className="text-4xl font-bold text-slate-900">42</div>
          <p className="text-slate-400 text-xs mt-2">
            +3 đội mới đăng ký hôm nay
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm">Tài khoản chờ duyệt</span>
            <AlertCircle className="text-amber-500" size={20} />
          </div>
          <div className="text-4xl font-bold text-slate-900">12</div>
          <p className="text-slate-400 text-xs mt-2">
            Cần xem xét trong hôm nay
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm">Trạng thái Sự kiện</span>
            <Calendar className="text-slate-400" size={20} />
          </div>
          <div className="bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-bold w-fit mb-2">
            Đang diễn ra
          </div>
          {/* LOGIC ĐỔI TEXT Ở ĐÂY */}
          <p className="text-slate-900 font-bold">
            {isApproved ? "Vòng Chung Kết" : "Vòng Bảng"}
          </p>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900">
            <Trophy size={20} className="text-slate-900" /> Bảng xếp hạng & Kết
            quả Thăng vòng
          </div>

          <div className="flex items-center gap-6">
            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
                Thăng vòng
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> Bị
                loại
              </span>
            </div>

            <button
              onClick={handleApprove}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${
                isApproved
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              <CheckCircle
                size={16}
                className={isApproved ? "text-emerald-500" : "text-white"}
              />
              {isApproved ? "Đã chốt Top 6" : "Duyệt danh sách Top 6"}
            </button>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-white text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">HẠNG</th>
              <th className="px-6 py-4">TÊN ĐỘI</th>
              <th className="px-6 py-4">HẠNG MỤC</th>
              <th className="px-6 py-4">TỔNG ĐIỂM</th>
              <th className="px-6 py-4 text-right">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teams.map((team) => (
              <tr
                key={team.rank}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${team.rank <= 3 ? "bg-slate-900" : "bg-slate-200 text-slate-600"}`}
                  >
                    #{team.rank}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">
                  {team.name}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600 text-[11px] font-medium">
                    {team.track}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {team.score}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  <span
                    className={`flex items-center justify-end gap-2 ${team.status === "Thăng vòng" ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${team.status === "Thăng vòng" ? "bg-emerald-500" : "bg-slate-300"}`}
                    ></span>
                    {team.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
