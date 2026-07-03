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
  // Lấy submissionId từ URL (như ta đã thiết kế ở file Router)
  const { submissionId } = useParams();
  const location = useLocation();
  const teamInfo = location.state?.team;

  const user = useAuthStore((state: any) => state.user);
  const currentTeacherId =
    user?.id ||
    user?.Id ||
    user?.teacherId ||
    user?.teacherID ||
    user?.sub ||
    "";

  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [criteriaList, setCriteriaList] = useState<any[]>([]);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(true);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");

  // LOAD DỮ LIỆU
  useEffect(() => {
    if (!submissionId) {
      navigate("/judge");
      return;
    }

    const initData = async () => {
      // 1. Kiểm tra xem bài này mình đã chấm chưa để lôi điểm cũ ra sửa
      if (teamInfo?.evaluationId) {
        setIsUpdating(true);
        try {
          const evalRes = await apiClient.get(
            `/api/Evaluation/submission/${submissionId}`,
          );
          const oldEval = getList(evalRes).find(
            (e: any) =>
              String(e.teacherID || e.teacherId) === String(currentTeacherId),
          );
          if (oldEval) {
            setFeedback(oldEval.reason || "");
            // Mặc định API của BE hiện tại không trả về chi tiết từng tiêu chí,
            // nên ta không map lại được thanh trượt. Nhưng điểm tổng thì Backend đã lưu.
          }
        } catch (e) {
          console.error("Lỗi lấy điểm cũ:", e);
        }
      }

      // 2. Tải bộ tiêu chí
      if (teamInfo?.criteriaSetId) {
        try {
          const setRes = await criteriaApi.getSetById(teamInfo.criteriaSetId);
          const items =
            setRes?.data?.criteriaList ||
            setRes?.data?.CriteriaList ||
            setRes?.criteriaList ||
            setRes?.CriteriaList ||
            [];

          const allCRes = await criteriaApi.getAllCriteria();
          const cMap = getList(allCRes).reduce((acc: any, c: any) => {
            acc[c.id || c.criteriaId || c.criteriaID] =
              c.name || c.criteriaName;
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
      } else {
        setIsLoadingCriteria(false);
      }
    };

    initData();
  }, [submissionId, teamInfo, currentTeacherId, navigate]);

  const handleScoreChange = (criteriaId: string, value: string) => {
    let num = parseInt(value) || 0;
    if (num > 100) num = 100;
    if (num < 0) num = 0;
    setScores((prev) => ({ ...prev, [criteriaId]: num }));
  };

  const totalScore = criteriaList
    .reduce((sum, c) => {
      const point = scores[c.id] || 0;
      return sum + point * (c.weight / 100);
    }, 0)
    .toFixed(1);

  // CHUẨN HÓA API GỬI LÊN BACKEND
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

      if (isUpdating) {
        // [PUT] - Cập nhật điểm (cần truyền evaluationID)
        const putPayload = {
          evaluationID: teamInfo.evaluationId,
          score: Number(totalScore),
          reason: feedback || "Không có nhận xét",
        };
        await apiClient.put(`/api/Evaluation/${currentTeacherId}`, putPayload);
      } else {
        // [POST] - Chấm mới (cần truyền submissionID)
        const postPayload = {
          submissionID: submissionId,
          score: Number(totalScore),
          reason: feedback || "Không có nhận xét",
        };
        await apiClient.post(
          `/api/Evaluation/${currentTeacherId}`,
          postPayload,
        );
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

  if (!teamInfo)
    return (
      <div className="p-10 text-center text-slate-500">
        Dữ liệu bị lỗi. Vui lòng quay lại trang chủ.
      </div>
    );

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
            onClick={() => navigate("/judge")}
            className="text-sm font-semibold text-slate-500 hover:text-black flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Trở về Tổng quan
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-12 space-y-6 px-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Đang đánh giá: {teamInfo.name}
              {isUpdating && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Cập nhật điểm
                </span>
              )}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Hạng mục: {teamInfo.track}
            </p>
          </div>
        </div>

        {/* ... (Các phần UI khác bên trong ScoringPage tui giữ nguyên, không cần sửa) ... */}

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
              <span className="text-xl font-black text-amber-600">
                {totalScore}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {isLoadingCriteria ? (
              <div className="py-8 text-center text-slate-400 font-medium">
                <Activity className="animate-spin inline mr-2 mb-1" size={18} />{" "}
                Đang tải bộ tiêu chí...
              </div>
            ) : criteriaList.length === 0 ? (
              <div className="py-8 text-center text-red-500 font-medium">
                Vòng thi này chưa có bộ tiêu chí. Không thể chấm điểm!
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
                        className="w-16 text-center text-sm p-2 rounded-lg border outline-none font-bold bg-white focus:border-blue-500"
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
                Nhận xét của Giám khảo
              </h4>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-24 p-4 rounded-xl border focus:border-blue-500 outline-none text-sm resize-none"
                placeholder="Nhập nhận xét..."
              ></textarea>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSaveEvaluation}
                disabled={isSaving || criteriaList.length === 0}
                className="px-6 py-2.5 text-white font-bold bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-2"
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
