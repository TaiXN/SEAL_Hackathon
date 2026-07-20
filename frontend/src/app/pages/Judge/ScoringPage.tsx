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
  FileText,
} from "lucide-react";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";

// Import APIs
import apiClient from "../../lib/api/apiClient";
import { judgeApi } from "../../lib/api/judgeApi";
import { roundApi } from "../../lib/api/roundApi";
import { useAuthStore } from "../../stores/auth.store";

// Hàm hỗ trợ đọc mảng an toàn
const getList = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  if (res?.data && Array.isArray(res.data?.data)) return res.data.data;
  return [];
};

// Hàm chuẩn hóa ID chuỗi
const normalizeId = (id: any) =>
  String(id || "")
    .toLowerCase()
    .trim();

export function ScoringPage() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const location = useLocation();
  const teamFromList = location.state?.team || {};

  const user = useAuthStore(
    (state: any) => state.user || state.profile || null,
  );
  const accessToken = useAuthStore((state: any) => state.accessToken);

  let decodedUser: any = null;
  if (accessToken) {
    try {
      decodedUser = jwtDecode(accessToken);
    } catch {}
  }

  // Token Mapper
  const currentTeacherId =
    user?.id ||
    user?.Id ||
    user?.teacherId ||
    user?.teacherID ||
    decodedUser?.id ||
    decodedUser?.Id ||
    decodedUser?.sub ||
    decodedUser?.nameid ||
    decodedUser?.userId ||
    decodedUser?.UserId ||
    decodedUser?.teacherId ||
    decodedUser?.teacherID ||
    decodedUser?.TeacherId ||
    decodedUser?.TeacherID ||
    decodedUser?.[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ||
    "";

  // States dữ liệu
  const [submissionData, setSubmissionData] = useState({
    githubUrl: "",
    demoUrl: "",
    slideUrl: "",
  });

  const [criteriaList, setCriteriaList] = useState<any[]>([]);

  // Tận dụng luôn ID nếu có từ Dashboard truyền sang
  const [evaluationId, setEvaluationId] = useState<string>(
    teamFromList?.evaluationId ||
      teamFromList?.evaluationID ||
      teamFromList?.EvaluationID ||
      "",
  );

  const [feedback, setFeedback] = useState("");
  const [savedScore, setSavedScore] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State lưu trữ ID Bài Nộp CHUẨN XÁC
  const [actualSubmissionId, setActualSubmissionId] = useState(
    teamFromList?.submissionId || teamFromList?.submissionID || teamId || "",
  );

  useEffect(() => {
    const fetchScoringData = async () => {
      if (!actualSubmissionId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        // ==========================================
        // BƯỚC 1: LẤY THÔNG TIN BÀI NỘP CỦA ĐỘI
        // ==========================================
        let finalRoundId = normalizeId(
          teamFromList?.roundId ||
            teamFromList?.roundID ||
            teamFromList?.teamInRound?.roundId,
        );

        try {
          const subRes = await apiClient.get("/api/Submission");
          const allSubs = getList(subRes);

          const expectedTeamInRoundId = normalizeId(
            teamFromList?.teamInRoundId ||
              teamFromList?.teamInRoundID ||
              teamFromList?.teamId,
          );

          const mySub = allSubs.find((s: any) => {
            const targetId = normalizeId(actualSubmissionId);

            const subId =
              s.id ||
              s.submissionID ||
              s.submissionId ||
              s.SubmissionId ||
              s.SubmissionID;

            const teamInRoundId =
              s.teamInRoundId ||
              s.teamInRoundID ||
              s.TeamInRoundId ||
              s.TeamInRoundID;

            return (
              normalizeId(subId) === targetId ||
              (expectedTeamInRoundId &&
                normalizeId(teamInRoundId) === expectedTeamInRoundId)
            );
          });

          if (mySub) {
            setSubmissionData({
              githubUrl:
                mySub.urlGithub ||
                mySub.UrlGithub ||
                mySub.URLGithub ||
                mySub.githubUrl ||
                "",
              demoUrl:
                mySub.urlDemo ||
                mySub.UrlDemo ||
                mySub.URLDemo ||
                mySub.demoUrl ||
                "",
              slideUrl:
                mySub.urlSlide ||
                mySub.UrlSlide ||
                mySub.URLSlide ||
                mySub.slideUrl ||
                "",
            });

            const foundSubmissionId =
              mySub.id ||
              mySub.submissionID ||
              mySub.submissionId ||
              mySub.SubmissionId ||
              mySub.SubmissionID;
            if (foundSubmissionId) {
              setActualSubmissionId(foundSubmissionId);
            }

            if (!finalRoundId) {
              finalRoundId = normalizeId(
                mySub.teamInRound?.roundId || mySub.teamInRound?.roundID,
              );
            }
          }
        } catch (e) {
          console.warn("Lỗi khi load Submission:", e);
        }

        // ==========================================
        // BƯỚC 2: TÌM KIẾM ID BỘ TIÊU CHÍ
        // ==========================================
        let targetSetId = normalizeId(
          teamFromList?.criteriaSetId ||
            teamFromList?.CriteriaSetId ||
            teamFromList?.criteriaSetID,
        );

        if (
          !targetSetId &&
          finalRoundId &&
          finalRoundId !== "undefined" &&
          finalRoundId !== "null"
        ) {
          try {
            const roundData = await roundApi.getRoundsById(finalRoundId);
            targetSetId = normalizeId(
              roundData?.criteriaSetID || (roundData as any)?.criteriaSetId,
            );
          } catch (e) {}
        }

        if (
          !targetSetId ||
          targetSetId === "undefined" ||
          targetSetId === "null"
        ) {
          try {
            const allSetsRes = await apiClient.get("/api/Criteria/set");
            const allSets = getList(allSetsRes);
            const defaultSet =
              allSets.find(
                (s) => s.isDefault === true || s.IsDefault === true,
              ) || allSets[0];

            if (defaultSet) {
              targetSetId = normalizeId(
                defaultSet.criteriaSetID ||
                  defaultSet.criteriaSetId ||
                  defaultSet.id ||
                  defaultSet.setID,
              );
            }
          } catch (e) {}
        }

        // ==========================================
        // BƯỚC 3: NẠP TIÊU CHÍ
        // ==========================================
        let isCriteriaLoaded = false;

        if (
          targetSetId &&
          targetSetId !== "undefined" &&
          targetSetId !== "null"
        ) {
          try {
            const criteriaNameMap: Record<
              string,
              { name: string; desc: string }
            > = {};
            const allCriteria = await apiClient.get("/api/Criteria/criterion");
            getList(allCriteria).forEach((c: any) => {
              const cId = normalizeId(c.criteriaID || c.criteriaId || c.id);
              if (cId) {
                criteriaNameMap[cId] = {
                  name: c.criteriaName || c.CriteriaName || "Tiêu chí hệ thống",
                  desc: c.description || c.Description || "",
                };
              }
            });

            const mappingRes = await apiClient.get(
              `/api/Criteria/set/${targetSetId}`,
            );
            let mappingsArray = [];
            const data = mappingRes?.data ?? mappingRes;

            if (Array.isArray(data)) {
              mappingsArray = data;
            } else if (
              data?.criteriaList ||
              data?.mapping ||
              data?.items ||
              data?.CriteriaList
            ) {
              mappingsArray = getList(
                data.criteriaList ||
                  data.mapping ||
                  data.items ||
                  data.CriteriaList,
              );
            }

            if (mappingsArray.length > 0) {
              const mappedCriteria = mappingsArray.map((item: any) => {
                const rawCId =
                  item.criteriaId ||
                  item.CriteriaId ||
                  item.criteriaID ||
                  item.id;
                const cId = normalizeId(rawCId);
                const dictInfo = criteriaNameMap[cId] || {
                  name: "Tiêu chí đánh giá",
                  desc: "",
                };

                return {
                  id: cId || Math.random().toString(),
                  name:
                    item.criteria?.criteriaName ||
                    item.Criteria?.CriteriaName ||
                    dictInfo.name,
                  description:
                    item.criteria?.description ||
                    item.Criteria?.Description ||
                    dictInfo.desc,
                  maxScore: item.score || item.Score || item.maxScore || 0,
                  judgeScore: 0,
                };
              });

              setCriteriaList(mappedCriteria);
              isCriteriaLoaded = true;
            }
          } catch (error: any) {
            if (error.response?.status === 404) {
              Swal.fire({
                icon: "warning",
                title: "Bộ tiêu chí rỗng",
                text: "Admin chưa thêm câu hỏi nào vào bộ tiêu chí này.",
              });
              isCriteriaLoaded = true;
            }
          }
        }

        if (!isCriteriaLoaded) {
          Swal.fire({
            icon: "error",
            title: "Lỗi cấu hình",
            text: "Không nạp được bộ tiêu chí. Vui lòng liên hệ Admin!",
          });
        }

        // ==========================================
        // BƯỚC 4: TẢI ĐIỂM SỐ ĐÃ LƯU TRƯỚC ĐÓ (ĐÃ FIX LỖI ARRAY)
        // ==========================================
        try {
          const currentSubId = actualSubmissionId;
          if (currentSubId) {
            const evalRes =
              await judgeApi.getEvaluationBySubmission(currentSubId);
            let evalList = evalRes?.data ?? evalRes;

            if (evalList) {
              // Chuyển object thành mảng nếu BE lỡ trả về object
              if (!Array.isArray(evalList)) {
                if (Array.isArray(evalList.items)) evalList = evalList.items;
                else if (Array.isArray(evalList.data)) evalList = evalList.data;
                else evalList = [evalList];
              }

              if (Array.isArray(evalList) && evalList.length > 0) {
                // Tìm chính xác bài đánh giá của Giám khảo hiện tại
                const myEval =
                  evalList.find(
                    (e: any) =>
                      normalizeId(e.teacherId || e.teacherID || e.TeacherId) ===
                      normalizeId(currentTeacherId),
                  ) || evalList[0];

                const foundEvalId =
                  myEval?.evaluationID ||
                  myEval?.evaluationId ||
                  myEval?.id ||
                  myEval?.EvaluationID;

                if (foundEvalId) {
                  setEvaluationId(String(foundEvalId));
                  setFeedback(myEval?.reason || myEval?.feedback || "");
                  setSavedScore(myEval?.score);
                }
              }
            }
          }
        } catch (e) {
          console.log("Đội thi chưa có điểm trước đó.");
        }
      } catch (e) {
        console.error("Lỗi:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScoringData();
  }, [actualSubmissionId, teamFromList]);

  // Tính điểm
  const inputTotalScore = criteriaList.reduce(
    (acc, curr) => acc + (curr.judgeScore || 0),
    0,
  );
  const maxPossibleScore = criteriaList.reduce(
    (acc, curr) => acc + (curr.maxScore || 0),
    0,
  );

  const isEditing = criteriaList.some((c) => c.judgeScore > 0);
  const displayScore = isEditing ? inputTotalScore : savedScore || 0;

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
    if (!currentTeacherId) {
      Swal.fire({
        icon: "error",
        title: "Lỗi xác thực",
        text: "Không tìm thấy ID Giám khảo.",
      });
      return;
    }

    if (displayScore === 0) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu điểm",
        text: "Vui lòng nhập điểm > 0.",
      });
      return;
    }

    if (!feedback.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu Feedback",
        text: "Vui lòng nhập nhận xét.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const scoreNum = Number(displayScore);

      if (evaluationId) {
        // GỬI PUT (UPDATE) VỚI ĐÚNG FORMAT BACKEND ĐÒI HỎI
        const updatePayload = {
          score: scoreNum,
          reason: feedback.trim(),
          evaluationID: String(evaluationId), // Bắt buộc trùng tên property "evaluationID"
        };

        await apiClient.put(
          `/api/Evaluation/${currentTeacherId}`,
          updatePayload,
        );
      } else {
        // GỬI POST (CREATE MỚI)
        const createPayload = {
          submissionID: String(actualSubmissionId),
          score: scoreNum,
          reason: feedback.trim(),
        };

        await apiClient.post(
          `/api/Evaluation/${currentTeacherId}`,
          createPayload,
        );
      }

      Swal.fire({
        icon: "success",
        title: "Lưu điểm thành công!",
        text: `Đội thi đã được chấm: ${displayScore} điểm.`,
        timer: 2000,
        showConfirmButton: false,
      }).then(() => navigate("/judge"));
    } catch (error: any) {
      console.error("Lỗi khi lưu điểm:", error);
      Swal.fire({
        icon: "error",
        title: "Lưu thất bại",
        text:
          error.response?.data?.message || "Dữ liệu không khớp với Backend.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-bold animate-pulse">
          Đang nạp dữ liệu bài thi...
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
            className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-2 cursor-pointer"
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
              / {maxPossibleScore > 0 ? maxPossibleScore : 100}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        {/* ================= CỘT TRÁI ================= */}
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
                    Đội này đã được chấm <b>{savedScore} điểm</b>. Để cập nhật,
                    vui lòng nhập lại các điểm thành phần.
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

        {/* ================= CỘT PHẢI ================= */}
        <div className="lg:col-span-7">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 lg:p-8">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="text-blue-600" /> Rubric Đánh Giá
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Nhập điểm số cho từng tiêu chí, hệ thống sẽ tự động tính tổng.
            </p>

            {criteriaList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium text-lg">
                  Bộ tiêu chí trống
                </p>
                <p className="text-slate-400 mt-2 text-sm">
                  Vòng thi này hiện chưa có câu hỏi chấm điểm.
                </p>
              </div>
            ) : (
              criteriaList.map((crit, index) => (
                <div key={`${crit.id}-${index}`} className="mb-5 last:mb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl hover:border-blue-200 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {index + 1}. {crit.name}
                      </h4>
                      {crit.description && (
                        <p className="text-[12px] text-slate-500 mt-1">
                          {crit.description}
                        </p>
                      )}
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
              <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">
                Nhận xét & Góp ý (Feedback){" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-36 p-4 rounded-xl border outline-none text-sm transition-colors resize-none bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-medium"
                placeholder="Nhập nhận xét chi tiết..."
              ></textarea>
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
              <button
                onClick={handleSaveEvaluation}
                disabled={isSaving || criteriaList.length === 0}
                className="px-8 py-3 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer"
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
