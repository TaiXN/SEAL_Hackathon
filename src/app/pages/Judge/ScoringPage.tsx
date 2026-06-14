import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Hexagon,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Unlock,
  GitBranch,
  Globe,
  Download,
  Calculator,
} from "lucide-react";

export function ScoringPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const teamFromList = location.state?.team;

  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [scores, setScores] = useState({
    criteria1: 0,
    criteria2: 0,
    criteria3: 0,
    criteria4: 0,
  });
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!teamFromList) {
      navigate("/");
      return;
    }

    // DÀNH CHO BACKEND:
    // TODO: Gọi API GET /api/judge/teams/{teamId}/scores để lấy điểm chi tiết và feedback cũ (nếu có)

    // Tạm thời lấy data từ Dashboard truyền qua
    setCurrentTeam(teamFromList);
    setIsLocked(teamFromList.status === "Đã khóa điểm");
    if (teamFromList.details) setScores(teamFromList.details);
    if (teamFromList.feedback) setFeedback(teamFromList.feedback);
  }, [teamFromList, navigate]);

  const handleScoreChange = (field: string, value: string) => {
    let num = parseInt(value) || 0;
    if (num > 100) num = 100;
    if (num < 0) num = 0;
    setScores((prev) => ({ ...prev, [field]: num }));
  };

  const totalScore = (
    scores.criteria1 * 0.3 +
    scores.criteria2 * 0.3 +
    scores.criteria3 * 0.2 +
    scores.criteria4 * 0.2
  ).toFixed(1);

  // HÀM LƯU VÀ KHÓA ĐIỂM
  const handleSaveAndLock = () => {
    setIsLocked(true);
    const finalScore = totalScore + "đ";

    // DÀNH CHO BACKEND:
    // TODO: Gọi API POST/PUT /api/judge/teams/{teamId}/scores để gửi điểm và trạng thái lên Server
    const payload = {
      teamId: currentTeam.id,
      status: "Đã khóa điểm",
      score: finalScore,
      details: scores,
      feedback: feedback,
    };
    console.log("API Gửi điểm lên Backend:", payload);
  };

  // HÀM MỞ KHÓA
  const handleUnlock = () => {
    setIsLocked(false);

    // DÀNH CHO BACKEND:
    // TODO: Gọi API POST/PUT /api/judge/teams/{teamId}/unlock để mở khóa điểm
    console.log("API Mở khóa điểm cho đội ID:", currentTeam.id);
  };

  if (!currentTeam) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
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

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/judge")}
            className="text-sm font-semibold text-slate-500 hover:text-black transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Trở về Tổng quan
          </button>

          <div className="w-px h-8 bg-slate-200"></div>

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
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-12 space-y-6 px-4 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Đang đánh giá: {currentTeam.name}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Hạng mục: {currentTeam.track} | Vòng Bảng
            </p>
          </div>
          {isLocked ? (
            <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200 shadow-sm">
              <CheckCircle2 size={16} /> Đã hoàn tất chấm điểm
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold border border-amber-200 shadow-sm">
              <Unlock size={16} /> Đang mở khóa chấm điểm
            </span>
          )}
        </div>

        {isLocked && (
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 flex justify-between items-center shadow-sm">
            <div className="flex items-start gap-3">
              <Lock className="text-amber-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-amber-900">
                  Điểm của đội này đã được khóa.
                </h3>
                <p className="text-sm text-amber-700/80 mt-0.5">
                  Bạn không thể chỉnh sửa điểm. Bấm mở khóa nếu muốn chấm lại từ
                  đầu.
                </p>
              </div>
            </div>
            <button
              onClick={handleUnlock}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-bold rounded-lg hover:bg-amber-50 transition-colors shadow-sm"
            >
              <Unlock size={16} /> Mở khóa điểm để chấm lại
            </button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="text-amber-500">📁</span> Tài liệu dự án
          </h3>
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                <GitBranch size={16} /> GitHub Repository
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors text-blue-600">
                <Globe size={16} /> Live Demo
              </button>
            </div>
            <button className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
              <Download size={16} /> Tải xuống Slide (.pdf)
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="text-slate-400">📝</span> Phiếu chấm điểm chi
              tiết
            </h3>
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
              <Calculator size={18} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-600">
                Tổng điểm:
              </span>
              <span
                className={`text-xl font-black ${Number(totalScore) >= 85 ? "text-emerald-600" : Number(totalScore) === 0 ? "text-slate-400" : "text-amber-600"}`}
              >
                {totalScore}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-700 text-sm">
                  Tính ứng dụng và khả thi
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Trọng số: 30%</p>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-bold">
                <input
                  type="number"
                  value={scores.criteria1}
                  onChange={(e) =>
                    handleScoreChange("criteria1", e.target.value)
                  }
                  disabled={isLocked}
                  className={`w-16 text-center text-sm p-2 rounded-lg border outline-none font-bold transition-colors ${isLocked ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                />{" "}
                / 100
              </div>
            </div>
            <hr className="border-slate-100" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-700 text-sm">
                  Mức độ tự động hóa & tích hợp AI
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Trọng số: 30%</p>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-bold">
                <input
                  type="number"
                  value={scores.criteria2}
                  onChange={(e) =>
                    handleScoreChange("criteria2", e.target.value)
                  }
                  disabled={isLocked}
                  className={`w-16 text-center text-sm p-2 rounded-lg border outline-none font-bold transition-colors ${isLocked ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                />{" "}
                / 100
              </div>
            </div>
            <hr className="border-slate-100" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-700 text-sm">
                  Giao diện và trải nghiệm người dùng
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Trọng số: 20%</p>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-bold">
                <input
                  type="number"
                  value={scores.criteria3}
                  onChange={(e) =>
                    handleScoreChange("criteria3", e.target.value)
                  }
                  disabled={isLocked}
                  className={`w-16 text-center text-sm p-2 rounded-lg border outline-none font-bold transition-colors ${isLocked ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                />{" "}
                / 100
              </div>
            </div>
            <hr className="border-slate-100" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-700 text-sm">
                  Slide trình bày và demo
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Trọng số: 20%</p>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-bold">
                <input
                  type="number"
                  value={scores.criteria4}
                  onChange={(e) =>
                    handleScoreChange("criteria4", e.target.value)
                  }
                  disabled={isLocked}
                  className={`w-16 text-center text-sm p-2 rounded-lg border outline-none font-bold transition-colors ${isLocked ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                />{" "}
                / 100
              </div>
            </div>

            <div className="pt-4">
              <h4 className="font-bold text-slate-700 text-sm mb-3">
                Nhận xét của Giám khảo (Feedback)
              </h4>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isLocked}
                className={`w-full h-24 p-4 rounded-xl border outline-none text-sm transition-colors resize-none ${isLocked ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                placeholder="Nhập nhận xét chi tiết cho đội thi..."
              ></textarea>
            </div>

            {!isLocked && (
              <div className="flex justify-end pt-4 border-t border-slate-100 animate-in fade-in zoom-in duration-300">
                <button
                  onClick={handleSaveAndLock}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Lock size={16} /> Lưu và Khóa điểm
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
