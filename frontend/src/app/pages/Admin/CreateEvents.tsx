import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  X,
  ArrowRight,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  CalendarClock,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// IMPORT API INSTANCES
import { criteriaApi } from "../../lib/api/criteriaApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { eventApi } from "../../lib/api/eventApi";
import { roundApi } from "../../lib/api/roundApi";
import apiClient from "../../lib/api/apiClient";

// SHARED HELPERS
import {
  getList,
  extractId,
  pickTrackId,
  grabSetId,
  sumWeight,
  buildCriteriaMap,
  loadSetsWithItems,
  looksLikeGuid,
  DEFAULT_CRITERIA_DESCRIPTION,
  type CriteriaItemView,
} from "../../lib/utils/criteriaHelpers";
import { showApiError, technicalDetails } from "../../lib/utils/apiError";

const BRAND = "#f26f21";
let seq = 1000;
const nextId = () => ++seq;

/** Tên bước triển khai, viết theo ngôn ngữ người dùng thay vì tên biến nội bộ */
const STEP_LABEL: Record<string, string> = {
  "Event Creation": "creating the event",
  "Tracks Configuration": "creating tracks and topics",
  "Rounds & Rubrics Configuration": "creating rounds and rubrics",
  "Personnel Assignment": "assigning judges and mentors",
};

interface CriterionRow {
  id: number;
  name: string;
  description: string;
  weight: number;
}

interface RoundConfig {
  id: number;
  roundName: string;
  startDate: string;
  endDate: string;
  // Cửa sổ chấm điểm — TÁCH RIÊNG khỏi cửa sổ nộp bài (startDate/endDate).
  // Backend bắt buộc cả hai mốc này trong CreateRoundAPIViewModel.
  scoringStartDate: string;
  scoringEndDate: string;
  minTeam: number;
  maxTeam: number;
  topNPromotion: number;
}

interface RubricConfig {
  mode: "new" | "reuse";
  setName: string;
  items: CriterionRow[];
  reuseSetId: string;
  // Bản sao CÓ THỂ SỬA của bộ tiêu chí đang mượn lại. Không sửa trực tiếp lên
  // `availableSets` để còn so sánh được với bản đang nằm trên server (dirty check).
  reuseItems: CriteriaItemView[];
  reuseSetName: string;
  reuseIsDefault: boolean;
}

const makeRound = (prev?: RoundConfig): RoundConfig => ({
  id: nextId(),
  roundName: "",
  startDate: prev?.scoringEndDate || prev?.endDate || "",
  endDate: "",
  scoringStartDate: "",
  scoringEndDate: "",
  minTeam: 1,
  maxTeam: prev ? Number(prev.topNPromotion) || 10 : 40,
  topNPromotion: prev ? 1 : 10,
});

const makeRubric = (): RubricConfig => ({
  mode: "new",
  setName: "",
  items: [{ id: nextId(), name: "", description: "", weight: 100 }],
  reuseSetId: "",
  reuseItems: [],
  reuseSetName: "",
  reuseIsDefault: true,
});

/** Bộ tiêu chí đang mượn lại đã bị sửa khác với bản trên server hay chưa. */
const isReuseDirty = (rubric: RubricConfig, picked: any): boolean => {
  if (!picked) return false;
  if ((rubric.reuseSetName || "").trim() !== (picked.setName || "").trim())
    return true;
  const mine = rubric.reuseItems || [];
  // So với ĐÚNG những dòng đã được nạp vào bản sao (xem selectSet), nếu không
  // một bộ có dòng thiếu criteriaId sẽ luôn bị coi là "chưa lưu".
  const theirs: CriteriaItemView[] = (picked.items || []).filter(
    (it: CriteriaItemView) => !!it.criteriaId,
  );
  if (mine.length !== theirs.length) return true;
  return mine.some(
    (it, i) =>
      String(it.criteriaId) !== String(theirs[i].criteriaId) ||
      Number(it.score) !== Number(theirs[i].score),
  );
};

/** Payload criteriaList cho PUT /api/Criteria/{setId} */
const toSetPayload = (rubric: RubricConfig) => ({
  setName: rubric.reuseSetName.trim(),
  isDefault: rubric.reuseIsDefault,
  criteriaList: (rubric.reuseItems || [])
    .filter((it) => !!it.criteriaId)
    .map((it) => ({
      criteriaId: String(it.criteriaId),
      score: Number(it.score),
    })),
});

// ==========================================================
// COMPONENT CARD ROUND & RUBRIC
// ==========================================================
/**
 * `min` cho mọi ô datetime-local trong trang tạo sự kiện: sự kiện đang được tạo
 * mới nên không mốc nào được phép rơi vào quá khứ.
 */
const nowLocalInput = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const isPastLocalInput = (v: string) =>
  !!v && new Date(v).getTime() < Date.now();

function RoundCard({ index, total, round, prevEnd, onChange, onRemove }: any) {
  const dStart = round.startDate ? new Date(round.startDate) : null;
  const dEnd = round.endDate ? new Date(round.endDate) : null;
  const dPrevEnd = prevEnd ? new Date(prevEnd) : null;

  const dScoreStart = round.scoringStartDate
    ? new Date(round.scoringStartDate)
    : null;
  const dScoreEnd = round.scoringEndDate ? new Date(round.scoringEndDate) : null;

  const endBeforeStart = !!(dStart && dEnd && dEnd <= dStart);
  const overlapsPrev = !!(dStart && dPrevEnd && dStart < dPrevEnd);
  const topTooHigh = Number(round.topNPromotion) > Number(round.maxTeam);
  const scoreEndBeforeStart = !!(
    dScoreStart &&
    dScoreEnd &&
    dScoreEnd <= dScoreStart
  );
  const scoreBeforeSubmit = !!(dEnd && dScoreStart && dScoreStart < dEnd);
  const minOverMax = Number(round.minTeam) > Number(round.maxTeam);
  const hasPastDate = [
    round.startDate,
    round.endDate,
    round.scoringStartDate,
    round.scoringEndDate,
  ].some(isPastLocalInput);
  const minDate = nowLocalInput();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative">
      <div className="flex items-start justify-between mb-4">
        <h4 className="font-black text-slate-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-fpt-orange-soft text-fpt-orange text-xs font-black flex items-center justify-center">
            {index + 1}
          </span>
          Round {index + 1}
        </h4>
        {total > 1 && (
          <button
            onClick={onRemove}
            className="text-slate-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <label className="text-[11px] font-bold text-slate-500 uppercase">
          Round name
        </label>
        <input
          type="text"
          value={round.roundName}
          onChange={(e) => onChange({ roundName: e.target.value })}
          placeholder="e.g. Preliminary Round, Semi Final..."
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-fpt-orange"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Opens at
          </label>
          <input
            type="datetime-local"
            min={minDate}
            value={round.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-fpt-orange"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Closes at (submission deadline)
          </label>
          <input
            type="datetime-local"
            min={minDate}
            value={round.endDate}
            onChange={(e) => onChange({ endDate: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-fpt-orange"
          />
        </div>
      </div>

      {/* Cửa sổ chấm điểm: backend lưu riêng, không suy ra từ start/end nộp bài */}
      <div className="grid grid-cols-2 gap-4 mb-4 border-t border-slate-100 pt-4">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Judging opens at
          </label>
          <input
            type="datetime-local"
            min={minDate}
            value={round.scoringStartDate}
            onChange={(e) => onChange({ scoringStartDate: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-fpt-orange"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Judging closes at
          </label>
          <input
            type="datetime-local"
            min={minDate}
            value={round.scoringEndDate}
            onChange={(e) => onChange({ scoringEndDate: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-fpt-orange"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Min teams
          </label>
          <input
            type="number"
            min="1"
            value={round.minTeam}
            onChange={(e) => onChange({ minTeam: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-fpt-orange"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Max teams
          </label>
          <input
            type="number"
            min="1"
            value={round.maxTeam}
            onChange={(e) => onChange({ maxTeam: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-fpt-orange"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Teams advancing (Top N)
          </label>
          <input
            type="number"
            min="1"
            value={round.topNPromotion}
            onChange={(e) =>
              onChange({ topNPromotion: Number(e.target.value) })
            }
            className="w-full px-3 py-2 text-sm font-bold text-fpt-orange bg-fpt-orange-soft border border-orange-200 rounded-lg outline-none focus:border-fpt-orange"
          />
        </div>
      </div>

      {(endBeforeStart ||
        overlapsPrev ||
        topTooHigh ||
        scoreEndBeforeStart ||
        scoreBeforeSubmit ||
        minOverMax ||
        hasPastDate) && (
        <div className="mt-4 space-y-1">
          {hasPastDate && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> Dates cannot be in the past.
            </p>
          )}
          {endBeforeStart && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> The closing time must be after the
              opening time.
            </p>
          )}
          {overlapsPrev && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> This round cannot start before the
              previous one has finished judging.
            </p>
          )}
          {topTooHigh && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> Teams advancing cannot exceed max teams.
            </p>
          )}
          {scoreEndBeforeStart && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> Judging must close after it opens.
            </p>
          )}
          {scoreBeforeSubmit && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> Judging cannot start before the
              submission deadline.
            </p>
          )}
          {minOverMax && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> Min teams cannot exceed max teams.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RubricCard({
  index,
  roundName,
  rubric,
  defaultSetName,
  availableSets,
  allCriteria,
  loadingSets,
  loadSetsError,
  onRetryLoad,
  onChange,
  onSaveReuse,
  savingReuse,
}: any) {
  const picked = availableSets.find(
    (s: any) => String(s.setId) === String(rubric.reuseSetId),
  );
  const reuseItems: CriteriaItemView[] = rubric.reuseItems || [];
  const items = rubric.mode === "new" ? rubric.items : reuseItems;
  const total = sumWeight(items);
  const isFull = total === 100;
  const hasEmptyName =
    rubric.mode === "new" && rubric.items.some((i: any) => !i.name.trim());
  const dirty = rubric.mode === "reuse" && isReuseDirty(rubric, picked);
  const canSaveReuse =
    dirty && isFull && reuseItems.length > 0 && !!rubric.reuseSetName.trim();

  // Tiêu chí có sẵn trong hệ thống nhưng CHƯA nằm trong bộ đang mở.
  const addableCriteria = (allCriteria || []).filter(
    (c: any) =>
      !reuseItems.some(
        (it) => String(it.criteriaId) === String(c.criteriaId),
      ),
  );

  const updateItem = (id: number, patch: Partial<CriterionRow>) =>
    onChange({
      items: rubric.items.map((i: any) =>
        i.id === id ? { ...i, ...patch } : i,
      ),
    });

  /** Nạp bản sao có thể sửa khi admin chọn một bộ tiêu chí trong danh sách. */
  const selectSet = (setId: string) => {
    const target = availableSets.find(
      (s: any) => String(s.setId) === String(setId),
    );
    onChange({
      reuseSetId: setId,
      reuseSetName: target?.setName || "",
      reuseIsDefault: target?.isDefault ?? true,
      // Bỏ qua dòng không dò ra criteriaId: nó không gửi lên PUT được, mà giữ
      // lại thì tổng trọng số hiển thị sẽ khác với thứ thực sự được lưu.
      reuseItems: (target?.items || [])
        .filter((it: CriteriaItemView) => !!it.criteriaId)
        .map((it: CriteriaItemView) => ({ ...it })),
    });
  };

  const patchReuseItem = (criteriaId: string, score: number) =>
    onChange({
      reuseItems: reuseItems.map((it) =>
        String(it.criteriaId) === String(criteriaId) ? { ...it, score } : it,
      ),
    });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <h4 className="font-black text-slate-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-fpt-orange-soft text-fpt-orange text-xs font-black flex items-center justify-center">
            {index + 1}
          </span>
          {roundName || `Round ${index + 1}`}
        </h4>
        <div className="flex gap-1">
          {(["new", "reuse"] as const).map((m) => (
            <button
              key={m}
              onClick={() => onChange({ mode: m })}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${rubric.mode === m ? "bg-fpt-orange text-white border-fpt-orange" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
            >
              {m === "new" ? "New rubric" : "Existing rubric"}
            </button>
          ))}
        </div>
      </div>

      {rubric.mode === "new" ? (
        <>
          <div className="space-y-2 mb-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase">
              Rubric set name
            </label>
            <input
              type="text"
              value={rubric.setName}
              onChange={(e) => onChange({ setName: e.target.value })}
              placeholder={defaultSetName}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold focus:border-fpt-orange"
            />
          </div>
          <div className="space-y-3">
            {rubric.items.map((r: any) => (
              <div
                key={r.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
              >
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => updateItem(r.id, { name: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none font-semibold focus:border-fpt-orange"
                    placeholder="Criterion name"
                  />
                  <div className="relative w-20">
                    <input
                      type="number"
                      value={r.weight}
                      onChange={(e) =>
                        updateItem(r.id, { weight: Number(e.target.value) })
                      }
                      className="w-full px-2 py-2 pr-6 text-sm text-center bg-white border border-slate-200 rounded-lg font-black outline-none focus:border-fpt-orange"
                    />
                    <span className="absolute right-2 top-2 text-slate-400 text-sm font-bold">
                      %
                    </span>
                  </div>
                  {rubric.items.length > 1 && (
                    <button
                      onClick={() =>
                        onChange({
                          items: rubric.items.filter((i: any) => i.id !== r.id),
                        })
                      }
                      className="text-slate-300 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={r.description}
                  onChange={(e) =>
                    updateItem(r.id, { description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-600 focus:border-fpt-orange"
                  placeholder="Description (optional)"
                />
              </div>
            ))}
            <button
              onClick={() =>
                onChange({
                  items: [
                    ...rubric.items,
                    { id: nextId(), name: "", description: "", weight: 0 },
                  ],
                })
              }
              className="text-xs font-bold text-slate-500 hover:text-fpt-orange mt-2 flex items-center gap-1"
            >
              <Plus size={12} /> Add criterion
            </button>
          </div>
        </>
      ) : (
        <>
          {loadingSets && (
            <div className="flex justify-center py-8 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin mr-2" /> Loading rubric
              sets...
            </div>
          )}
          {!loadingSets && loadSetsError && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <AlertCircle size={22} className="text-red-500" />
              <p className="text-sm text-red-500 font-semibold">
                {loadSetsError}
              </p>
              <button
                onClick={onRetryLoad}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          )}
          {!loadingSets && !loadSetsError && availableSets.length === 0 && (
            <p className="text-sm text-slate-400 italic py-8 text-center">
              No rubric set exists yet.
            </p>
          )}
          {!loadingSets && !loadSetsError && availableSets.length > 0 && (
            <>
              <select
                value={rubric.reuseSetId}
                onChange={(e) => selectSet(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold focus:border-fpt-orange"
              >
                <option value="">-- Select a rubric set --</option>
                {availableSets.map((s: any) => (
                  <option key={s.setId} value={s.setId}>
                    {s.setName}
                  </option>
                ))}
              </select>

              {picked && (
                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      Rubric set name
                    </label>
                    <input
                      type="text"
                      value={rubric.reuseSetName}
                      onChange={(e) =>
                        onChange({ reuseSetName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold focus:border-fpt-orange"
                    />
                  </div>

                  <div className="space-y-2">
                    {reuseItems.length === 0 && (
                      <p className="text-sm text-slate-400 italic py-4 text-center">
                        This set has no criterion left. Add at least one below.
                      </p>
                    )}
                    {reuseItems.map((it) => (
                      <div
                        key={String(it.criteriaId)}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2 items-center"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">
                            {it.name}
                          </p>
                          {!!it.description && (
                            <p className="text-[11px] text-slate-400 truncate">
                              {it.description}
                            </p>
                          )}
                        </div>
                        <div className="relative w-20 shrink-0">
                          <input
                            type="number"
                            value={it.score}
                            onChange={(e) =>
                              patchReuseItem(
                                String(it.criteriaId),
                                Number(e.target.value),
                              )
                            }
                            className="w-full px-2 py-2 pr-6 text-sm text-center bg-white border border-slate-200 rounded-lg font-black outline-none focus:border-fpt-orange"
                          />
                          <span className="absolute right-2 top-2 text-slate-400 text-sm font-bold">
                            %
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            onChange({
                              reuseItems: reuseItems.filter(
                                (x) =>
                                  String(x.criteriaId) !==
                                  String(it.criteriaId),
                              ),
                            })
                          }
                          className="text-slate-300 hover:text-red-500 p-1 shrink-0"
                          title="Remove from this set"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {addableCriteria.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Add an existing criterion
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          const found = addableCriteria.find(
                            (c: any) =>
                              String(c.criteriaId) === String(e.target.value),
                          );
                          if (!found) return;
                          onChange({
                            reuseItems: [
                              ...reuseItems,
                              { ...found, score: 0 },
                            ],
                          });
                        }}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none font-semibold focus:border-fpt-orange"
                      >
                        <option value="">-- Pick a criterion to add --</option>
                        {addableCriteria.map((c: any) => (
                          <option key={c.criteriaId} value={c.criteriaId}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {(rubric.mode === "new" || !!picked) && (
        <>
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between font-bold text-sm">
            <span className="text-slate-500">Total weight:</span>
            <span className={isFull ? "text-emerald-600" : "text-red-500"}>
              {total}%
            </span>
          </div>
          {!isFull && (
            <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> The total weight of this rubric must be
              exactly 100%.
            </p>
          )}
          {hasEmptyName && (
            <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> Every criterion needs a name.
            </p>
          )}
        </>
      )}

      {dirty && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          {/* Backend tách bản sửa thành một bộ riêng cho sự kiện đang tạo, nên
              các sự kiện cũ KHÔNG bị ảnh hưởng — nói rõ để admin yên tâm sửa. */}
          <p className="text-[11px] text-slate-500 font-semibold flex items-start gap-1">
            <Info size={12} className="mt-0.5 shrink-0" /> Saving keeps this
            edited rubric for the event you are creating. Events already using
            the original set are not affected.
          </p>
          <button
            onClick={onSaveReuse}
            disabled={!canSaveReuse || savingReuse}
            className="w-full px-4 py-2.5 text-sm font-bold rounded-xl bg-fpt-orange text-white hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {savingReuse ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Save changes to this rubric set
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================================
// MAIN COMPONENT (ORCHESTRATOR PATTERN)
// ==========================================================
export function CreateEvents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);
  const [furthestTab, setFurthestTab] = useState(1);

  // 1. STATE BƯỚC 1
  const [eventForm, setEventForm] = useState({
    eventName: "",
    season: "Fall",
    year: new Date().getFullYear(),
    registrationStartDate: "",
    registrationEndDate: "",
    minTeamMember: 3,
    maxTeamMember: 5,
  });

  // 2. STATE BƯỚC 2
  const [tracks, setTracks] = useState<any[]>([
    { id: nextId(), name: "", topics: [], maxTeam: 20 },
  ]);
  const [topicInputs, setTopicInputs] = useState<{ [key: number]: string }>({});

  // 3. STATE BƯỚC 3
  const [rounds, setRounds] = useState<RoundConfig[]>([makeRound()]);

  // 4. STATE BƯỚC 4
  const [rubrics, setRubrics] = useState<Record<number, RubricConfig>>({
    [rounds[0].id]: makeRubric(),
  });
  const [availableSets, setAvailableSets] = useState<any[]>([]);
  // Danh mục tiêu chí toàn hệ thống — dùng cho ô "thêm tiêu chí có sẵn" khi sửa
  // một bộ tiêu chí mượn lại.
  const [allCriteria, setAllCriteria] = useState<CriteriaItemView[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadSetsError, setLoadSetsError] = useState<string | null>(null);
  const [setsLoaded, setSetsLoaded] = useState(false);
  const [savingSetId, setSavingSetId] = useState<string | null>(null);

  // 5. STATE BƯỚC 5
  const [rawTeachers, setRawTeachers] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({
    trackLocalId: "",
    teacherId: "",
    isMentor: true,
  });
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);

  // 6. STATE BƯỚC 6
  const [eventPrizes, setEventPrizes] = useState<any[]>([
    {
      id: nextId(),
      prizeName: "First Prize",
      description: "Gold Medal + 5,000,000 VND",
      rankIndex: 1,
    },
    {
      id: nextId(),
      prizeName: "Second Prize",
      description: "Silver Medal + 3,000,000 VND",
      rankIndex: 2,
    },
    {
      id: nextId(),
      prizeName: "Third Prize",
      description: "Bronze Medal + 1,000,000 VND",
      rankIndex: 3,
    },
  ]);

  // TRẠNG THÁI DEPLOY
  const [isLaunching, setIsLaunching] = useState(false);

  // Sync rubrics array when round amount changes
  useEffect(() => {
    setRubrics((prev) => {
      const next: Record<number, RubricConfig> = {};
      let changed = Object.keys(prev).length !== rounds.length;
      rounds.forEach((r) => {
        next[r.id] = prev[r.id] || makeRubric();
        if (!prev[r.id]) changed = true;
      });
      return changed ? next : prev;
    });
  }, [rounds]);

  const patchRound = (id: number, patch: Partial<RoundConfig>) =>
    setRounds((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // Chấm điểm gần như luôn bắt đầu ngay khi hết hạn nộp bài, nên điền hộ
        // mốc đó — nhưng CHỈ khi admin chưa tự đặt, để không đè lên lựa chọn
        // của họ. Không tự điền scoringEndDate: không đoán được chấm bao lâu.
        if (patch.endDate !== undefined && !r.scoringStartDate)
          next.scoringStartDate = patch.endDate;
        return next;
      }),
    );
  const patchRubric = (roundId: number, patch: Partial<RubricConfig>) =>
    setRubrics((prev) => ({
      ...prev,
      [roundId]: { ...(prev[roundId] || makeRubric()), ...patch },
    }));
  const defaultSetNameFor = (r: RoundConfig, idx: number) =>
    `${eventForm.eventName || "Event"} - ${r.roundName || `Round ${idx + 1}`} Rubric`;

  /**
   * Đẩy các thay đổi của một bộ tiêu chí mượn lại lên server và trả về setId
   * SẼ ĐƯỢC DÙNG cho vòng thi.
   *
   * ⚠️ Backend tách bản sửa thành một bộ tiêu chí riêng để không đụng vào các
   * sự kiện cũ, nên nó có thể trả về một setId mới. Vòng thi phải trỏ vào ID
   * trả về này; nếu response không kèm ID hợp lệ thì hiểu là backend sửa tại
   * chỗ và giữ nguyên ID cũ.
   *
   * Tách riêng khỏi state để bước Launch cũng gọi lại được mà không phải chờ
   * React cập nhật xong `rubrics`.
   */
  const pushReuseSet = async (
    rubric: RubricConfig,
    knownSetIds: string[],
  ): Promise<string> => {
    const res = await criteriaApi.updateSet(
      rubric.reuseSetId,
      toSetPayload(rubric),
    );

    const returnedId = extractId(res);
    if (looksLikeGuid(returnedId)) return returnedId;

    // Backend không kèm ID trong response: dò lại danh sách để tìm bộ VỪA xuất
    // hiện thêm. Bỏ qua bước này thì lần sửa kế tiếp lại nhắm vào bộ GỐC và
    // backend từ chối (bộ mới cùng tên đã tồn tại).
    try {
      const known = new Set(knownSetIds.map(String));
      const wantedName = rubric.reuseSetName.trim().toLowerCase();
      const created = getList(await criteriaApi.getAllSet())
        .map((s: any) => ({
          id: grabSetId(s),
          name: String(s.setName || "").trim().toLowerCase(),
        }))
        .find(
          (s) =>
            !!s.id && !known.has(String(s.id)) && looksLikeGuid(s.id) &&
            s.name === wantedName,
        );
      if (created?.id) return created.id;
    } catch (e) {
      console.warn("Không dò lại được danh sách bộ tiêu chí sau khi cập nhật", e);
    }
    return rubric.reuseSetId;
  };

  const handleSaveReuseSet = async (roundId: number) => {
    const rubric = rubrics[roundId];
    if (!rubric || rubric.mode !== "reuse" || !rubric.reuseSetId) return;
    if (!rubric.reuseSetName.trim())
      return Swal.fire({
        icon: "warning",
        title: "Missing name",
        text: "The rubric set needs a name.",
        confirmButtonColor: BRAND,
      });
    if (rubric.reuseItems.length === 0)
      return Swal.fire({
        icon: "warning",
        title: "Empty rubric",
        text: "A rubric set needs at least one criterion.",
        confirmButtonColor: BRAND,
      });
    if (sumWeight(rubric.reuseItems) !== 100)
      return Swal.fire({
        icon: "error",
        title: "Total weight is not 100%",
        text: "Adjust the weights so they add up to exactly 100%.",
        confirmButtonColor: BRAND,
      });

    const previousSetId = rubric.reuseSetId;
    try {
      setSavingSetId(previousSetId);
      const effectiveSetId = await pushReuseSet(
        rubric,
        availableSets.map((s) => String(s.setId)),
      );
      const isNewSet = String(effectiveSetId) !== String(previousSetId);

      const savedName = rubric.reuseSetName.trim();
      const savedItems = rubric.reuseItems.map((it) => ({ ...it }));
      const savedSet = {
        setId: effectiveSetId,
        setName: savedName,
        isDefault: rubric.reuseIsDefault,
        items: savedItems,
      };

      // Backend tách bản sửa ra thành bộ mới ⇒ THÊM vào danh sách chứ không ghi
      // đè bộ cũ: các vòng khác vẫn đang trỏ vào bộ cũ và phải giữ nguyên.
      setAvailableSets((prev) =>
        isNewSet
          ? [...prev, savedSet]
          : prev.map((s) =>
              String(s.setId) === String(previousSetId)
                ? { ...s, ...savedSet }
                : s,
            ),
      );
      // Chỉ đổi vòng đang thao tác sang bộ mới. Nếu backend sửa tại chỗ (không
      // trả ID mới) thì mới đồng bộ luôn các vòng khác dùng chung bộ đó, để
      // chúng không bị coi là còn thay đổi chưa lưu.
      setRubrics((prev) => {
        const next: Record<number, RubricConfig> = { ...prev };
        Object.keys(next).forEach((key) => {
          const rid = Number(key);
          const other = next[rid];
          if (other.mode !== "reuse") return;
          const isTarget = rid === roundId;
          const sharesOldSet =
            String(other.reuseSetId) === String(previousSetId);
          if (!isTarget && (isNewSet || !sharesOldSet)) return;
          next[rid] = {
            ...other,
            reuseSetId: effectiveSetId,
            reuseSetName: savedName,
            reuseItems: savedItems.map((it) => ({ ...it })),
          };
        });
        return next;
      });

      Swal.fire({
        icon: "success",
        title: isNewSet ? "New rubric set created!" : "Rubric set updated!",
        text: isNewSet
          ? "This round now uses the updated copy. Past events keep their original rubric."
          : undefined,
        timer: isNewSet ? 2200 : 1400,
        showConfirmButton: false,
      });
    } catch (e: any) {
      showApiError(e, {
        action: "save this rubric set",
        hint: "A rubric set with this name may already exist — try a different name, then save again.",
      });
    } finally {
      setSavingSetId(null);
    }
  };

  const loadAvailableSets = async () => {
    try {
      setLoadingSets(true);
      setLoadSetsError(null);
      const [setsRaw, critRaw] = await Promise.all([
        criteriaApi.getAllSet(),
        criteriaApi.getAllCriteria(),
      ]);
      const critMap = buildCriteriaMap(critRaw);
      setAllCriteria(
        Object.entries(critMap).map(([criteriaId, info]) => ({
          criteriaId,
          name: info.name,
          description: info.description,
          score: 0,
        })),
      );
      const baseSets = getList(setsRaw)
        .map((s: any) => ({
          setId: grabSetId(s),
          setName: s.setName || "Rubric set",
          // isDefault phải giữ lại: PUT cập nhật bộ tiêu chí gửi nguyên field này,
          // thiếu là vô tình đổi cờ mặc định của bộ đang có.
          isDefault: (s.isDefault ?? s.IsDefault ?? true) === true,
        }))
        .filter(
          (s): s is { setId: string; setName: string; isDefault: boolean } =>
            !!s.setId,
        );
      const enriched = await loadSetsWithItems(baseSets, critMap, (setId) =>
        criteriaApi.getSetById(setId),
      );
      setAvailableSets(enriched);
      setSetsLoaded(true);
    } catch (e) {
      setLoadSetsError("Could not load the existing rubric sets.");
    } finally {
      setLoadingSets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 4 && !setsLoaded && !loadingSets) loadAvailableSets();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 5 && rawTeachers.length === 0) {
      apiClient
        .get(`/api/Teacher/available?t=${Date.now()}`)
        .then((res) => setRawTeachers(getList(res.data)))
        .catch(() => {});
    }
  }, [activeTab]);

  const advanceTab = (targetTab: number) => {
    setActiveTab(targetTab);
    if (targetTab > furthestTab) setFurthestTab(targetTab);
  };

  // ==========================================
  // LOCAL VALIDATORS (KHÔNG GỌI API)
  // ==========================================
  const handleValidateEvent = () => {
    if (!eventForm.eventName.trim())
      return Swal.fire({
        icon: "warning",
        title: "Missing name",
        text: "Please enter the event name.",
        confirmButtonColor: BRAND,
      });

    if (!eventForm.registrationStartDate || !eventForm.registrationEndDate) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Reg Timeline",
        text: "Please provide both opening and closing dates for registration.",
        confirmButtonColor: BRAND,
      });
    }

    if (
      [
        eventForm.registrationStartDate,
        eventForm.registrationEndDate,
      ].some(isPastLocalInput)
    ) {
      return Swal.fire({
        icon: "error",
        title: "Date is in the past",
        text: "Registration dates must be set in the future.",
        confirmButtonColor: BRAND,
      });
    }

    if (
      new Date(eventForm.registrationEndDate) <=
      new Date(eventForm.registrationStartDate)
    ) {
      return Swal.fire({
        icon: "error",
        title: "Invalid Dates",
        text: "The registration end date must be after the start date.",
        confirmButtonColor: BRAND,
      });
    }

    if (eventForm.minTeamMember < 1) {
      return Swal.fire({
        icon: "error",
        title: "Invalid Minimum",
        text: "A team must have at least 1 member.",
        confirmButtonColor: BRAND,
      });
    }

    if (eventForm.maxTeamMember < eventForm.minTeamMember) {
      return Swal.fire({
        icon: "error",
        title: "Limit Conflict",
        text: "Max team members cannot be less than Min team members.",
        confirmButtonColor: BRAND,
      });
    }

    advanceTab(2);
  };

  const handleValidateTracks = () => {
    const hasValidTrack = tracks.some((t) => t.name.trim().length > 0);
    if (!hasValidTrack)
      return Swal.fire({
        icon: "warning",
        title: "Missing Tracks",
        text: "Please create at least one track.",
        confirmButtonColor: BRAND,
      });

    for (const t of tracks) {
      if (t.name.trim() && (!t.maxTeam || Number(t.maxTeam) < 1)) {
        return Swal.fire({
          icon: "warning",
          title: "Invalid Max Teams",
          text: `Please enter a valid max team number (greater than 0) for track "${t.name}".`,
          confirmButtonColor: BRAND,
        });
      }
    }

    advanceTab(3);
  };

  const handleValidateRounds = () => {
    if (rounds.length === 0)
      return Swal.fire({
        icon: "warning",
        title: "No round",
        text: "The event needs at least one round.",
        confirmButtonColor: BRAND,
      });

    const totalTrackCapacity = tracks.reduce(
      (sum, t) => sum + (Number(t.maxTeam) || 0),
      0,
    );

    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      const label = r.roundName.trim() || `Round ${i + 1}`;
      if (!r.roundName.trim())
        return Swal.fire({
          icon: "warning",
          title: "Missing round name",
          text: `Please enter a name for round ${i + 1}.`,
          confirmButtonColor: BRAND,
        });
      if (!r.startDate || !r.endDate)
        return Swal.fire({
          icon: "warning",
          title: "Missing schedule",
          text: `Please fill in the opening and closing time of "${label}".`,
          confirmButtonColor: BRAND,
        });
      // Backend đánh dấu scoringStartDate/scoringEndDate là BẮT BUỘC, bỏ trống
      // là ăn 400 "Error while creating round" mà không nói thiếu field nào.
      if (!r.scoringStartDate || !r.scoringEndDate)
        return Swal.fire({
          icon: "warning",
          title: "Missing judging window",
          text: `Please fill in when judging opens and closes for "${label}".`,
          confirmButtonColor: BRAND,
        });
      const dStart = new Date(r.startDate),
        dEnd = new Date(r.endDate),
        dScoreStart = new Date(r.scoringStartDate),
        dScoreEnd = new Date(r.scoringEndDate);
      if (
        isNaN(dStart.getTime()) ||
        isNaN(dEnd.getTime()) ||
        isNaN(dScoreStart.getTime()) ||
        isNaN(dScoreEnd.getTime())
      )
        return Swal.fire({
          icon: "warning",
          title: "Invalid date",
          text: `The schedule of "${label}" is invalid.`,
          confirmButtonColor: BRAND,
        });
      if (
        [
          r.startDate,
          r.endDate,
          r.scoringStartDate,
          r.scoringEndDate,
        ].some(isPastLocalInput)
      )
        return Swal.fire({
          icon: "error",
          title: "Date is in the past",
          text: `The schedule of "${label}" cannot be set in the past.`,
          confirmButtonColor: BRAND,
        });
      if (dEnd <= dStart)
        return Swal.fire({
          icon: "warning",
          title: "Wrong schedule",
          text: `"${label}" must close after it opens.`,
          confirmButtonColor: BRAND,
        });
      if (dScoreEnd <= dScoreStart)
        return Swal.fire({
          icon: "warning",
          title: "Wrong judging window",
          text: `Judging for "${label}" must close after it opens.`,
          confirmButtonColor: BRAND,
        });
      if (dScoreStart < dEnd)
        return Swal.fire({
          icon: "warning",
          title: "Wrong judging window",
          text: `Judging for "${label}" cannot start before its submission deadline.`,
          confirmButtonColor: BRAND,
        });

      if (i === 0 && eventForm.registrationEndDate) {
        const regEnd = new Date(eventForm.registrationEndDate);
        if (dStart < regEnd) {
          return Swal.fire({
            icon: "error",
            title: "Timeline Conflict",
            text: `Round 1 cannot start before the Registration closes (${regEnd.toLocaleString()}).`,
            confirmButtonColor: BRAND,
          });
        }
      }

      // Vòng sau chỉ mở được khi vòng trước đã chấm xong: danh sách đội vào
      // vòng này chính là Top N lấy từ điểm của vòng trước.
      if (i > 0) {
        const prev = rounds[i - 1];
        const prevDone = new Date(prev.scoringEndDate || prev.endDate);
        if (dStart < prevDone)
          return Swal.fire({
            icon: "warning",
            title: "Overlapping rounds",
            text: `"${label}" cannot start before the previous round has finished judging.`,
            confirmButtonColor: BRAND,
          });
      }
      if (
        Number(r.maxTeam) < 1 ||
        Number(r.topNPromotion) < 1 ||
        Number(r.minTeam) < 1
      )
        return Swal.fire({
          icon: "warning",
          title: "Invalid team numbers",
          text: `Min teams, max teams and teams advancing must be at least 1.`,
          confirmButtonColor: BRAND,
        });
      if (Number(r.minTeam) > Number(r.maxTeam))
        return Swal.fire({
          icon: "warning",
          title: "Invalid team numbers",
          text: `Min teams of "${label}" cannot exceed its max teams.`,
          confirmButtonColor: BRAND,
        });

      if (i === 0 && Number(r.maxTeam) < totalTrackCapacity) {
        return Swal.fire({
          icon: "error",
          title: "Capacity Conflict",
          html: `Total capacity across all Tracks is <b>${totalTrackCapacity} teams</b>.<br/>However, ${label} only allows a maximum of <b>${r.maxTeam} teams</b>.<br/><br/>Please increase ${label}'s Max Teams to at least ${totalTrackCapacity}.`,
          confirmButtonColor: BRAND,
        });
      }

      if (Number(r.topNPromotion) > Number(r.maxTeam))
        return Swal.fire({
          icon: "warning",
          title: "Invalid team numbers",
          text: `Teams advancing from "${label}" cannot exceed its max teams.`,
          confirmButtonColor: BRAND,
        });
    }
    advanceTab(4);
  };

  const handleValidateRubrics = () => {
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      const rub = rubrics[r.id];
      const label = r.roundName.trim() || `Round ${i + 1}`;
      if (!rub)
        return Swal.fire({
          icon: "error",
          title: "Missing rubric",
          text: `"${label}" has no rubric yet.`,
          confirmButtonColor: BRAND,
        });
      if (rub.mode === "reuse") {
        const picked = availableSets.find(
          (s) => String(s.setId) === String(rub.reuseSetId),
        );
        if (!picked)
          return Swal.fire({
            icon: "warning",
            title: "No rubric selected",
            text: `Please pick an existing set for "${label}".`,
            confirmButtonColor: BRAND,
          });
        if (rub.reuseItems.length === 0)
          return Swal.fire({
            icon: "warning",
            title: "Empty rubric",
            text: `Rubric of "${label}" needs at least one criterion.`,
            confirmButtonColor: BRAND,
          });
        if (!rub.reuseSetName.trim())
          return Swal.fire({
            icon: "warning",
            title: "Missing name",
            text: `The rubric set of "${label}" needs a name.`,
            confirmButtonColor: BRAND,
          });
        if (sumWeight(rub.reuseItems) !== 100)
          return Swal.fire({
            icon: "error",
            title: "Total weight is not 100%",
            text: `Rubric for "${label}" must add up to 100%.`,
            confirmButtonColor: BRAND,
          });
      } else {
        if (rub.items.length === 0)
          return Swal.fire({
            icon: "warning",
            title: "Empty rubric",
            text: `Rubric of "${label}" needs at least one criterion.`,
            confirmButtonColor: BRAND,
          });
        if (rub.items.some((it) => !it.name.trim()))
          return Swal.fire({
            icon: "warning",
            title: "Missing name",
            text: `Every criterion of "${label}" needs a name.`,
            confirmButtonColor: BRAND,
          });
        if (sumWeight(rub.items) !== 100)
          return Swal.fire({
            icon: "error",
            title: "Total weight is not 100%",
            text: `Rubric of "${label}" must add up to 100%.`,
            confirmButtonColor: BRAND,
          });
      }
    }
    advanceTab(5);
  };

  const handleValidateAssignments = () => {
    advanceTab(6);
  };

  const syncSetOrchestrator = async (
    rubricList: CriterionRow[],
    setName: string,
  ) => {
    const criteriaMap = await Promise.all(
      rubricList.map(async (r) => {
        let cId: string | null = null;
        try {
          const res = await criteriaApi.createCriterion({
            criteriaName: r.name.trim(),
            description: r.description.trim() || DEFAULT_CRITERIA_DESCRIPTION,
          } as any);
          cId = extractId(res);
        } catch (e) {}
        if (!cId) {
          const allC = getList(await criteriaApi.getAllCriteria());
          const found = [...allC]
            .reverse()
            .find(
              (c: any) =>
                (c.criteriaName || c.name || "").trim().toLowerCase() ===
                r.name.trim().toLowerCase(),
            );
          cId = extractId(found);
        }
        return { criteriaId: cId, score: Number(r.weight) };
      }),
    );

    const resolved = criteriaMap.filter((c) => !!c.criteriaId) as {
      criteriaId: string;
      score: number;
    }[];
    if (resolved.length !== criteriaMap.length)
      throw new Error(`Some criteria of "${setName}" could not be created.`);

    const res = await criteriaApi.createSet({
      setName,
      isDefault: true,
      criteriaList: resolved,
      CriteriaList: resolved,
    } as any);
    let setId = extractId(res);

    if (!setId) {
      const allS = getList(await criteriaApi.getAllSet());
      const foundSet = [...allS]
        .reverse()
        .find(
          (s: any) =>
            (s.setName || s.name || "").trim().toLowerCase() ===
            setName.trim().toLowerCase(),
        );
      setId = grabSetId(foundSet);
    }
    return setId;
  };

  /**
   * Lấy eventId của sự kiện VỪA tạo xong.
   *
   * ⚠️ POST /api/Event không trả ID theo một dạng cố định: có khi là object
   * chứa eventId, có khi bọc thêm một lớp { data: ... }, có khi chỉ là một câu
   * thông báo kiểu "Event created successfully". Vì vậy:
   *   1. Dò ID trong body — nhưng CHỈ chấp nhận giá trị đúng dạng GUID.
   *   2. Nếu không ra, dò lại trong danh sách event theo tên + mùa + năm.
   *
   * ⚠️ Bước kiểm tra GUID ở (1) là bắt buộc: nếu chỉ kiểm tra "khác rỗng" thì
   * câu thông báo của backend sẽ được dùng làm eventId, và bước tạo Track kế
   * tiếp chết với lỗi 400 "Event does not exist or is inactive."
   *
   * ⚠️ Bước (2) phải dùng getAllEventsRaw() chứ KHÔNG dùng getAllEvents():
   * event vừa tạo có thể chưa isActive nên sẽ bị getAllEvents() lọc mất.
   */
  const resolveNewEventId = async (res: any): Promise<string> => {
    let raw = res?.data !== undefined ? res.data : res;

    // Backend đôi khi nhả JSON dưới dạng chuỗi (stringified JSON)
    if (typeof raw === "string" && raw.trim().startsWith("{")) {
      try {
        raw = JSON.parse(raw);
      } catch (e) {}
    }

    const candidates: unknown[] =
      typeof raw === "object" && raw !== null
        ? [
            raw.eventId,
            raw.eventID,
            raw.id,
            raw.data,
            raw.result,
            raw.payload,
            extractId(raw),
          ]
        : [raw];

    for (const c of candidates) {
      const v = typeof c === "string" ? c.replace(/['"]/g, "").trim() : c;
      if (looksLikeGuid(v)) return v;
      // Vài endpoint bọc ID trong object con: { data: { eventId: ... } }
      if (v && typeof v === "object") {
        const nested = extractId(v);
        if (looksLikeGuid(nested)) return nested;
      }
    }

    // Body không chứa ID hợp lệ -> dò lại theo tên trong danh sách thô
    try {
      const wantedName = eventForm.eventName.trim().toLowerCase();
      const matches = getList(await eventApi.getAllEventsRaw()).filter(
        (e: any) =>
          String(e.eventName ?? e.EventName ?? "")
            .trim()
            .toLowerCase() === wantedName,
      );
      const exact = matches.filter(
        (e: any) =>
          String(e.season ?? e.Season ?? "") === eventForm.season &&
          Number(e.year ?? e.Year) === Number(eventForm.year),
      );
      const found = (exact.length ? exact : matches).pop();
      const foundId = found?.eventId ?? found?.eventID ?? found?.id;
      if (looksLikeGuid(foundId)) return foundId;
    } catch (e) {
      console.warn("Không dò lại được event vừa tạo:", e);
    }

    return "";
  };

  /**
   * Lấy trackId của track VỪA tạo — cùng vấn đề như resolveNewEventId().
   *
   * ⚠️ POST /api/Track có khi trả về 2xx (track ĐÃ nằm trong DB) nhưng body lại
   * không kèm ID. Khi đó pickTrackId() trả null, vòng lặp ném lỗi và DỪNG NGAY
   * ở track đầu tiên — nên các track phía sau không bao giờ được tạo. Đó là lý
   * do tạo 2 track mà chỉ thấy 1 track nằm trong database.
   *
   * Vì vậy nếu body không có ID hợp lệ thì dò lại theo tên trong danh sách
   * track của chính event này trước khi chịu thua.
   */
  const resolveNewTrackId = async (
    res: any,
    eventId: string,
    trackName: string,
  ): Promise<string> => {
    const direct = pickTrackId(res);
    if (looksLikeGuid(direct)) return direct;

    try {
      const wanted = trackName.trim().toLowerCase();
      const matches = getList(await trackTopicApi.getAllTracks()).filter(
        (t: any) =>
          String(t.trackName ?? t.TrackName ?? "")
            .trim()
            .toLowerCase() === wanted &&
          String(t.eventId ?? t.eventID ?? "") === String(eventId),
      );
      const foundId = pickTrackId(matches.pop());
      if (looksLikeGuid(foundId)) return foundId;
    } catch (e) {
      console.warn("Không dò lại được track vừa tạo:", e);
    }

    return "";
  };

  // ==========================================
  // BƯỚC 6: NHẠC TRƯỞNG (GỌI API LIÊN HOÀN VỚI LIVE LOGGING)
  // ==========================================
  const handleLaunchEvent = async () => {
    setIsLaunching(true);
    let errorStep = "Event Creation";
    try {
      Swal.fire({
        title: "Deploying System...",
        html: "<div style='text-align: left; padding: 10px; font-weight: bold;'><span style='color: #f26f21'>Step 1/5:</span> Generating Event Profile & Prizes...</div>",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });

      const eventPayload = {
        eventName: eventForm.eventName.trim(),
        season: eventForm.season,
        year: Number(eventForm.year),
        registrationStartDate: new Date(
          eventForm.registrationStartDate,
        ).toISOString(),
        registrationEndDate: new Date(
          eventForm.registrationEndDate,
        ).toISOString(),
        minTeamMember: Number(eventForm.minTeamMember),
        maxTeamMember: Number(eventForm.maxTeamMember),
        prizes: eventPrizes
          .filter((p) => p.prizeName.trim())
          .map((p, idx) => ({
            prizeName: p.prizeName.trim(),
            description: p.description.trim(),
            rankIndex: Number(p.rankIndex) || idx + 1,
          })),
      };

      // 1. TẠO SỰ KIỆN
      const evRes: any = await eventApi.createEvent(eventPayload as any);

      const eventId = await resolveNewEventId(evRes);

      // Không có ID hợp lệ thì DỪNG NGAY — nếu đi tiếp, mọi bước sau đều chết
      // với lỗi 400 "Event does not exist or is inactive."
      if (!eventId) {
        console.error("POST /api/Event trả về:", evRes);
        return Swal.fire({
          icon: "error",
          title: "Không lấy được Event ID",
          html: `Sự kiện có thể đã được tạo, nhưng backend không trả về ID hợp lệ (dạng GUID) và cũng không dò lại được theo tên.<br/><br/><b>Body mà backend trả về:</b><br/><code style="color:red; background:#fee2e2; padding: 10px; display:block; text-align:left; border-radius:8px; word-break:break-all;">${JSON.stringify(evRes)}</code><br/>Gửi ảnh này cho bên Backend để họ trả về eventId trong response của POST /api/Event.`,
          confirmButtonColor: BRAND,
        });
      }

      errorStep = "Tracks Configuration";
      Swal.update({
        html: "<div style='text-align: left; padding: 10px; font-weight: bold;'><span style='color: #10b981'>Step 1/5: ✔️ Done.</span><br/><br/><span style='color: #f26f21'>Step 2/5:</span> Assembling Tracks and Topics...</div>",
      });

      const trackIdMap: Record<number, string> = {};

      for (const t of tracks) {
        if (!t.name.trim()) continue;

        const trRes: any = await trackTopicApi.createTrack({
          eventId: eventId, // ID gọt sạch sẽ truyền vào đây
          trackName: t.name.trim(),
          maxTeam: Number(t.maxTeam),
        } as any);

        const serverTrackId = await resolveNewTrackId(
          trRes,
          eventId,
          t.name.trim(),
        );
        if (!serverTrackId) {
          console.error(`POST /api/Track ("${t.name}") trả về:`, trRes);
          throw new Error(
            `Could not create track: ${t.name}. Backend không trả về trackId và cũng không dò lại được theo tên (xem Console để biết backend trả về gì).`,
          );
        }

        trackIdMap[t.id] = serverTrackId;

        for (const topic of t.topics) {
          if (topic.trim())
            await trackTopicApi.createTopic({
              trackID: serverTrackId,
              topicDetail: topic.trim(),
            } as any);
        }
      }

      errorStep = "Rounds & Rubrics Configuration";
      Swal.update({
        html: "<div style='text-align: left; padding: 10px; font-weight: bold;'><span style='color: #10b981'>Step 2/5: ✔️ Done.</span><br/><br/><span style='color: #f26f21'>Step 3/5:</span> Building Rounds and Grading Rubrics...</div>",
      });

      // Nhiều vòng có thể cùng mượn một bộ tiêu chí và sửa giống hệt nhau — chỉ
      // đẩy lên server một lần, các vòng sau dùng lại setId đã nhận được.
      const syncedSets = new Map<string, string>();

      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        const rub = rubrics[r.id];
        let setId: string | null = null;

        if (rub.mode === "reuse") {
          setId = rub.reuseSetId;
          // Lưới an toàn: admin sửa bộ tiêu chí mượn lại nhưng quên bấm "Save
          // changes" thì lưu hộ ngay trước khi tạo vòng.
          const picked = availableSets.find(
            (s) => String(s.setId) === String(setId),
          );
          if (isReuseDirty(rub, picked)) {
            // ⚠️ Backend trả về bộ MỚI khi sửa, nên vòng phải trỏ vào ID trả về
            // chứ không phải ID gốc đã chọn trong dropdown.
            setId =
              syncedSets.get(String(setId)) ??
              (await pushReuseSet(
                rub,
                availableSets.map((s) => String(s.setId)),
              ));
            syncedSets.set(String(rub.reuseSetId), setId);
          }
        } else
          setId = await syncSetOrchestrator(
            rub.items,
            rub.setName.trim() || defaultSetNameFor(r, i),
          );

        // ⚠️ Phải kiểm tra ĐÚNG DẠNG GUID, không chỉ "khác rỗng": nếu setId là
        // rác thì backend nhận vào rồi mới chết ở tầng khoá ngoại và chỉ trả về
        // câu chung chung "Error while creating round" — rất khó lần ra.
        if (!looksLikeGuid(setId)) {
          console.error(`Rubric set ID không hợp lệ cho "${r.roundName}":`, setId);
          throw new Error(
            `Could not configure rubric for "${r.roundName}": không lấy được ID hợp lệ của bộ tiêu chí (nhận được: ${JSON.stringify(setId)}).`,
          );
        }

        const toIso = (dateStr: string) => new Date(dateStr).toISOString();
        const roundPayload = {
          eventID: eventId,
          roundName: r.roundName.trim(),
          startDate: toIso(r.startDate),
          endDate: toIso(r.endDate),
          topNPromotion: Number(r.topNPromotion),
          maxTeam: Number(r.maxTeam),
          // ⚠️ roundIndex đánh số TỪ 1, không phải từ 0. Phần còn lại của app
          // quy ước như vậy: EventDetailsPage quy đổi currentRound sang vị trí
          // trong mảng bằng (currentRound - 1). Nếu vòng đầu mang index 0 thì
          // việc dò "vòng hiện tại" sẽ lệch một nhịp.
          roundIndex: i + 1,
          criteriaSetID: setId,
          // ⚠️ 3 field dưới đây là BẮT BUỘC trong CreateRoundAPIViewModel.
          // Thiếu bất kỳ cái nào, backend trả 400 "Error while creating round"
          // mà không chỉ ra field nào sai — đừng bỏ đi.
          minTeam: Number(r.minTeam),
          scoringStartDate: toIso(r.scoringStartDate),
          scoringEndDate: toIso(r.scoringEndDate),
        };

        try {
          await roundApi.createRound(roundPayload as any);
        } catch (e: any) {
          // Backend chỉ trả câu chung chung "Error while creating round", nên in
          // nguyên payload ra Console để còn dán lại vào Swagger mà khoanh vùng.
          console.error("POST /api/Round THẤT BẠI. Payload đã gửi:", roundPayload);
          console.error("Body lỗi backend trả về:", e?.response?.data);
          throw e;
        }
      }

      errorStep = "Personnel Assignment";
      Swal.update({
        html: "<div style='text-align: left; padding: 10px; font-weight: bold;'><span style='color: #10b981'>Step 3/5: ✔️ Done.</span><br/><br/><span style='color: #f26f21'>Step 4/5:</span> Assigning Judges and Mentors...</div>",
      });

      for (const pa of pendingAssignments) {
        const realTrackId = trackIdMap[pa.trackLocalId];
        if (!realTrackId) continue;
        const endpoint = pa.isMentor
          ? `/api/Mentor/track/${realTrackId}/teacher/${pa.teacherId}`
          : `/api/Judge/track/${realTrackId}/teacher/${pa.teacherId}`;
        try {
          await apiClient.post(endpoint);
        } catch (e) {
          console.warn("Assign failed for", pa.teacherName);
        }
      }

      Swal.update({
        html: "<div style='text-align: left; padding: 10px; font-weight: bold;'><span style='color: #10b981'>Step 4/5: ✔️ Done.</span><br/><br/><span style='color: #10b981'>Step 5/5: All configurations saved!</span></div>",
      });

      setTimeout(() => {
        Swal.fire({
          icon: "success",
          title: "Draft Created!",
          text: "Your event is successfully configured and saved in Draft mode.",
          confirmButtonColor: BRAND,
        }).then(() => navigate("/admin/events"));
      }, 500);
    } catch (error: any) {
      // Chi tiết kỹ thuật (endpoint + payload + body) chỉ ra Console cho dev;
      // người dùng chỉ cần biết dừng ở bước nào và làm gì tiếp.
      console.error(
        `Deployment failed at ${errorStep}:`,
        technicalDetails(error),
        error,
      );
      // Sự kiện được dựng theo nhiều bước nối tiếp — hỏng giữa chừng thì phần
      // đã tạo VẪN nằm trên server, phải nói rõ để admin không tạo trùng.
      const partial = errorStep !== "Event Creation";
      showApiError(error, {
        action: `finish setting up the event (stopped at: ${STEP_LABEL[errorStep] || errorStep})`,
        hint: partial
          ? "Everything before this step was already saved. Open the event from the Events list and finish the remaining setup there instead of creating it again."
          : "Nothing was saved, so you can safely correct the details and try again.",
      });
    } finally {
      setIsLaunching(false);
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  const tabs = [
    { id: 1, name: "1. Event & Reg" },
    { id: 2, name: "2. Tracks & Topics" },
    { id: 3, name: "3. Rounds" },
    { id: 4, name: "4. Grading Rubrics" },
    { id: 5, name: "5. Personnel" },
    { id: 6, name: "6. Prizes" },
  ];

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-[#f26f21] tracking-tight">
            Create Event
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Set up a new hackathon step by step.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/events")}
          className="px-5 py-2.5 bg-white border border-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
        >
          Cancel & Back
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6 min-h-[500px] flex flex-col">
        <div className="flex border-b border-slate-100 px-2 bg-slate-50/50 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.id > furthestTab}
              className={`flex-1 min-w-[150px] px-3 py-4 text-[13px] font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${activeTab === tab.id ? "border-fpt-orange text-fpt-orange bg-white" : tab.id <= furthestTab ? "border-transparent text-emerald-600 hover:text-emerald-700 hover:bg-white" : "border-transparent text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"}`}
            >
              {tab.id < furthestTab && activeTab !== tab.id && (
                <CheckCircle2 size={16} />
              )}
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1">
          {/* STEP 1: EVENT INFO & REGISTRATION TIMELINE */}
          {activeTab === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                  BASIC INFORMATION & TIMELINE
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      Event display name
                    </label>
                    <input
                      type="text"
                      value={eventForm.eventName}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          eventName: e.target.value,
                        })
                      }
                      placeholder="e.g. SEAL Hackathon Fall 2026..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-fpt-orange shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Season
                      </label>
                      <select
                        value={eventForm.season}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, season: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-fpt-orange shadow-sm cursor-pointer"
                      >
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                        <option value="Fall">Fall</option>
                        <option value="Winter">Winter</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Year
                      </label>
                      <input
                        type="number"
                        value={eventForm.year}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            year: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-fpt-orange shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 mt-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-emerald-600 uppercase">
                        Reg Opens At
                      </label>
                      <input
                        type="datetime-local"
                        min={nowLocalInput()}
                        value={eventForm.registrationStartDate}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            registrationStartDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-red-500 uppercase">
                        Reg Closes At
                      </label>
                      <input
                        type="datetime-local"
                        min={nowLocalInput()}
                        value={eventForm.registrationEndDate}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            registrationEndDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-red-500 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 mt-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Min Team Member
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={eventForm.minTeamMember}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            minTeamMember: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-fpt-orange shadow-sm text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Max Team Member
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={eventForm.maxTeamMember}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            maxTeamMember: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-fpt-orange shadow-sm text-center"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end border-t border-slate-200 pt-6 mt-6">
                  <button
                    onClick={handleValidateEvent}
                    className="px-6 py-3 bg-fpt-orange text-white text-sm font-bold rounded-xl shadow-md hover:bg-fpt-orange-dark flex items-center gap-2 transition-colors"
                  >
                    Next: Tracks & Topics <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {activeTab === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">
                  Tracks & Topics
                </h3>
                <button
                  onClick={() =>
                    setTracks([
                      ...tracks,
                      { id: nextId(), name: "", topics: [], maxTeam: 20 },
                    ])
                  }
                  className="px-4 py-2 bg-fpt-orange-soft text-fpt-orange text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-orange-100 transition-colors"
                >
                  <Plus size={14} /> Add track
                </button>
              </div>
              <div className="space-y-4">
                {tracks.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-xl relative group"
                  >
                    {tracks.length > 1 && (
                      <button
                        onClick={() =>
                          setTracks(tracks.filter((tr) => tr.id !== t.id))
                        }
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}

                    <div className="flex gap-4 mb-4">
                      <div className="w-2/3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Track {idx + 1} name
                        </label>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) =>
                            setTracks(
                              tracks.map((tr) =>
                                tr.id === t.id
                                  ? { ...tr, name: e.target.value }
                                  : tr,
                              ),
                            )
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-fpt-orange shadow-sm"
                          placeholder="e.g. Web App, Data Science..."
                        />
                      </div>
                      <div className="w-1/3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Max Teams
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={t.maxTeam}
                          onChange={(e) =>
                            setTracks(
                              tracks.map((tr) =>
                                tr.id === t.id
                                  ? { ...tr, maxTeam: Number(e.target.value) }
                                  : tr,
                              ),
                            )
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-fpt-orange shadow-sm"
                          placeholder="e.g. 20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
                        Topics
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {t.topics.map((topic: string, i: number) => (
                          <span
                            key={i}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-sm"
                          >
                            {topic}{" "}
                            <button
                              onClick={() =>
                                setTracks(
                                  tracks.map((tr) =>
                                    tr.id === t.id
                                      ? {
                                          ...tr,
                                          topics: tr.topics.filter(
                                            (_: any, index: any) => index !== i,
                                          ),
                                        }
                                      : tr,
                                  ),
                                )
                              }
                              className="hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={topicInputs[t.id] || ""}
                          onChange={(e) =>
                            setTopicInputs({
                              ...topicInputs,
                              [t.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              topicInputs[t.id]?.trim()
                            ) {
                              setTracks(
                                tracks.map((tr) =>
                                  tr.id === t.id
                                    ? {
                                        ...tr,
                                        topics: [
                                          ...tr.topics,
                                          topicInputs[t.id].trim(),
                                        ],
                                      }
                                    : tr,
                                ),
                              );
                              setTopicInputs({ ...topicInputs, [t.id]: "" });
                            }
                          }}
                          placeholder="Type a topic and press Enter..."
                          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-fpt-orange shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => advanceTab(1)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleValidateTracks}
                  className="px-6 py-3 bg-fpt-orange text-white text-sm font-bold rounded-xl shadow-md hover:bg-fpt-orange-dark flex items-center gap-2 transition-colors"
                >
                  Next: Rounds <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {activeTab === 3 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CalendarClock size={20} className="text-fpt-orange" />
                    Competition rounds
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Add as many rounds as this hackathon needs.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setRounds((prev) => [
                      ...prev,
                      makeRound(prev[prev.length - 1]),
                    ])
                  }
                  className="px-4 py-2 bg-fpt-orange-soft text-fpt-orange text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-orange-100 shrink-0"
                >
                  <Plus size={14} /> Add round
                </button>
              </div>
              <div className="space-y-4">
                {rounds.map((r, idx) => (
                  <RoundCard
                    key={r.id}
                    index={idx}
                    total={rounds.length}
                    round={r}
                    prevEnd={
                      idx > 0
                        ? rounds[idx - 1].scoringEndDate ||
                          rounds[idx - 1].endDate
                        : ""
                    }
                    onChange={(patch: any) => patchRound(r.id, patch)}
                    onRemove={() =>
                      setRounds((prev) => prev.filter((x) => x.id !== r.id))
                    }
                  />
                ))}
              </div>
              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => advanceTab(2)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleValidateRounds}
                  className="px-6 py-3 bg-fpt-orange text-white text-sm font-bold rounded-xl shadow-md hover:bg-fpt-orange-dark flex items-center gap-2 transition-colors"
                >
                  Next: Rubrics <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {activeTab === 4 && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">
                  Grading rubrics
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  One rubric per round. Every rubric must total exactly 100%.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rounds.map((r, idx) => (
                  <RubricCard
                    key={r.id}
                    index={idx}
                    roundName={r.roundName}
                    rubric={rubrics[r.id] || makeRubric()}
                    defaultSetName={defaultSetNameFor(r, idx)}
                    availableSets={availableSets}
                    allCriteria={allCriteria}
                    loadingSets={loadingSets}
                    loadSetsError={loadSetsError}
                    onRetryLoad={loadAvailableSets}
                    onChange={(patch: any) => patchRubric(r.id, patch)}
                    onSaveReuse={() => handleSaveReuseSet(r.id)}
                    savingReuse={
                      savingSetId != null &&
                      String(savingSetId) ===
                        String(rubrics[r.id]?.reuseSetId || "")
                    }
                  />
                ))}
              </div>
              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => advanceTab(3)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleValidateRubrics}
                  className="px-8 py-3 bg-fpt-orange text-white text-sm font-bold rounded-xl shadow-md hover:bg-fpt-orange-dark flex items-center gap-2 transition-colors"
                >
                  Next: Personnel <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {activeTab === 5 && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Mentors & Judges
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Assign personnel to the tracks of this event.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                      Select Track
                    </label>
                    <select
                      value={assignForm.trackLocalId}
                      onChange={(e) =>
                        setAssignForm({
                          ...assignForm,
                          trackLocalId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none font-bold text-fpt-orange"
                    >
                      <option value="">-- Choose Track --</option>
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                      Select Personnel
                    </label>
                    <select
                      value={assignForm.teacherId}
                      onChange={(e) =>
                        setAssignForm({
                          ...assignForm,
                          teacherId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-700"
                    >
                      <option value="">-- Choose Teacher --</option>
                      {rawTeachers.map((t) => (
                        <option
                          key={t.teacherId || t.id}
                          value={t.teacherId || t.id}
                        >
                          {t.fullName || t.teacherName || t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 h-[38px]">
                    <button
                      onClick={() =>
                        setAssignForm({ ...assignForm, isMentor: true })
                      }
                      className={`flex-1 text-xs font-bold rounded-lg border transition-all ${assignForm.isMentor ? "bg-fpt-orange text-white border-fpt-orange shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"}`}
                    >
                      Mentor
                    </button>
                    <button
                      onClick={() =>
                        setAssignForm({ ...assignForm, isMentor: false })
                      }
                      className={`flex-1 text-xs font-bold rounded-lg border transition-all ${!assignForm.isMentor ? "bg-fpt-orange text-white border-fpt-orange shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"}`}
                    >
                      Judge
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!assignForm.trackLocalId || !assignForm.teacherId) {
                      return Swal.fire(
                        "Missing",
                        "Please select both a track and a personnel.",
                        "warning",
                      );
                    }

                    const selectedTeacher = rawTeachers.find(
                      (t) =>
                        String(t.teacherId || t.id) ===
                        String(assignForm.teacherId),
                    );
                    const tName =
                      selectedTeacher?.teacherName ||
                      selectedTeacher?.fullName ||
                      selectedTeacher?.name ||
                      "Unknown Teacher";
                    const trName = tracks.find(
                      (t) => String(t.id) === String(assignForm.trackLocalId),
                    )?.name;

                    const assignmentInSameTrack = pendingAssignments.find(
                      (pa) =>
                        String(pa.teacherId) === String(assignForm.teacherId) &&
                        String(pa.trackLocalId) ===
                          String(assignForm.trackLocalId),
                    );

                    if (assignmentInSameTrack) {
                      if (
                        assignmentInSameTrack.isMentor !== assignForm.isMentor
                      ) {
                        return Swal.fire({
                          icon: "error",
                          title: "Role Conflict",
                          text: `${tName} is already assigned as a ${assignmentInSameTrack.isMentor ? "Mentor" : "Judge"} for "${trName}". A personnel cannot hold both roles in the same track.`,
                          confirmButtonColor: "#f26f21",
                        });
                      } else {
                        return Swal.fire({
                          icon: "warning",
                          title: "Duplicate",
                          text: `${tName} is already assigned to "${trName}".`,
                          confirmButtonColor: "#f26f21",
                        });
                      }
                    }

                    setPendingAssignments([
                      ...pendingAssignments,
                      {
                        ...assignForm,
                        teacherName: tName,
                        trackName: trName,
                        id: nextId(),
                      },
                    ]);
                    setAssignForm({ ...assignForm, teacherId: "" });
                  }}
                  className="w-full py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add to assignment list
                </button>
              </div>

              {pendingAssignments.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">Track</th>
                        <th className="px-5 py-3">Personnel</th>
                        <th className="px-5 py-3 text-center">Role</th>
                        <th className="px-5 py-3 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingAssignments.map((pa) => (
                        <tr key={pa.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">{pa.trackName}</td>
                          <td className="px-5 py-3 font-semibold text-fpt-orange">
                            {pa.teacherName}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${pa.isMentor ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                            >
                              {pa.isMentor ? "Mentor" : "Judge"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() =>
                                setPendingAssignments(
                                  pendingAssignments.filter(
                                    (x) => x.id !== pa.id,
                                  ),
                                )
                              }
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  No personnel assigned yet. You can skip this step or add
                  assignments above.
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => advanceTab(4)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleValidateAssignments}
                  className="px-6 py-3 bg-fpt-orange text-white text-sm font-bold rounded-xl shadow-md hover:bg-fpt-orange-dark flex items-center gap-2"
                >
                  Next: Prizes & Launch <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: DYNAMIC PRIZES */}
          {activeTab === 6 && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Prizes & Awards
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Configure default prizes. These will be granted
                    automatically to the top teams at the end of the event.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEventPrizes([
                      ...eventPrizes,
                      {
                        id: nextId(),
                        prizeName: "",
                        description: "",
                        rankIndex: eventPrizes.length + 1,
                      },
                    ])
                  }
                  className="px-4 py-2 bg-fpt-orange-soft text-fpt-orange text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-orange-100 transition-colors"
                >
                  <Plus size={14} /> Add Prize
                </button>
              </div>

              <div className="space-y-4">
                {eventPrizes.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 bg-white border border-slate-200 rounded-xl relative flex flex-col md:flex-row gap-4 shadow-sm group items-end"
                  >
                    <button
                      onClick={() =>
                        setEventPrizes(eventPrizes.filter((x) => x.id !== p.id))
                      }
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="w-full md:w-24">
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                        Rank
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={p.rankIndex}
                        onChange={(e) =>
                          setEventPrizes(
                            eventPrizes.map((x) =>
                              x.id === p.id
                                ? { ...x, rankIndex: Number(e.target.value) }
                                : x,
                            ),
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-fpt-orange"
                        placeholder="1"
                      />
                    </div>

                    <div className="w-full md:w-1/3">
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                        Prize Name
                      </label>
                      <input
                        type="text"
                        value={p.prizeName}
                        onChange={(e) =>
                          setEventPrizes(
                            eventPrizes.map((x) =>
                              x.id === p.id
                                ? { ...x, prizeName: e.target.value }
                                : x,
                            ),
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-fpt-orange"
                        placeholder="e.g. First Prize"
                      />
                    </div>

                    <div className="flex-1 pr-8">
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                        Description / Reward
                      </label>
                      <input
                        type="text"
                        value={p.description}
                        onChange={(e) =>
                          setEventPrizes(
                            eventPrizes.map((x) =>
                              x.id === p.id
                                ? { ...x, description: e.target.value }
                                : x,
                            ),
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-fpt-orange"
                        placeholder="e.g. 5,000,000 VND + Trophy"
                      />
                    </div>
                  </div>
                ))}
                {eventPrizes.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    No prizes configured. You can skip this step, but it's
                    recommended to add them now.
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => advanceTab(5)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleLaunchEvent}
                  disabled={isLaunching}
                  className="px-8 py-3 bg-slate-800 text-white text-sm font-black rounded-xl shadow-md hover:bg-slate-900 flex items-center gap-2 disabled:opacity-60 transition-colors"
                >
                  {isLaunching ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {isLaunching ? "Saving Draft..." : "Save to Drafts"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
