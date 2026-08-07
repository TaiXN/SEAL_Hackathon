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
import { showApiError } from "../../lib/utils/apiError";
import { jwtDecode } from "jwt-decode";

import apiClient from "../../lib/api/apiClient";
import { judgeApi } from "../../lib/api/judgeApi";
import { roundApi } from "../../lib/api/roundApi";
import { useAuthStore } from "../../stores/auth.store";

// Safely normalize common API response shapes into an array.
const getList = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  if (res?.data && Array.isArray(res.data?.data)) return res.data.data;
  return [];
};

// Normalize ids before comparing values from different API shapes.
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

  // Data state
  const [submissionData, setSubmissionData] = useState({
    githubUrl: "",
    demoUrl: "",
    slideUrl: "",
  });
  const [criteriaList, setCriteriaList] = useState<any[]>([]);

  // Reuse the evaluation id passed from the dashboard when available.
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

  // Keep the canonical submission id once it is resolved.
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
        // STEP 1: Load the team's submission information.
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
              mySub.id || mySub.submissionID || mySub.submissionId;
            if (foundSubmissionId) setActualSubmissionId(foundSubmissionId);
            if (!finalRoundId)
              finalRoundId = normalizeId(
                mySub.teamInRound?.roundId || mySub.teamInRound?.roundID,
              );
          }
        } catch (e) {
          console.warn("Failed to load submissions:", e);
        }

        // ==========================================
        // STEP 2: Resolve the criteria set id.
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
          } catch (e) {
            console.warn("Error fetching roundApi:", e);
          }
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
            if (defaultSet)
              targetSetId = normalizeId(
                defaultSet.criteriaSetID ||
                  defaultSet.criteriaSetId ||
                  defaultSet.id ||
                  defaultSet.setID,
              );
          } catch (e) {
            console.error("Error fetching fallback criteria set:", e);
          }
        }

        // ==========================================
        // STEP 3: Load scoring criteria.
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
              if (cId)
                criteriaNameMap[cId] = {
                  name: c.criteriaName || c.CriteriaName || "System Criteria",
                  desc: c.description || c.Description || "",
                };
            });

            const mappingRes = await apiClient.get(
              `/api/Criteria/set/${targetSetId}`,
            );
            let mappingsArray = [];
            const data = mappingRes?.data ?? mappingRes;

            if (Array.isArray(data)) mappingsArray = data;
            else if (
              data?.criteriaList ||
              data?.mapping ||
              data?.items ||
              data?.CriteriaList
            )
              mappingsArray = getList(
                data.criteriaList ||
                  data.mapping ||
                  data.items ||
                  data.CriteriaList,
              );

            if (mappingsArray.length > 0) {
              const mappedCriteria = mappingsArray.map((item: any) => {
                const rawCId =
                  item.criteriaId ||
                  item.CriteriaId ||
                  item.criteriaID ||
                  item.id;
                const cId = normalizeId(rawCId);
                const dictInfo = criteriaNameMap[cId] || {
                  name: "Evaluation Criteria",
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
                title: "Empty Criteria Set",
                text: "Admin has not added any questions to this criteria set.",
              });
              isCriteriaLoaded = true;
            }
          }
        }

        if (!isCriteriaLoaded) {
          Swal.fire({
            icon: "error",
            title: "This round has no rubric",
            text: "Scoring can't start until an admin attaches a rubric to this round. Please contact an admin.",
          });
        }

        // ==========================================
        // STEP 4: Load the previously saved score.
        // ==========================================
        try {
          const currentSubId = actualSubmissionId;
          if (actualSubmissionId) {
            const evalRes =
              await judgeApi.getEvaluationBySubmission(currentSubId);
            let evalList = evalRes?.data ?? evalRes;

            if (evalList) {
              // Convert object responses to arrays when needed.
              if (!Array.isArray(evalList)) {
                if (Array.isArray(evalList.items)) evalList = evalList.items;
                else if (Array.isArray(evalList.data)) evalList = evalList.data;
                else evalList = [evalList];
              }

              if (Array.isArray(evalList) && evalList.length > 0) {
                // Prefer the current judge's evaluation.
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
          console.log("This team does not have a previous score.");
        }
      } catch (e) {
        console.error("Failed to load scoring data:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScoringData();
  }, [actualSubmissionId, teamFromList]);

  // Score calculation
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
    if (!currentTeacherId)
      return Swal.fire({
        icon: "error",
        title: "Your session has expired",
        text: "Please sign in again before submitting scores.",
      });
    if (criteriaList.length === 0)
      return Swal.fire({
        icon: "warning",
        title: "Missing Score",
        text: "Please enter a score greater than 0.",
      });
    if (displayScore === 0)
      return Swal.fire({
        icon: "warning",
        title: "Missing Feedback",
        text: "Please enter your feedback.",
      });

    try {
      setIsSaving(true);
      const scoreNum = Number(displayScore);

      if (evaluationId) {
        // Send PUT with the payload shape expected by the backend.
        const updatePayload = {
          score: scoreNum,
          reason: feedback.trim(),
          evaluationID: String(evaluationId),
        };

        await apiClient.put(
          `/api/Evaluation/${currentTeacherId}`,
          updatePayload,
        );
      } else {
        // Create a new evaluation.
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
        title: "Score Saved Successfully!",
        text: `The team has been scored: ${displayScore} points.`,
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: "rounded-[2rem]" },
      }).then(() => navigate("/judge"));
    } catch (error: any) {
      console.error("Failed to save score:", error);
      showApiError(error, {
        action: "save these scores",
        hint: "Check that every criterion has a score within its allowed range, then save again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-bold animate-pulse">
          Loading submission data...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans text-slate-900 pb-12 animate-in fade-in duration-500">
      <header className="bg-white border-b border-slate-100 px-10 py-5 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all mr-2 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" strokeWidth={2.5} />
          </button>
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <Hexagon size={28} className="text-[#0a192f]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-[#0a192f] leading-tight">
              SCORING PANEL
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
              SEAL Hackathon
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#0a192f] border border-slate-800 px-6 py-3 rounded-2xl text-white font-black flex items-center gap-3 text-xl shadow-lg shadow-slate-900/10">
            <Calculator size={22} className="text-blue-400" />
            {displayScore}{" "}
            <span className="text-sm font-bold text-slate-400">
              / {maxPossibleScore > 0 ? maxPossibleScore : 100} points
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Team Being Scored
                  </p>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {teamFromList?.teamName ||
                      teamFromList?.name ||
                      "Unnamed Team"}
                  </h2>
                </div>
              </div>
            </div>

            {savedScore !== null && (
              <div className="mb-8 bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                <CheckCircle2
                  className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                  strokeWidth={2.5}
                />
                <div>
                  <p className="font-bold text-emerald-800 text-sm">
                    Existing Score Found
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    This team has already been scored at{" "}
                    <b>{savedScore} points</b>. To update it, enter the
                    component scores again.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl hover:bg-blue-50 transition-colors">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <GitBranch size={14} /> Source Code (GitHub)
                </p>
                {submissionData.githubUrl ? (
                  <a
                    href={submissionData.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline break-all"
                  >
                    {submissionData.githubUrl}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    Not updated yet
                  </p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:border-slate-200 hover:bg-white transition-all shadow-sm">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Globe size={14} strokeWidth={2.5} /> Demo / Website
                </p>
                {submissionData.demoUrl ? (
                  <a
                    href={submissionData.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline break-all"
                  >
                    {submissionData.demoUrl}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    Not updated yet
                  </p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl hover:bg-blue-50 transition-colors">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Download size={14} /> Slide Deck
                </p>
                {submissionData.slideUrl ? (
                  <a
                    href={submissionData.slideUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline break-all flex items-center gap-1.5"
                  >
                    View Presentation Slides
                  </a>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    Not updated yet
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="lg:col-span-7">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 lg:p-8">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="text-blue-600" /> Evaluation Rubric
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Enter scores for each criterion. The system will calculate the
              total.
            </p>

            {criteriaList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium text-lg">
                  Empty Criteria Set
                </p>
                <p className="text-slate-400 mt-2 text-sm">
                  This round does not have any scoring questions yet.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {criteriaList.map((crit, index) => (
                  <div
                    key={`${crit.id}-${index}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/80 border border-slate-100 p-6 rounded-[1.5rem] hover:border-blue-200 hover:bg-white transition-all shadow-sm"
                  >
                    <div className="flex-1">
                      <h4 className="font-extrabold text-[#0a192f] text-base">
                        {index + 1}. {crit.name}
                      </h4>
                      {crit.description && (
                        <p className="text-[13px] font-medium text-slate-500 mt-2 leading-relaxed">
                          {crit.description}
                        </p>
                      )}
                      <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        Maximum Score:{" "}
                        <span className="text-blue-600">{crit.maxScore}</span>
                      </p>
                    </div>
                    <div className="relative w-36 shrink-0">
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
                        className="w-full pl-5 pr-14 py-4 bg-white border border-slate-200 rounded-2xl text-xl font-black text-[#0a192f] text-center outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                        points
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-6 mt-6 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">
                Feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-36 p-4 rounded-xl border outline-none text-sm transition-colors resize-none bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-medium"
                placeholder="Enter detailed feedback..."
              ></textarea>
            </div>

            <div className="flex justify-end pt-8 mt-8 border-t border-slate-100">
              <button
                onClick={handleSaveEvaluation}
                disabled={isSaving || criteriaList.length === 0}
                className="px-10 py-4 text-white font-extrabold rounded-2xl shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 bg-[#0a192f] hover:bg-slate-800 cursor-pointer text-sm"
              >
                <Save size={18} strokeWidth={2.5} />
                {isSaving
                  ? "Saving score..."
                  : evaluationId
                    ? "Update Score"
                    : "Submit Score"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
