import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  X,
  ArrowRight,
  Lock,
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

// SHARED HELPERS (also used by EventDetailsPage — see lib/utils/criteriaHelpers.ts)
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

// Brand color of the whole system (FPT orange)
const BRAND = "#f26f21";

// Client-side only ids (rounds / criteria rows). A plain counter never collides,
// unlike Date.now() when several rows are created within the same millisecond.
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

/** One rubric (criteria set) belongs to exactly ONE round. */
interface RubricConfig {
  mode: "new" | "reuse";
  setName: string;
  items: CriterionRow[];
  reuseSetId: string;
}

const makeRound = (prev?: RoundConfig): RoundConfig => ({
  id: nextId(),
  roundName: "",
  // A new round starts right when the previous one closes.
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

/** Rounds response may carry the id under several names. */
const pickRoundId = (obj: any): string | null => {
  if (!obj) return null;
  const d = obj?.data ?? obj;
  return d?.roundID || d?.roundId || d?.id || null;
};

// ==========================================================
// ROUND CARD — one competition round (fully user-defined)
// ==========================================================
function RoundCard({
  index,
  total,
  round,
  prevEnd,
  onChange,
  onRemove,
}: {
  index: number;
  total: number;
  round: RoundConfig;
  prevEnd: string;
  onChange: (patch: Partial<RoundConfig>) => void;
  onRemove: () => void;
}) {
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
          {index === total - 1 && total > 1 && (
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              (final round)
            </span>
          )}
        </h4>
        {total > 1 && (
          <button
            onClick={onRemove}
            className="text-slate-300 hover:text-red-500 transition-colors"
            title="Remove this round"
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
          placeholder="e.g. Preliminary Round, Semi Final, Grand Final..."
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
            Max teams in this round
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
              <AlertCircle size={12} /> This round cannot start before round{" "}
              {index} has closed.
            </p>
          )}
          {topTooHigh && (
            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> Teams advancing cannot be greater than
              the max teams of this round.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================================
// RUBRIC CARD — the single criteria set of ONE round
// ==========================================================
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
}: {
  index: number;
  roundName: string;
  rubric: RubricConfig;
  defaultSetName: string;
  availableSets: any[];
  loadingSets: boolean;
  loadSetsError: string | null;
  onRetryLoad: () => void;
  onChange: (patch: Partial<RubricConfig>) => void;
}) {
  const picked = availableSets.find(
    (s) => String(s.setId) === String(rubric.reuseSetId),
  );
  const items = rubric.mode === "new" ? rubric.items : picked?.items || [];
  const total = sumWeight(items);
  const isFull = total === 100;
  const hasEmptyName =
    rubric.mode === "new" && rubric.items.some((i) => !i.name.trim());

  const addItem = () =>
    onChange({
      items: [
        ...rubric.items,
        { id: nextId(), name: "", description: "", weight: 0 },
      ],
    });
  const removeItem = (id: number) =>
    onChange({ items: rubric.items.filter((i) => i.id !== id) });
  const updateItem = (id: number, patch: Partial<CriterionRow>) =>
    onChange({
      items: rubric.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
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
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${
                rubric.mode === m
                  ? "bg-fpt-orange text-white border-fpt-orange"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
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
            {rubric.items.map((r) => (
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
                      onClick={() => removeItem(r.id)}
                      className="text-slate-300 hover:text-red-500 p-1"
                      title="Remove criterion"
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
              onClick={addItem}
              className="text-xs font-bold text-slate-500 hover:text-fpt-orange mt-2 flex items-center gap-1"
            >
              <Plus size={12} /> Add criterion
            </button>
          </div>
        </>
      ) : (
        <>
          {loadingSets && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              Loading rubric sets...
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
              No rubric set exists yet. Switch to "New rubric" above.
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
                {availableSets.map((s) => (
                  <option key={s.setId} value={s.setId}>
                    {s.setName}
                  </option>
                ))}
              </select>

              {picked && (
                <div className="mt-4 space-y-2">
                  {picked.items.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      This set has no criteria yet.
                    </p>
                  ) : (
                    picked.items.map((it: any, i: number) => (
                      <div
                        key={it.criteriaId || i}
                        className="text-sm px-3 py-2 bg-slate-50 rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-700">
                            {it.name}
                          </span>
                          <span className="font-black text-slate-500">
                            {it.score}%
                          </span>
                        </div>
                        {it.description && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {it.description}
                          </p>
                        )}
                      </div>
                    ))
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
              exactly 100% before you can save.
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

export function CreateEvents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);

  // ==========================================
  // IDS ALREADY PERSISTED — prevents duplicates when the user goes back
  // ==========================================
  const [savedEventId, setSavedEventId] = useState<string | null>(null);
  const [savedSetIds, setSavedSetIds] = useState<Record<number, string>>({});
  const [createdRoundIds, setCreatedRoundIds] = useState<
    Record<number, string>
  >({});

  // ==========================================
  // TAB DATA
  // ==========================================
  const [eventForm, setEventForm] = useState({
    eventName: "",
    season: "Fall",
    year: new Date().getFullYear(),
  });

  const [tracks, setTracks] = useState<any[]>([{ id: nextId(), name: "", topics: [] }]);
  const [topicInputs, setTopicInputs] = useState<{ [key: number]: string }>({});

  // STEP 3 — rounds are fully flexible (1..n)
  const [rounds, setRounds] = useState<RoundConfig[]>([makeRound()]);
  const [roundsConfirmed, setRoundsConfirmed] = useState(false);

  // STEP 4 — exactly one rubric per round, keyed by the round's client id
  const [rubrics, setRubrics] = useState<Record<number, RubricConfig>>({
    [rounds[0].id]: makeRubric(),
  });

  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingTracks, setIsSavingTracks] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Reusable rubric sets already stored in the system
  const [availableSets, setAvailableSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadSetsError, setLoadSetsError] = useState<string | null>(null);
  const [setsLoaded, setSetsLoaded] = useState(false);

  // Keep the rubric map in sync with the round list (add / remove rounds).
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
    `${eventForm.eventName || "Event"} - ${
      r.roundName || `Round ${idx + 1}`
    } Rubric`;

  // ==========================================
  // LOAD EXISTING RUBRIC SETS (for the "Existing rubric" mode)
  // ==========================================
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
          // ⚠️ The backend returns the set id under several names; we must grab
          // the real GUID, never undefined.
          setId: grabSetId(s),
          setName: s.setName || s.SetName || "Rubric set",
        }))
        // Drop sets without a usable id (never fall back to the set name).
        .filter((s): s is { setId: string; setName: string } => !!s.setId);

      // ⚠️ IMPORTANT: getAllSet() only returns a shallow list WITHOUT the
      // criteria inside each set — that is why the preview used to always say
      // "this set has no criteria". We must fetch each set detail (getSetById)
      // to get the real criteriaList, exactly like EventDetailsPage does.
      const enriched = await loadSetsWithItems(baseSets, critMap, (setId) =>
        criteriaApi.getSetById(setId),
      );
      setAvailableSets(enriched);
      setSetsLoaded(true);
    } catch (e) {
      console.error("Could not load existing rubric sets:", e);
      setLoadSetsError("Could not load the existing rubric sets.");
    } finally {
      setLoadingSets(false);
    }
  };

  // Lazily fetch the reusable sets the first time step 4 is opened.
  useEffect(() => {
    if (activeTab === 4 && !setsLoaded && !loadingSets) loadAvailableSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ==========================================
  // STEP 1: EVENT
  // ==========================================
  const handleSaveEvent = async () => {
    if (!eventForm.eventName.trim())
      return Swal.fire({
        icon: "warning",
        title: "Missing name",
        text: "Please enter the event name.",
        confirmButtonColor: BRAND,
      });

    setIsSavingEvent(true);
    try {
      Swal.fire({
        title: "Saving the event...",
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        eventName: eventForm.eventName.trim(),
        season: eventForm.season,
        year: Number(eventForm.year),
      };

      if (savedEventId) {
        // Already created -> PUT (wrapped in case the backend rejects PUT)
        try {
          await eventApi.updateEvent(savedEventId, payload);
        } catch (e) {
          console.warn("Could not update the event, ignoring:", e);
        }
      } else {
        try {
          const res: any = await eventApi.createEvent(payload as any);
          const eventId = extractId(res);
          if (!eventId) throw new Error("No id returned");
          setSavedEventId(eventId);
        } catch (error) {
          // POST failed (often a duplicate name) -> look the event up again
          const allEvents = getList(await eventApi.getAllEvents());
          const matchedEvent = [...allEvents]
            .reverse()
            .find((e: any) => (e.name || e.eventName) === payload.eventName);
          const foundId = extractId(matchedEvent);
          if (!foundId) throw error;
          setSavedEventId(foundId);
        }
      }

      Swal.fire({
        icon: "success",
        title: "Event saved!",
        showConfirmButton: false,
        timer: 1000,
      });
      setActiveTab(2);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not save the event",
        text: getServerMsg(error),
        confirmButtonColor: BRAND,
      });
    } finally {
      setIsSavingEvent(false);
    }
  };

  // ==========================================
  // STEP 2: TRACKS & TOPICS
  // ==========================================
  const handleSaveTracks = async () => {
    if (!savedEventId)
      return Swal.fire({
        icon: "error",
        title: "Save step 1 first",
        text: "The event must be created before adding tracks.",
        confirmButtonColor: BRAND,
      });

    setIsSavingTracks(true);
    try {
      Swal.fire({
        title: "Syncing tracks & topics...",
        didOpen: () => Swal.showLoading(),
      });
      const topicFails: string[] = [];
      const allTracksRaw = await trackTopicApi.getAllTracks();
      const existingTracks = getList(allTracksRaw).filter(
        (t) => String(t.eventId || t.eventID) === String(savedEventId),
      );

      for (const track of tracks) {
        if (!track.name.trim()) continue;

        // Resolve the track id precisely (pickTrackId never falls back to eventId)
        const matchedTrack = existingTracks.find(
          (t) =>
            (t.trackName || t.name || "")?.toLowerCase() ===
            track.name.trim().toLowerCase(),
        );
        let currentTrackId = pickTrackId(matchedTrack);

        if (currentTrackId) {
          try {
            await trackTopicApi.updateTrack(currentTrackId, {
              eventId: savedEventId,
              trackName: track.name.trim(),
            } as any);
          } catch (e) {
            console.warn("Could not update the track", e);
          }
        } else {
          try {
            const trackRes: any = await trackTopicApi.createTrack({
              eventId: savedEventId,
              trackName: track.name.trim(),
            } as any);
            currentTrackId = pickTrackId(trackRes);
          } catch (e: any) {
            console.warn("createTrack failed (duplicate name?), refetching:", e);
          }
        }

        // Still no id (empty POST body / duplicate) -> refetch and match by name
        if (!currentTrackId) {
          const refetchTracks = getList(await trackTopicApi.getAllTracks());
          const refetchMatch = [...refetchTracks]
            .reverse()
            .find(
              (t) =>
                (t.trackName || t.name || "")?.trim().toLowerCase() ===
                  track.name.trim().toLowerCase() &&
                String(t.eventId || t.eventID) === String(savedEventId),
            );
          currentTrackId = pickTrackId(refetchMatch);
        }

        // 🛡️ GUARD: never let the track id collapse into the event id
        if (!currentTrackId || String(currentTrackId) === String(savedEventId)) {
          console.error(
            "No valid trackId for track:",
            track.name,
            "-> skipping its topics.",
          );
          continue;
        }

        // Topics
        let existingTopics: any[] = [];
        try {
          existingTopics = getList(await trackTopicApi.getAllTopics()).filter(
            (t) => String(t.trackID || t.trackId) === String(currentTrackId),
          );
        } catch (e) {
          console.warn("getAllTopics failed:", e);
        }

        for (const topic of track.topics) {
          const name = String(topic).trim();
          if (!name) continue;
          const isExist = existingTopics.some(
            (t) =>
              (t.topicDetail || t.name || "")?.trim().toLowerCase() ===
              name.toLowerCase(),
          );
          if (isExist) continue;
          try {
            await trackTopicApi.createTopic({
              trackID: currentTrackId,
              topicDetail: name,
            } as any);
          } catch (e: any) {
            console.error(
              "POST topic failed:",
              name,
              e?.response?.status,
              e?.response?.data,
            );
            topicFails.push(`"${name}" — ${getServerMsg(e)}`);
          }
        }
      }

      if (topicFails.length > 0) {
        Swal.fire({
          icon: "warning",
          title: "Some topics were rejected",
          html:
            `The backend rejected ${topicFails.length} topic(s) — usually because the name already exists:<br><br>` +
            topicFails.join("<br>"),
          confirmButtonColor: BRAND,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Tracks saved!",
          showConfirmButton: false,
          timer: 1000,
        });
      }
      setActiveTab(3);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Could not save the tracks",
        text: getServerMsg(error),
        confirmButtonColor: BRAND,
      });
    } finally {
      setIsSavingTracks(false);
    }
  };

  // ==========================================
  // STEP 3: ROUNDS — validated locally only.
  // The backend requires a criteriaSetID on every round, so the rounds are
  // actually POSTed at the end of step 4, once their rubric sets exist.
  // ==========================================
  const handleConfirmRounds = () => {
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

      const dStart = new Date(r.startDate);
      const dEnd = new Date(r.endDate);
      if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime()))
        return Swal.fire({
          icon: "warning",
          title: "Invalid date",
          text: `The schedule of "${label}" is not a valid date/time.`,
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
          text: `Max teams and teams advancing of "${label}" must be at least 1.`,
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

    setRoundsConfirmed(true);
    setActiveTab(4);
  };

  // ==========================================
  // STEP 4: RUBRICS + FINAL LAUNCH
  // ==========================================

  /** Create (or update) one criteria set and return its id. */
  const syncSet = async (
    rubricList: CriterionRow[],
    setName: string,
    existingSetId: string | null,
  ) => {
    const criteriaMap = await Promise.all(
      rubricList.map(async (r) => {
        let cId: string | null = null;
        const description = r.description.trim() || DEFAULT_CRITERIA_DESCRIPTION;
        try {
          const res = await criteriaApi.createCriterion({
            criteriaName: r.name.trim(),
            description,
          } as any);
          cId = extractId(res);
        } catch (e) {
          // 400 because the name already exists -> resolve the id below
        }

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

          // ⚠️ IMPORTANT: when createCriterion failed because of a DUPLICATE
          // NAME (very common with generic names reused across events), the
          // existing criterion still holds its OLD description. Without this
          // PUT the description just typed by the user would be silently
          // swallowed and the UI would keep showing the old text.
          if (cId) {
            try {
              await criteriaApi.updateCriterion(cId, {
                criteriaID: cId,
                criteriaId: cId,
                criteriaName: r.name.trim(),
                description,
              } as any);
            } catch (e) {
              console.warn(
                "Could not sync the description of the duplicated criterion:",
                r.name,
                e,
              );
            }
          }
        }
        return { criteriaId: cId, score: Number(r.weight) };
      }),
    );

    // Never send a null criteriaId — the backend answers 400 on those.
    const resolved = criteriaMap.filter((c) => !!c.criteriaId) as {
      criteriaId: string;
      score: number;
    }[];
    if (resolved.length !== criteriaMap.length)
      throw new Error(
        `Some criteria of "${setName}" could not be created on the server.`,
      );

    let setId = existingSetId;

    if (setId) {
      // ⚠️ PUT /Criteria/set/{id} only accepts the camelCase shape — sending
      // both camelCase and PascalCase keys makes it answer 400.
      await criteriaApi.updateSet(setId, {
        setName,
        isDefault: true,
        criteriaList: resolved,
      });
    } else {
      try {
        const res = await criteriaApi.createSet({
          setName,
          isDefault: true,
          criteriaList: resolved,
          CriteriaList: resolved,
        } as any);
        setId = extractId(res);
      } catch (e) {
        console.warn("createSet failed, will try to look it up:", e);
      }

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
    }
    return setId;
  };

  const handleLaunch = async () => {
    if (!savedEventId)
      return Swal.fire({
        icon: "error",
        title: "Save step 1 first",
        text: "The event must be created before the rounds can be launched.",
        confirmButtonColor: BRAND,
      });
    if (!roundsConfirmed)
      return Swal.fire({
        icon: "error",
        title: "Configure the rounds first",
        text: "Go back to step 3 and confirm the round schedule.",
        confirmButtonColor: BRAND,
      });

    // ---- validate every rubric ----
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
            text: `Please pick an existing rubric set for "${label}".`,
            confirmButtonColor: BRAND,
          });
        const total = sumWeight(picked.items || []);
        if (total !== 100)
          return Swal.fire({
            icon: "error",
            title: "Total weight is not 100%",
            text: `The rubric selected for "${label}" adds up to ${total}%. Fix its weights on the event details page, or pick another set.`,
            confirmButtonColor: BRAND,
          });
      } else {
        if (rub.items.length === 0)
          return Swal.fire({
            icon: "warning",
            title: "Empty rubric",
            text: `The rubric of "${label}" needs at least one criterion.`,
            confirmButtonColor: BRAND,
          });
        if (rub.items.some((it) => !it.name.trim()))
          return Swal.fire({
            icon: "warning",
            title: "Missing criterion name",
            text: `Every criterion of "${label}" needs a name.`,
            confirmButtonColor: BRAND,
          });
        const total = sumWeight(rub.items);
        if (total !== 100)
          return Swal.fire({
            icon: "error",
            title: "Total weight is not 100%",
            text: `The rubric of "${label}" adds up to ${total}%. Each rubric must total exactly 100%.`,
            confirmButtonColor: BRAND,
          });
      }
    }

    setIsLaunching(true);
    const toIso = (dateStr: string) => new Date(dateStr).toISOString();
    let currentLabel = "";

    try {
      Swal.fire({
        title: "Creating rubrics & rounds...",
        didOpen: () => Swal.showLoading(),
      });

      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        const rub = rubrics[r.id];
        currentLabel = r.roundName.trim() || `Round ${i + 1}`;

        // 1) rubric set
        let setId: string | null;
        if (rub.mode === "reuse") {
          setId = rub.reuseSetId;
        } else {
          setId = await syncSet(
            rub.items,
            rub.setName.trim() || defaultSetNameFor(r, i),
            savedSetIds[r.id] ?? null,
          );
        }
        if (!setId)
          throw new Error(
            `The rubric set of "${currentLabel}" could not be created.`,
          );
        setSavedSetIds((prev) => ({ ...prev, [r.id]: setId as string }));

        // 2) round itself
        const payload = {
          eventID: savedEventId,
          roundName: r.roundName.trim(),
          startDate: toIso(r.startDate),
          endDate: toIso(r.endDate),
          topNPromotion: Number(r.topNPromotion),
          maxTeam: Number(r.maxTeam),
          roundIndex: i,
          criteriaSetID: setId,
        };

        const alreadyCreated = createdRoundIds[r.id];
        if (alreadyCreated) {
          // Retry after a partial failure -> update instead of duplicating
          await roundApi.updateRound({
            ...payload,
            roundID: alreadyCreated,
          } as any);
        } else {
          const res: any = await roundApi.createRound(payload as any);
          const newRoundId = pickRoundId(res);
          if (newRoundId)
            setCreatedRoundIds((prev) => ({ ...prev, [r.id]: newRoundId }));
        }
      }

      Swal.fire({
        icon: "success",
        title: "Event is live!",
        text: `${rounds.length} round(s) and their rubrics were created successfully.`,
        confirmButtonColor: BRAND,
      }).then(() => navigate("/admin/events"));
    } catch (error: any) {
      console.error(
        "Launch failed — backend detail:",
        error?.response?.status,
        error?.response?.data || error,
      );
      Swal.fire({
        icon: "error",
        title: `Failed on "${currentLabel}"`,
        text: getServerMsg(error),
        confirmButtonColor: BRAND,
      });
    } finally {
      setIsLaunching(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  const tabs = [
    { id: 1, name: "1. Event", isSaved: !!savedEventId },
    { id: 2, name: "2. Tracks & Topics", isSaved: false },
    { id: 3, name: "3. Rounds", isSaved: roundsConfirmed },
    {
      id: 4,
      name: "4. Grading Rubrics",
      isSaved: Object.keys(createdRoundIds).length > 0,
    },
  ];

  const isTabLocked = (id: number) =>
    (id > 1 && !savedEventId) || (id === 4 && !roundsConfirmed);

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
        {/* TAB BAR */}
        <div className="flex border-b border-slate-100 px-2 bg-slate-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={isTabLocked(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2
                ${
                  activeTab === tab.id
                    ? "border-fpt-orange text-fpt-orange bg-white"
                    : tab.isSaved
                      ? "border-transparent text-emerald-600 hover:text-emerald-700 hover:bg-white"
                      : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                }`}
            >
              {tab.isSaved && activeTab !== tab.id && <CheckCircle2 size={16} />}
              {tab.name}
              {isTabLocked(tab.id) && (
                <Lock size={14} className="ml-1 opacity-50" />
              )}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1">
          {/* ============ STEP 1: EVENT ============ */}
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
                    onClick={handleSaveEvent}
                    disabled={isSavingEvent}
                    className="px-6 py-3 bg-fpt-orange text-white text-sm font-bold rounded-xl shadow-md hover:bg-fpt-orange-dark flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSavingEvent ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {isSavingEvent ? "Saving..." : "Save & Continue"}
                    {!isSavingEvent && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============ STEP 2: TRACKS ============ */}
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
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
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
                            if (e.key === "Enter" && topicInputs[t.id]?.trim()) {
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
                  onClick={() => setActiveTab(1)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSaveTracks}
                  disabled={isSavingTracks}
                  className="px-6 py-3 bg-fpt-orange text-white text-sm font-bold rounded-xl shadow-md hover:bg-fpt-orange-dark flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isSavingTracks ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSavingTracks ? "Saving..." : "Save tracks & Continue"}
                  {!isSavingTracks && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* ============ STEP 3: ROUNDS ============ */}
          {activeTab === 3 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CalendarClock size={20} className="text-fpt-orange" />
                    Competition rounds
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Add as many rounds as this hackathon needs — each one gets
                    its own grading rubric in the next step.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setRounds((prev) => [
                      ...prev,
                      makeRound(prev[prev.length - 1]),
                    ])
                  }
                  className="px-4 py-2 bg-fpt-orange-soft text-fpt-orange text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-orange-100 transition-colors shrink-0"
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
                    onChange={(patch) => {
                      patchRound(r.id, patch);
                      setRoundsConfirmed(false);
                    }}
                    onRemove={() => {
                      setRounds((prev) => prev.filter((x) => x.id !== r.id));
                      setRoundsConfirmed(false);
                    }}
                  />
                ))}
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab(2)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirmRounds}
                  className="px-6 py-3 bg-fpt-orange text-white text-sm font-bold rounded-xl shadow-md hover:bg-fpt-orange-dark flex items-center gap-2 transition-colors"
                >
                  <ClipboardList size={16} />
                  Continue to rubrics
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ============ STEP 4: RUBRICS ============ */}
          {activeTab === 4 && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">
                  Grading rubrics
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  One rubric per round — {rounds.length} round(s) configured.
                  Every rubric must total exactly 100%.
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
                    onChange={(patch) => patchRubric(r.id, patch)}
                  />
                ))}
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab(3)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={isLaunching}
                  className="px-8 py-3 bg-fpt-orange text-white text-sm font-black rounded-xl shadow-md hover:bg-fpt-orange-dark flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isLaunching ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  {isLaunching ? "Launching..." : "Finish & Launch Event"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
