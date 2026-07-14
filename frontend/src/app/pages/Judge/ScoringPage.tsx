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
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";

// Import API
import apiClient from "../../lib/api/apiClient";
import { judgeApi } from "../../lib/api/judgeApi";
import { useAuthStore } from "../../stores/auth.store";

// Hàm hỗ trợ moi móc mảng bất chấp cấu trúc của Backend
const getList = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  if (res?.data && Array.isArray(res.data?.data)) return res.data.data;
  return [];
};

export function ScoringPage() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const location = useLocation();
  const teamFromList = location.state?.team || {};

  const user = useAuthStore(
    (state: any) => state.user || state.profile || null,
  );
  const currentTeacherId =
    user?.id ||
    user?.Id ||
    user?.teacherId ||
    user?.teacherID ||
    user?.sub ||
    "";

  const [submissionData, setSubmissionData] = useState({
    githubUrl: "",
    demoUrl: "",
    slideUrl: "",
  });

  const [criteriaList, setCriteriaList] = useState<any[]>([]);
  const [evaluationId, setEvaluationId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [savedScore, setSavedScore] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Lấy chính xác ID bài nộp để tra cứu
  const submissionId =
    teamFromList?.submissionId || teamFromList?.submissionID || teamId || "";

  useEffect(() => {
    const fetchScoringData = async () => {
      if (!submissionId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      // ==========================================
      // 1. TÌM LINK BÀI NỘP (Đã fix lỗi chữ d thường)
      // ==========================================
      try {
        const subRes = await apiClient.get("/api/Submission");
        const allSubs = getList(subRes);

        const mySub = allSubs.find((s: any) => {
          const targetId = String(submissionId).toLowerCase();
          return (
            (s.id && String(s.id).toLowerCase() === targetId) ||
            (s.submissionID &&
              String(s.submissionID).toLowerCase() === targetId) ||
            (s.submissionId &&
              String(s.submissionId).toLowerCase() === targetId) ||
            (s.teamInRoundId &&
              String(s.teamInRoundId).toLowerCase() ===
                String(teamFromList.teamId).toLowerCase())
          );
        });

        if (mySub) {
          setSubmissionData({
            githubUrl:
              mySub.urlGithub || mySub.URLGithub || mySub.githubUrl || "",
            demoUrl: mySub.urlDemo || mySub.URLDemo || mySub.demoUrl || "",
            slideUrl: mySub.urlSlide || mySub.URLSlide || mySub.slideUrl || "",
          });
        }
      } catch (e) {
        console.error("❌ Lỗi lấy link bài nộp:", e);
      }

      // ==========================================
      // 2. LẤY TỪ ĐIỂN TÊN TIÊU CHÍ (Tách try...catch riêng để né lỗi CORS)
      // ==========================================
      const nameMap: Record<string, string> = {};
      try {
        const critRes = await apiClient.get("/api/Criteria/criterion");
        const allCriteria = getList(critRes);
        allCriteria.forEach((c: any) => {
          nameMap[c.criteriaID || c.criteriaId || c.id] =
            c.criteriaName || c.CriteriaName || "Tiêu chí";
        });
      } catch (e) {
        console.warn(
          "⚠️ API /api/Criteria/criterion bị lỗi (CORS). Bỏ qua bước lấy tên Tiêu chí.",
        );
      }

      // ==========================================
      // 3. LẤY CHI TIẾT BỘ TIÊU CHÍ (RUBRIC)
      // ==========================================
      try {
        const setId =
          teamFromList?.criteriaSetId || teamFromList?.CriteriaSetId;
        let criteriaItems = [];

        if (setId) {
          const setRes = await apiClient.get(`/api/Criteria/set/${setId}`);
          let setData = setRes.data || setRes;
          if (setData.data) setData = setData.data;
          criteriaItems = getList(setData.criteriaList || setData.CriteriaList);
        } else {
          const setsRes = await apiClient.get("/api/Criteria/set");
          const defaultSet = getList(setsRes).find(
            (s: any) => s.isDefault || s.IsDefault,
          );
          if (defaultSet) {
            criteriaItems = getList(
              defaultSet.criteriaList || defaultSet.CriteriaList,
            );
          }
        }

        if (criteriaItems.length > 0) {
          const formattedCriteria = criteriaItems.map((c: any) => {
            const cId = c.criteriaId || c.CriteriaId || c.id;
            return {
              id: cId,
              // Nếu API số 2 sập, lấy tạm chữ "Tiêu chí hệ thống"
              name:
                c.criteria?.criteriaName ||
                c.criteria?.CriteriaName ||
                nameMap[cId] ||
                "Tiêu chí hệ thống",
              maxScore: c.score || c.Score || 0,
              judgeScore: 0,
            };
          });
          setCriteriaList(formattedCriteria);
        }
      } catch (e) {
        console.error("❌ Lỗi lấy bộ tiêu chí:", e);
      }

      // ==========================================
      // 4. LẤY ĐIỂM CŨ (NẾU ĐÃ CHẤM)
      // ==========================================
      try {
        const evalRes = await judgeApi.getEvaluationBySubmission(submissionId);
        const evalData = evalRes?.data || evalRes;

        if (
          evalData &&
          (evalData.evaluationID || evalData.id || evalData.score !== undefined)
        ) {
          setEvaluationId(
            evalData.evaluationID || evalData.id || evalData.evaluationId || "",
          );
          setFeedback(evalData.reason || evalData.feedback || "");
          setSavedScore(evalData.score);
        }
      } catch (e) {
        console.log("ℹ️ Đội này chưa được chấm điểm.");
      }

      setIsLoading(false);
    };

    fetchScoringData();
  }, [submissionId, teamFromList]);

  // Tính tổng điểm
  const inputTotalScore = criteriaList.reduce(
    (acc, curr) => acc + (curr.judgeScore || 0),
    0,
  );
  const maxPossibleScore = criteriaList.reduce(
    (acc, curr) => acc + (curr.maxScore || 0),
    0,
  );
  const displayScore = inputTotalScore > 0 ? inputTotalScore : savedScore || 0;

  const handleScoreChange = (id: string, val: string, maxScore: number) => {
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > maxScore) num = maxScore;

    setCriteriaList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, judgeScore: num } : c)),
    );
  };

  const handleSaveEvaluation = async () => {
    if (displayScore === 0) {
      Swal.fire("Cảnh báo", "Vui lòng nhập điểm trước khi lưu!", "warning");
      return;
    }
    if (!feedback.trim()) {
      Swal.fire(
        "Cảnh báo",
        "Vui lòng nhập nhận xét (Feedback) cho đội thi!",
        "warning",
      );
      return;
    }

    try {
      setIsSaving(true);
      const basePayload = {
        score: displayScore,
        reason: feedback,
      };

      if (evaluationId) {
        await judgeApi.updateEvaluation(currentTeacherId, {
          ...basePayload,
          evaluationID: evaluationId,
        });
      } else {
        await judgeApi.createEvaluation(currentTeacherId, {
          ...basePayload,
          submissionID: submissionId,
        });
      }

      Swal.fire({
        icon: "success",
        title: "Đã lưu điểm!",
        text: `Đội thi đã được ghi nhận ${displayScore} điểm.`,
        timer: 2000,
        showConfirmButton: false,
      }).then(() => navigate("/judge"));
    } catch (error: any) {
      console.error("Lỗi lưu điểm:", error);
      Swal.fire(
        "Lỗi",
        error.response?.data?.message || "Hệ thống từ chối việc lưu điểm.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-bold animate-pulse">
          Đang nạp bộ tiêu chí và đồ án...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-2"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <Hexagon size={32} className="text-blue-600" strokeWidth={2.5} />
          <div>
            <h1 className="font-extrabold text-lg tracking-tight">
              SCORING PANEL
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              SEAL Hackathon
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 px-5 py-2.5 rounded-xl text-indigo-700 font-black flex items-center gap-2 text-lg">
            <Calculator size={20} />
            {displayScore}{" "}
            <span className="text-sm font-medium text-indigo-400">
              / {maxPossibleScore || 100}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        {/* ================= CỘT TRÁI: THÔNG TIN BÀI NỘP ================= */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Đội đang chấm
                  </p>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {teamFromList?.teamName ||
                      teamFromList?.name ||
                      "Đội ẩn danh"}
                  </h2>
                </div>
              </div>
            </div>

            {savedScore !== null && (
              <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-800 text-sm">
                    Đã có điểm hệ thống
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Đội này đã được chấm <b>{savedScore} điểm</b>. Bạn có thể
                    nhập điểm mới bên phải để ghi đè.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl hover:bg-blue-50 transition-colors">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <GitBranch size={14} /> Mã nguồn (Github)
                </p>
                {submissionData.githubUrl ? (
                  <a
                    href={submissionData.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:underline break-all"
                  >
                    {submissionData.githubUrl}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400 italic">Chưa cập nhật</p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl hover:bg-blue-50 transition-colors">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Globe size={14} /> Demo / Website
                </p>
                {submissionData.demoUrl ? (
                  <a
                    href={submissionData.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:underline break-all"
                  >
                    {submissionData.demoUrl}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400 italic">Chưa cập nhật</p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl hover:bg-blue-50 transition-colors">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Download size={14} /> Tài liệu (Slide)
                </p>
                {submissionData.slideUrl ? (
                  <a
                    href={submissionData.slideUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:underline break-all"
                  >
                    Xem Slide Thuyết trình
                  </a>
                ) : (
                  <p className="text-sm text-slate-400 italic">Chưa cập nhật</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ================= CỘT PHẢI: BẢNG TIÊU CHÍ CHẤM ================= */}
        <div className="lg:col-span-7">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 lg:p-8">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              Rubric Đánh Giá
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Vui lòng nhập điểm số cho từng tiêu chí để hệ thống tính tổng.
            </p>

            {criteriaList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">
                  Không tìm thấy bộ tiêu chí đánh giá cho vòng thi này!
                </p>
              </div>
            ) : (
              criteriaList.map((crit, index) => (
                <div key={crit.id} className="mb-5 last:mb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl hover:border-blue-200 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {index + 1}. {crit.name}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        Điểm tối đa:{" "}
                        <span className="text-blue-600">{crit.maxScore}</span>
                      </p>
                    </div>
                    <div className="relative w-32 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max={crit.maxScore}
                        value={crit.judgeScore === 0 ? "" : crit.judgeScore}
                        onChange={(e) =>
                          handleScoreChange(
                            crit.id,
                            e.target.value,
                            crit.maxScore,
                          )
                        }
                        placeholder="0"
                        className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-300 rounded-lg text-lg font-bold text-slate-900 text-center outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        pts
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="pt-6 mt-6 border-t border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm mb-3">
                Nhận xét của Giám khảo (Feedback){" "}
                <span className="text-red-500">*</span>
              </h4>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-28 p-4 rounded-xl border outline-none text-sm transition-colors resize-none bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-medium"
                placeholder="Nhập nhận xét chi tiết, góp ý xây dựng cho đội thi..."
              ></textarea>
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
              <button
                onClick={handleSaveEvaluation}
                disabled={isSaving || criteriaList.length === 0}
                className="px-8 py-3 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <Save size={18} />
                {isSaving
                  ? "Đang lưu hệ thống..."
                  : evaluationId
                    ? "Cập nhật Điểm"
                    : "Chốt Điểm"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
