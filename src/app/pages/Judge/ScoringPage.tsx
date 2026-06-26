import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Hexagon,
  ArrowLeft,
  GitBranch,
  Globe,
  Download,
  Calculator,
  Save,
  Activity,
} from "lucide-react";
import Swal from "sweetalert2";

// Import API & Store
import apiClient from "../../lib/api/apiClient";
import { criteriaApi } from "../../lib/api/criteriaApi";
import { useAuthStore } from "../../stores/auth.store";

const getList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

export function ScoringPage() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const location = useLocation();
  const teamFromList = location.state?.team;

  // Lấy ID Giám khảo từ Store
  const user = useAuthStore((state: any) => state.user);
  const currentTeacherId =
    user?.id ||
    user?.Id ||
    user?.teacherId ||
    user?.teacherID ||
    user?.sub ||
    "";

  const [currentTeam, setCurrentTeam] = useState<any>(teamFromList);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // DỮ LIỆU ĐỘNG: Tiêu chí thật từ API
  const [criteriaList, setCriteriaList] = useState<any[]>([]);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(true);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");

  // LOAD BỘ TIÊU CHÍ THẬT TỪ DATABASE
  useEffect(() => {
    if (!teamId && !teamFromList) {
      navigate("/judge");
      return;
    }

    if (teamFromList && teamFromList.status === "Đã chấm") {
      setIsUpdating(true);
      if (teamFromList.feedback) setFeedback(teamFromList.feedback);

      // Nếu Backend có lưu details dưới dạng JSON chuỗi, tui parse ra luôn cho bà
      if (teamFromList.details) {
        try {
          const parsed =
            typeof teamFromList.details === "string"
              ? JSON.parse(teamFromList.details)
              : teamFromList.details;
          setScores(parsed);
        } catch (e) {}
      }
    }

    // Fetch Criteria thật
    const fetchRealCriteria = async () => {
      if (!teamFromList?.criteriaSetId) {
        setIsLoadingCriteria(false);
        return;
      }
      try {
        const setRes = await criteriaApi.getSetById(teamFromList.criteriaSetId);
        const items =
          setRes?.data?.criteriaList ||
          setRes?.data?.CriteriaList ||
          setRes?.criteriaList ||
          setRes?.CriteriaList ||
          [];

        // Fetch tất cả criteria để map lấy cái tên
        const allCRes = await criteriaApi.getAllCriteria();
        const cMap = getList(allCRes).reduce((acc: any, c: any) => {
          acc[c.id || c.criteriaId || c.criteriaID] = c.name || c.criteriaName;
          return acc;
        }, {});

        const enriched = items.map((it: any) => ({
          id: String(it.criteriaId || it.CriteriaId || it.id),
          name:
            cMap[it.criteriaId || it.CriteriaId || it.id] ||
            "Tiêu chí hệ thống",
          weight: Number(it.score || it.Score || 0),
        }));

        setCriteriaList(enriched);
      } catch (error) {
        console.error("Lỗi tải bộ tiêu chí", error);
      } finally {
        setIsLoadingCriteria(false);
      }
    };

    fetchRealCriteria();
  }, [teamId, teamFromList, navigate]);

  // Xử lý nhập điểm động
  const handleScoreChange = (criteriaId: string, value: string) => {
    let num = parseInt(value) || 0;
    if (num > 100) num = 100;
    if (num < 0) num = 0;
    setScores((prev) => ({ ...prev, [criteriaId]: num }));
  };

  // Tính tổng điểm thật dựa trên trọng số (%) của từng tiêu chí
  const totalScore = criteriaList
    .reduce((sum, c) => {
      const point = scores[c.id] || 0;
      return sum + point * (c.weight / 100);
    }, 0)
    .toFixed(1);

  // GỌI API LƯU KẾT QUẢ ĐÁNH GIÁ (API THẬT)
  const handleSaveEvaluation = async () => {
    if (!currentTeacherId)
      return Swal.fire("Lỗi bảo mật", "Không tìm thấy ID Giám khảo!", "error");
    if (criteriaList.length === 0)
      return Swal.fire(
        "Lỗi",
        "Vòng thi này chưa có tiêu chí, không thể chấm!",
        "warning",
      );

    try {
      setIsSaving(true);
      Swal.fire({
        title: "Đang lưu bảng điểm...",
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        teamId: currentTeam?.id || teamId,
        score: Number(totalScore),
        feedback: feedback,
        details: JSON.stringify(scores), // Nén object điểm chi tiết thành chuỗi lưu vào DB
      };

      if (isUpdating) {
        await apiClient.put(`/api/Evaluation/${currentTeacherId}`, payload);
      } else {
        await apiClient.post(`/api/Evaluation/${currentTeacherId}`, payload);
      }

      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Đã lưu kết quả đánh giá cho đội này.",
        showConfirmButton: false,
        timer: 1500,
      }).then(() => navigate("/judge"));
    } catch (error: any) {
      Swal.fire(
        "Lỗi",
        error.response?.data?.message ||
          error.response?.data ||
          "Không thể lưu điểm lúc này",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentTeam) return <div className="p-10 text-center">Đang tải...</div>;

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
            onClick={() => navigate("/judge/profile")}
            className="flex items-center gap-3 cursor-pointer text-left group"
          >
            <div className="text-right">
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {user?.fullName || user?.name || "Giám Khảo"}
              </h2>
            </div>
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-blue-600 transition-colors uppercase">
              {(user?.fullName || user?.name || "G")[0]}
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
              Hạng mục: {currentTeam.track}
            </p>
          </div>
        </div>

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
            {isLoadingCriteria ? (
              <div className="py-8 text-center text-slate-400 font-medium">
                <Activity className="animate-spin inline mr-2 mb-1" size={18} />{" "}
                Đang tải bộ tiêu chí từ hệ thống...
              </div>
            ) : criteriaList.length === 0 ? (
              <div className="py-8 text-center text-red-500 font-medium">
                Vòng thi này chưa được Admin cấu hình bộ tiêu chí đánh giá.
                Không thể tiến hành chấm điểm!
              </div>
            ) : (
              criteriaList.map((crit, index) => (
                <div key={crit.id}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm">
                        {crit.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Trọng số: {crit.weight}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold">
                      <input
                        type="number"
                        value={scores[crit.id] || 0}
                        onChange={(e) =>
                          handleScoreChange(crit.id, e.target.value)
                        }
                        className="w-16 text-center text-sm p-2 rounded-lg border outline-none font-bold transition-colors bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />{" "}
                      / 100
                    </div>
                  </div>
                  {index < criteriaList.length - 1 && (
                    <hr className="border-slate-100 mt-6" />
                  )}
                </div>
              ))
            )}

            <div className="pt-4 border-t border-slate-100 mt-6">
              <h4 className="font-bold text-slate-700 text-sm mb-3">
                Nhận xét của Giám khảo (Feedback)
              </h4>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-24 p-4 rounded-xl border outline-none text-sm transition-colors resize-none bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập nhận xét chi tiết cho đội thi..."
              ></textarea>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSaveEvaluation}
                disabled={isSaving || criteriaList.length === 0}
                className={`px-6 py-2.5 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 ${criteriaList.length === 0 ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                <Save size={16} />{" "}
                {isUpdating ? "Cập nhật bảng điểm" : "Lưu kết quả đánh giá"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
