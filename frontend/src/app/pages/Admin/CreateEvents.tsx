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
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// IMPORT API INSTANCES
import { criteriaApi } from "../../lib/api/criteriaApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { eventApi } from "../../lib/api/eventApi";
import { roundApi } from "../../lib/api/roundApi";
import { prizeApi } from "../../lib/api/prizeApi";
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
  getServerMsg,
  DEFAULT_CRITERIA_DESCRIPTION,
} from "../../lib/utils/criteriaHelpers";

const BRAND = "#f26f21";
let seq = 1000;
const nextId = () => ++seq;

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
  maxTeam: number;
  topNPromotion: number;
}

interface RubricConfig {
  mode: "new" | "reuse";
  setName: string;
  items: CriterionRow[];
  reuseSetId: string;
}

const makeRound = (prev?: RoundConfig): RoundConfig => ({
  id: nextId(),
  roundName: "",
  startDate: prev?.endDate || "",
  endDate: "",
  maxTeam: prev ? Number(prev.topNPromotion) || 10 : 40,
  topNPromotion: prev ? 1 : 10,
});

const makeRubric = (): RubricConfig => ({
  mode: "new",
  setName: "",
  items: [{ id: nextId(), name: "", description: "", weight: 100 }],
  reuseSetId: "",
});

// ==========================================================
// COMPONENT CARD ROUND & RUBRIC
// ==========================================================
function RoundCard({ index, total, round, prevEnd, onChange, onRemove }: any) {
  const dStart = round.startDate ? new Date(round.startDate) : null;
  const dEnd = round.endDate ? new Date(round.endDate) : null;
  const dPrevEnd = prevEnd ? new Date(prevEnd) : null;

  const endBeforeStart = !!(dStart && dEnd && dEnd <= dStart);
  const overlapsPrev = !!(dStart && dPrevEnd && dStart < dPrevEnd);
  const topTooHigh = Number(round.topNPromotion) > Number(round.maxTeam);

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
            value={round.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-fpt-orange"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Closes at (scoring deadline)
          </label>
          <input
            type="datetime-local"
            value={round.endDate}
            onChange={(e) => onChange({ endDate: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-fpt-orange"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
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

      {(endBeforeStart || overlapsPrev || topTooHigh) && (
        <div className="mt-4 space-y-1">
          {endBeforeStart && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> The closing time must be after the
              opening time.
            </p>
          )}
          {overlapsPrev && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> This round cannot start before previous
              has closed.
            </p>
          )}
          {topTooHigh && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> Teams advancing cannot exceed max teams.
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
  loadingSets,
  loadSetsError,
  onRetryLoad,
  onChange,
}: any) {
  const picked = availableSets.find(
    (s: any) => String(s.setId) === String(rubric.reuseSetId),
  );
  const items = rubric.mode === "new" ? rubric.items : picked?.items || [];
  const total = sumWeight(items);
  const isFull = total === 100;
  const hasEmptyName =
    rubric.mode === "new" && rubric.items.some((i: any) => !i.name.trim());

  const updateItem = (id: number, patch: Partial<CriterionRow>) =>
    onChange({
      items: rubric.items.map((i: any) =>
        i.id === id ? { ...i, ...patch } : i,
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
                onChange={(e) => onChange({ reuseSetId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold focus:border-fpt-orange"
              >
                <option value="">-- Select a rubric set --</option>
                {availableSets.map((s: any) => (
                  <option key={s.setId} value={s.setId}>
                    {s.setName}
                  </option>
                ))}
              </select>
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
    </div>
  );
}

// ==========================================================
// MAIN COMPONENT (ORCHESTRATOR PATTERN)
// ==========================================================
export function CreateEvents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);
  const [furthestTab, setFurthestTab] = useState(1); // Cho phép user quay lại các tab đã hoàn thành

  // 1. STATE BƯỚC 1
  const [eventForm, setEventForm] = useState({
    eventName: "",
    season: "Fall",
    year: new Date().getFullYear(),
  });

  // 2. STATE BƯỚC 2
  const [tracks, setTracks] = useState<any[]>([
    { id: nextId(), name: "", topics: [] },
  ]);
  const [topicInputs, setTopicInputs] = useState<{ [key: number]: string }>({});

  // 3. STATE BƯỚC 3
  const [rounds, setRounds] = useState<RoundConfig[]>([makeRound()]);

  // 4. STATE BƯỚC 4
  const [rubrics, setRubrics] = useState<Record<number, RubricConfig>>({
    [rounds[0].id]: makeRubric(),
  });
  const [availableSets, setAvailableSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadSetsError, setLoadSetsError] = useState<string | null>(null);
  const [setsLoaded, setSetsLoaded] = useState(false);

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
      name: "First Prize",
      description: "Gold Medal + 5,000,000 VND",
    },
    {
      id: nextId(),
      name: "Second Prize",
      description: "Silver Medal + 3,000,000 VND",
    },
    {
      id: nextId(),
      name: "Third Prize",
      description: "Bronze Medal + 1,000,000 VND",
    },
    {
      id: nextId(),
      name: "Consolation Prize",
      description: "Certificate + 500,000 VND",
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
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  const patchRubric = (roundId: number, patch: Partial<RubricConfig>) =>
    setRubrics((prev) => ({
      ...prev,
      [roundId]: { ...(prev[roundId] || makeRubric()), ...patch },
    }));
  const defaultSetNameFor = (r: RoundConfig, idx: number) =>
    `${eventForm.eventName || "Event"} - ${r.roundName || `Round ${idx + 1}`} Rubric`;

  const loadAvailableSets = async () => {
    try {
      setLoadingSets(true);
      setLoadSetsError(null);
      const [setsRaw, critRaw] = await Promise.all([
        criteriaApi.getAllSet(),
        criteriaApi.getAllCriteria(),
      ]);
      const critMap = buildCriteriaMap(critRaw);
      const baseSets = getList(setsRaw)
        .map((s: any) => ({
          setId: grabSetId(s),
          setName: s.setName || "Rubric set",
        }))
        .filter((s): s is { setId: string; setName: string } => !!s.setId);
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
      const dStart = new Date(r.startDate),
        dEnd = new Date(r.endDate);
      if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime()))
        return Swal.fire({
          icon: "warning",
          title: "Invalid date",
          text: `The schedule of "${label}" is invalid.`,
          confirmButtonColor: BRAND,
        });
      if (dEnd <= dStart)
        return Swal.fire({
          icon: "warning",
          title: "Wrong schedule",
          text: `"${label}" must close after it opens.`,
          confirmButtonColor: BRAND,
        });
      if (i > 0 && dStart < new Date(rounds[i - 1].endDate))
        return Swal.fire({
          icon: "warning",
          title: "Overlapping rounds",
          text: `"${label}" cannot start before the previous round has closed.`,
          confirmButtonColor: BRAND,
        });
      if (Number(r.maxTeam) < 1 || Number(r.topNPromotion) < 1)
        return Swal.fire({
          icon: "warning",
          title: "Invalid team numbers",
          text: `Max teams and teams advancing must be at least 1.`,
          confirmButtonColor: BRAND,
        });
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
        if (sumWeight(picked.items || []) !== 100)
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
    advanceTab(6); // Step 5 không bắt buộc nhập
  };

  // Helper tạo Criteria trong lúc Launch
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

  // ==========================================
  // BƯỚC 6: NHẠC TRƯỞNG (GỌI API LIÊN HOÀN)
  // ==========================================
  const handleLaunchEvent = async () => {
    setIsLaunching(true);
    let errorStep = "Event Creation";
    try {
      Swal.fire({
        title: "Deploying Event...",
        html: "Configuring Event details...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });

      // 1. TẠO EVENT
      const eventPayload = {
        eventName: eventForm.eventName.trim(),
        season: eventForm.season,
        year: Number(eventForm.year),
      };
      const evRes: any = await eventApi.createEvent(eventPayload as any);
      let eventId = extractId(evRes);

      // Nếu API lỗi không trả về ID do trùng tên, Backend quăng Error, nhảy xuống Catch báo lỗi liền, DB không dính rác!
      if (!eventId)
        throw new Error(
          "Could not create Event. Ensure the Event name is unique.",
        );

      // 2. TẠO TRACKS & TOPICS
      errorStep = "Tracks Configuration";
      Swal.fire({
        title: "Deploying Event...",
        html: "Configuring Tracks and Topics...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });

      // Map lưu trữ ánh xạ: Local_Track_ID -> Server_Track_ID (Dùng để gán Giám khảo ở bước sau)
      const trackIdMap: Record<number, string> = {};

      for (const t of tracks) {
        if (!t.name.trim()) continue;
        const trRes: any = await trackTopicApi.createTrack({
          eventId,
          trackName: t.name.trim(),
        } as any);
        const serverTrackId = pickTrackId(trRes);
        if (!serverTrackId)
          throw new Error(`Could not create track: ${t.name}`);

        trackIdMap[t.id] = serverTrackId;

        for (const topic of t.topics) {
          if (topic.trim())
            await trackTopicApi.createTopic({
              trackID: serverTrackId,
              topicDetail: topic.trim(),
            } as any);
        }
      }

      // 3. TẠO RUBRICS VÀ ROUNDS
      errorStep = "Rounds & Rubrics Configuration";
      Swal.fire({
        title: "Deploying Event...",
        html: "Configuring Rounds and Rubrics...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });

      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        const rub = rubrics[r.id];
        let setId: string | null = null;

        if (rub.mode === "reuse") setId = rub.reuseSetId;
        else
          setId = await syncSetOrchestrator(
            rub.items,
            rub.setName.trim() || defaultSetNameFor(r, i),
          );

        if (!setId)
          throw new Error(`Could not configure rubric for ${r.roundName}`);

        const toIso = (dateStr: string) => new Date(dateStr).toISOString();
        await roundApi.createRound({
          eventID: eventId,
          roundName: r.roundName.trim(),
          startDate: toIso(r.startDate),
          endDate: toIso(r.endDate),
          topNPromotion: Number(r.topNPromotion),
          maxTeam: Number(r.maxTeam),
          roundIndex: i,
          criteriaSetID: setId,
        } as any);
      }

      // 4. GÁN MENTORS & JUDGES
      errorStep = "Personnel Assignment";
      Swal.fire({
        title: "Deploying Event...",
        html: "Assigning Mentors and Judges...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
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

      // 5. TẠO PRIZES
      errorStep = "Prizes Configuration";
      Swal.fire({
        title: "Deploying Event...",
        html: "Setting up Prizes...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });

      for (const p of eventPrizes) {
        if (!p.name.trim()) continue;
        try {
          await prizeApi.createPrize({
            prizeName: p.name.trim(),
            description: p.description.trim(),
            eventId: eventId,
          });
        } catch (e) {}
      }

      Swal.fire({
        icon: "success",
        title: "Event Launched!",
        text: "Everything is setup and live.",
        confirmButtonColor: BRAND,
      }).then(() => navigate("/admin/events"));
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: `Deployment Failed at ${errorStep}`,
        text: getServerMsg(error),
        confirmButtonColor: BRAND,
      });
    } finally {
      setIsLaunching(false);
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  const tabs = [
    { id: 1, name: "1. Event" },
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
        <div className="flex border-b border-slate-100 px-2 bg-slate-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.id > furthestTab}
              className={`flex-1 px-3 py-4 text-[13px] font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${activeTab === tab.id ? "border-fpt-orange text-fpt-orange bg-white" : tab.id <= furthestTab ? "border-transparent text-emerald-600 hover:text-emerald-700 hover:bg-white" : "border-transparent text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"}`}
            >
              {tab.id < furthestTab && activeTab !== tab.id && (
                <CheckCircle2 size={16} />
              )}
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1">
          {/* STEP 1 */}
          {activeTab === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                  BASIC INFORMATION
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
                      { id: nextId(), name: "", topics: [] },
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
                    <div className="mb-4 w-2/3">
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
                    prevEnd={idx > 0 ? rounds[idx - 1].endDate : ""}
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
                    loadingSets={loadingSets}
                    loadSetsError={loadSetsError}
                    onRetryLoad={loadAvailableSets}
                    onChange={(patch: any) => patchRubric(r.id, patch)}
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

                    // 1. Lấy đúng tên nhân sự và tên Track
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

                    // 2. Tìm xem giáo viên này đã được phân công vào CÙNG 1 TRACK này chưa
                    const assignmentInSameTrack = pendingAssignments.find(
                      (pa) =>
                        String(pa.teacherId) === String(assignForm.teacherId) &&
                        String(pa.trackLocalId) ===
                          String(assignForm.trackLocalId),
                    );

                    if (assignmentInSameTrack) {
                      // Nếu đã có mặt trong Track này rồi -> Bắt đầu check lỗi
                      if (
                        assignmentInSameTrack.isMentor !== assignForm.isMentor
                      ) {
                        // Lỗi xung đột: Vừa làm Mentor vừa làm Judge cho CÙNG 1 Track
                        return Swal.fire({
                          icon: "error",
                          title: "Role Conflict",
                          text: `${tName} is already assigned as a ${assignmentInSameTrack.isMentor ? "Mentor" : "Judge"} for "${trName}". A personnel cannot hold both roles in the same track.`,
                          confirmButtonColor: "#f26f21",
                        });
                      } else {
                        // Lỗi trùng lặp: Thêm 2 lần y hệt nhau
                        return Swal.fire({
                          icon: "warning",
                          title: "Duplicate",
                          text: `${tName} is already assigned to "${trName}".`,
                          confirmButtonColor: "#f26f21",
                        });
                      }
                    }

                    // Vượt qua kiểm tra (Hoặc là Track mới, hoặc là Nhân sự mới) -> Thêm vào danh sách
                    setPendingAssignments([
                      ...pendingAssignments,
                      {
                        ...assignForm,
                        teacherName: tName,
                        trackName: trName,
                        id: nextId(),
                      },
                    ]);
                    setAssignForm({ ...assignForm, teacherId: "" }); // reset dropdown
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

          {/* STEP 6 */}
          {activeTab === 6 && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Prizes & Awards
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Configure default prizes. You can assign them to teams
                    later.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEventPrizes([
                      ...eventPrizes,
                      { id: nextId(), name: "", description: "" },
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
                    className="p-5 bg-white border border-slate-200 rounded-xl relative flex flex-col md:flex-row gap-4 shadow-sm group"
                  >
                    <button
                      onClick={() =>
                        setEventPrizes(eventPrizes.filter((x) => x.id !== p.id))
                      }
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="w-full md:w-1/3">
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                        Prize Name
                      </label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) =>
                          setEventPrizes(
                            eventPrizes.map((x) =>
                              x.id === p.id
                                ? { ...x, name: e.target.value }
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
                    No prizes configured. You can skip this step and add them
                    later in Prize Management.
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
                  className="px-8 py-3 bg-emerald-600 text-white text-sm font-black rounded-xl shadow-md hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-60 transition-colors"
                >
                  {isLaunching ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  {isLaunching ? "Deploying..." : "Finish & Launch Event"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
