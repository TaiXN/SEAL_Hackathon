import { useState } from "react";
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
  Scale,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { criteriaApi } from "../../lib/api/criteriaApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { eventApi } from "../../lib/api/eventApi";
import { roundApi } from "../../lib/api/roundApi";

import {
  getList,
  extractId,
  pickTrackId,
  grabSetId,
  sumWeight,
  buildCriteriaMap,
  loadSetsWithItems,
  DEFAULT_CRITERIA_DESCRIPTION,
} from "../../lib/utils/criteriaHelpers";

const getErrorMessage = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors)) return data.errors.join(", ");
  if (data?.errors && typeof data.errors === "object") {
    const msgs = Object.values(data.errors).flat();
    if (msgs.length) return msgs.join(", ");
  }
  if (error?.message) return error.message;
  return fallback;
};

interface RubricItem {
  id: number;
  name: string;
  description: string;
  weight: number;
}

// Component RubricPanel giữ nguyên
function RubricPanel({
  title,
  setName,
  onSetNameChange,
  items,
  onChange,
}: {
  title: string;
  setName: string;
  onSetNameChange: (name: string) => void;
  items: RubricItem[];
  onChange: (items: RubricItem[]) => void;
}) {
  const total = sumWeight(items);
  const isValid = total === 100;

  const addItem = () =>
    onChange([
      ...items,
      { id: Date.now(), name: "", description: "", weight: 0 },
    ]);
  const removeItem = (id: number) => onChange(items.filter((i) => i.id !== id));
  const updateItem = (id: number, patch: Partial<RubricItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100/80">
        <h4 className="font-extrabold text-[#0a192f] text-lg shrink-0">
          {title}
        </h4>
        <div className="flex items-center gap-3 w-full flex-1 min-w-0">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest shrink-0">
            Set Name
          </label>
          <input
            type="text"
            value={setName}
            onChange={(e) => onSetNameChange(e.target.value)}
            placeholder="e.g., Round Rubric Set..."
            className="w-full min-w-0 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#0a192f] focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {items.map((r) => (
          <div
            key={r.id}
            className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3 transition-all hover:bg-white hover:shadow-sm hover:border-slate-200"
          >
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={r.name}
                onChange={(e) => updateItem(r.id, { name: e.target.value })}
                className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none font-bold text-[#0a192f] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="Criterion Name"
              />
              <div className="relative w-28 shrink-0">
                <input
                  type="number"
                  value={r.weight}
                  onChange={(e) =>
                    updateItem(r.id, { weight: Number(e.target.value) })
                  }
                  className="w-full pl-3 pr-8 py-2.5 text-sm text-center bg-white border border-slate-200 rounded-xl font-black text-[#0a192f] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  %
                </span>
              </div>
              <button
                onClick={() => removeItem(r.id)}
                className="text-slate-300 hover:text-red-500 p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
              >
                <Trash2 size={16} strokeWidth={2.5} />
              </button>
            </div>
            <input
              type="text"
              value={r.description}
              onChange={(e) =>
                updateItem(r.id, { description: e.target.value })
              }
              className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none text-slate-600 font-medium focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
              placeholder="Description (optional)"
            />
          </div>
        ))}
        <button
          onClick={addItem}
          className="text-xs font-extrabold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1.5 px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors bg-white border border-blue-100 shadow-sm"
        >
          <Plus size={14} strokeWidth={3} /> Add Criterion
        </button>
      </div>

      <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between items-center font-bold text-sm">
        <span className="text-slate-500 uppercase tracking-widest text-[11px] font-extrabold">
          Total Weight
        </span>
        <span
          className={`px-4 py-1.5 rounded-xl font-black ${isValid ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-500 border border-red-100"}`}
        >
          {total}%
        </span>
      </div>
    </div>
  );
}

export function CreateEvents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);
  const [savedEventId, setSavedEventId] = useState<string | null>(null);

  // Tab 1 State
  const [eventForm, setEventForm] = useState({
    eventName: "",
    season: "Fall",
    year: 2026,
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // Tab 2 State
  const [tracks, setTracks] = useState<any[]>([
    { id: 1, name: "", topics: [] },
  ]);
  const [topicInputs, setTopicInputs] = useState<{ [key: number]: string }>({});
  const [isSavingTracks, setIsSavingTracks] = useState(false);

  // ==========================================
  // MEGA STATE TÍCH HỢP CHO ROUNDS & RUBRICS
  // ==========================================
  const [dynamicRounds, setDynamicRounds] = useState<any[]>([
    {
      id: Date.now(),
      roundName: "Preliminary Round",
      startDate: "",
      endDate: "",
      maxTeam: 40,
      topAdvance: 10,
      rubricMode: "new",
      reuseSetId: "",
      rubric: {
        setName: "Preliminary Rubric Set",
        items: [
          { id: 1, name: "Innovation", description: "", weight: 50 },
          { id: 2, name: "Practicality", description: "", weight: 50 },
        ],
      },
    },
  ]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Data for Reuse Rubrics
  const [availableSets, setAvailableSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [hasLoadedSets, setHasLoadedSets] = useState(false);

  const loadAvailableSets = async () => {
    try {
      setLoadingSets(true);
      const [setsRaw, critRaw] = await Promise.all([
        criteriaApi.getAllSet(),
        criteriaApi.getAllCriteria(),
      ]);
      const critMap = buildCriteriaMap(critRaw);
      const baseSets = getList(setsRaw)
        .map((s: any) => ({
          setId: grabSetId(s),
          setName: s.setName || s.SetName || "Rubric Set",
        }))
        .filter((s): s is { setId: string; setName: string } => !!s.setId);

      const enriched = await loadSetsWithItems(baseSets, critMap, (setId) =>
        criteriaApi.getSetById(setId),
      );
      setAvailableSets(enriched);
      setHasLoadedSets(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSets(false);
    }
  };

  // --- SAVE EVENT ---
  const handleSaveEvent = async () => {
    if (!eventForm.eventName.trim())
      return Swal.fire("Required", "Please enter the event name!", "warning");
    setIsSavingEvent(true);
    try {
      Swal.fire({
        title: "Saving Event...",
        didOpen: () => Swal.showLoading(),
      });
      const payload = {
        eventName: eventForm.eventName.trim(),
        season: eventForm.season,
        year: Number(eventForm.year),
        currentRound: 0,
      };
      if (savedEventId) {
        await eventApi.updateEvent(savedEventId, payload);
      } else {
        let newId: string | null = null;
        try {
          const res: any = await eventApi.createEvent(payload as any);
          newId = extractId(res);
        } catch (error) {
          newId = null;
        }
        // Backend đôi khi trả về response thiếu field ID mong đợi dù đã tạo
        // thành công -> dò lại theo tên để không bị kẹt savedEventId = null.
        if (!newId) {
          const allEvents = getList(await eventApi.getAllEvents());
          const matched = [...allEvents]
            .reverse()
            .find((e: any) => (e.name || e.eventName) === payload.eventName);
          newId = extractId(matched) || null;
        }
        if (!newId) {
          throw new Error("Could not resolve created event ID");
        }
        setSavedEventId(newId);
      }
      Swal.fire({
        icon: "success",
        title: "Saved!",
        showConfirmButton: false,
        timer: 1000,
      });
      setActiveTab(2);
    } catch (error) {
      Swal.fire(
        "Error",
        getErrorMessage(error, "Failed to save event information!"),
        "error",
      );
    } finally {
      setIsSavingEvent(false);
    }
  };

  // --- SAVE TRACKS ---
  const handleSaveTracks = async () => {
    if (!savedEventId)
      return Swal.fire("Error", "Please save event on Tab 1 first!", "error");
    setIsSavingTracks(true);
    try {
      Swal.fire({
        title: "Syncing Tracks...",
        didOpen: () => Swal.showLoading(),
      });
      for (const track of tracks) {
        if (!track.name.trim()) continue;
        const trackRes: any = await trackTopicApi.createTrack({
          eventId: savedEventId,
          trackName: track.name.trim(),
        } as any);
        const currentTrackId = pickTrackId(trackRes);
        if (currentTrackId) {
          for (const topic of track.topics) {
            await trackTopicApi
              .createTopic({
                trackID: currentTrackId,
                topicDetail: String(topic).trim(),
              } as any)
              .catch(() => {});
          }
        }
      }
      Swal.fire({
        icon: "success",
        title: "Tracks Saved!",
        showConfirmButton: false,
        timer: 1000,
      });
      setActiveTab(3); // Next is Rounds
    } catch (error) {
      Swal.fire(
        "Error",
        getErrorMessage(error, "Error saving tracks!"),
        "error",
      );
    } finally {
      setIsSavingTracks(false);
    }
  };

  // --- TRANSITION TỪ ROUND SANG RUBRIC ---
  const handleContinueToRubrics = () => {
    const isValid = dynamicRounds.every(
      (r) => r.roundName.trim() && r.startDate && r.endDate,
    );
    if (!isValid)
      return Swal.fire(
        "Required",
        "Please fill in all names and dates for your rounds!",
        "warning",
      );
    // Chỉ nhảy tab, không lưu API vội
    setActiveTab(4);
    if (!hasLoadedSets) loadAvailableSets();
  };

  // --- FINAL PUBLISH (SAVE RUBRICS + ROUNDS CÙNG LÚC) ---
  const handlePublishAll = async () => {
    // Validate bộ tiêu chí
    for (const round of dynamicRounds) {
      if (round.rubricMode === "reuse" && !round.reuseSetId) {
        return Swal.fire(
          "Required",
          `Please select a rubric set for ${round.roundName}!`,
          "warning",
        );
      }
      if (round.rubricMode === "new") {
        if (!round.rubric.setName.trim())
          return Swal.fire(
            "Required",
            `Please enter a set name for ${round.roundName}!`,
            "warning",
          );
        if (sumWeight(round.rubric.items) !== 100)
          return Swal.fire(
            "Invalid Weight",
            `Rubric total for ${round.roundName} must be 100%!`,
            "error",
          );
      }
    }

    setIsPublishing(true);
    try {
      Swal.fire({
        title: "Publishing Tournament...",
        text: "Creating rubrics and configuring timeline...",
        didOpen: () => Swal.showLoading(),
      });

      // Hàm helper để tạo 1 bộ tiêu chí
      const syncSet = async (rubricList: RubricItem[], setName: string) => {
        const criteriaMap = await Promise.all(
          rubricList.map(async (r) => {
            let cId = null;
            try {
              const res = await criteriaApi.createCriterion({
                criteriaName: r.name.trim(),
                description:
                  r.description.trim() || DEFAULT_CRITERIA_DESCRIPTION,
              } as any);
              cId = extractId(res);
            } catch (e) {}
            return {
              criteriaId: cId,
              CriteriaId: cId,
              score: Number(r.weight),
              Score: Number(r.weight),
            };
          }),
        );

        let setId = null;
        try {
          const res = await criteriaApi.createSet({
            setName: setName.trim(),
            isDefault: true,
            criteriaList: criteriaMap,
          } as any);
          setId = extractId(res);
        } catch (e) {}
        return setId;
      };

      // Duyệt qua từng vòng thi để tạo
      const toIso = (dateStr: string) => new Date(dateStr).toISOString();
      for (let i = 0; i < dynamicRounds.length; i++) {
        const round = dynamicRounds[i];
        let finalSetId = round.reuseSetId;

        // Nếu chọn tạo mới -> Tạo bộ tiêu chí trước
        if (round.rubricMode === "new") {
          finalSetId = await syncSet(round.rubric.items, round.rubric.setName);
        }

        // Tạo vòng thi tương ứng, link với bộ tiêu chí vừa tạo
        const payload = {
          eventID: savedEventId,
          roundName: round.roundName.trim(),
          startDate: toIso(round.startDate),
          endDate: toIso(round.endDate),
          topNPromotion: Number(round.topAdvance),
          maxTeam: Number(round.maxTeam),
          roundIndex: i + 1, // Đánh index 1, 2, 3... cho khớp logic
          criteriaSetID: finalSetId,
        };
        await roundApi.createRound(payload as any);
      }

      Swal.fire({
        icon: "success",
        title: "All Set!",
        text: "The event timeline and rubrics have been fully configured.",
        confirmButtonColor: "#0a192f",
      }).then(() => navigate("/admin/events"));
    } catch (error) {
      Swal.fire(
        "Error",
        getErrorMessage(error, "Failed to finalize the tournament."),
        "error",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className="w-full bg-[#f4f6f8] min-h-screen p-10 animate-in fade-in duration-500 font-sans selection:bg-slate-200">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-[#0a192f] tracking-tight">
              Initialize Event
            </h2>
            <p className="text-slate-500 text-base font-medium mt-2">
              Set up the new tournament structure step by step.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/events")}
            className="px-6 py-3.5 bg-white border border-slate-200 text-sm font-bold rounded-2xl hover:bg-slate-50 shadow-sm"
          >
            Cancel & Return
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[600px] flex flex-col">
          {/* TABS CẬP NHẬT LẠI THỨ TỰ */}
          <div className="flex border-b border-slate-100 px-4 bg-slate-50/50 pt-2">
            {[
              { id: 1, name: "1. Event Info", isSaved: !!savedEventId },
              { id: 2, name: "2. Tracks & Topics", isSaved: activeTab > 2 },
              { id: 3, name: "3. Tournament Rounds", isSaved: activeTab > 3 },
              { id: 4, name: "4. Grading Rubrics", isSaved: false },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.id > 1 && !savedEventId}
                className={`flex-1 px-4 py-4 text-sm font-extrabold border-b-[3px] transition-all flex items-center justify-center gap-2
                  ${activeTab === tab.id ? "border-[#0a192f] text-[#0a192f] bg-white rounded-t-2xl" : tab.isSaved ? "border-transparent text-emerald-600 hover:bg-white rounded-t-2xl" : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-40 rounded-t-2xl"}`}
              >
                {tab.isSaved && activeTab !== tab.id && (
                  <CheckCircle2 size={16} />
                )}
                {tab.name}
                {tab.id > 1 && !savedEventId && (
                  <Lock size={14} className="ml-1 opacity-40" />
                )}
              </button>
            ))}
          </div>

          <div className="p-10 flex-1 bg-white">
            {/* TAB 1 & 2 GIỮ NGUYÊN CODE Ở TRÊN */}
            {activeTab === 1 && (
              <div className="space-y-8 max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        Display Name
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
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          Season
                        </label>
                        <select
                          value={eventForm.season}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              season: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:border-blue-400"
                        >
                          <option value="Spring">Spring</option>
                          <option value="Summer">Summer</option>
                          <option value="Fall">Fall</option>
                          <option value="Winter">Winter</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
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
                          className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-8 mt-8 border-t border-slate-100">
                    <button
                      onClick={handleSaveEvent}
                      disabled={isSavingEvent}
                      className="px-8 py-3.5 bg-[#0a192f] text-white text-sm font-bold rounded-2xl flex items-center gap-2"
                    >
                      {isSavingEvent ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        "Save & Continue"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-8 max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-extrabold text-[#0a192f]">
                    Competition Tracks
                  </h3>
                  <button
                    onClick={() =>
                      setTracks([
                        ...tracks,
                        { id: Date.now(), name: "", topics: [] },
                      ])
                    }
                    className="px-5 py-2.5 bg-blue-50 text-blue-600 text-xs font-extrabold rounded-xl flex items-center gap-2 hover:bg-blue-100"
                  >
                    <Plus size={16} strokeWidth={3} /> Add Track
                  </button>
                </div>
                <div className="space-y-6">
                  {tracks.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative"
                    >
                      <button
                        onClick={() =>
                          setTracks(tracks.filter((tr) => tr.id !== t.id))
                        }
                        className="absolute top-6 right-6 text-slate-300 hover:text-red-500 p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                      <div className="mb-6 w-3/4">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                          Track Name #{idx + 1}
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
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                          Sub-topics
                        </label>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {t.topics.map((topic: string, i: number) => (
                            <span
                              key={i}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                            >
                              {topic}
                              <button
                                onClick={() =>
                                  setTracks(
                                    tracks.map((tr) =>
                                      tr.id === t.id
                                        ? {
                                            ...tr,
                                            topics: tr.topics.filter(
                                              (_: any, index: any) =>
                                                index !== i,
                                            ),
                                          }
                                        : tr,
                                    ),
                                  )
                                }
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X size={14} strokeWidth={3} />
                              </button>
                            </span>
                          ))}
                        </div>
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
                          placeholder="Type and press Enter..."
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-8 mt-8 border-t border-slate-100">
                  <button
                    onClick={handleSaveTracks}
                    disabled={isSavingTracks}
                    className="px-8 py-3.5 bg-[#0a192f] text-white text-sm font-bold rounded-2xl flex items-center gap-2"
                  >
                    {isSavingTracks ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      "Save Tracks & Continue"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: TOURNAMENT ROUNDS (ĐÃ ĐƯỢC CHUYỂN LÊN TRƯỚC) */}
            {activeTab === 3 && (
              <div className="space-y-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-extrabold text-[#0a192f]">
                      Tournament Timeline
                    </h3>
                    <button
                      onClick={() =>
                        setDynamicRounds([
                          ...dynamicRounds,
                          {
                            id: Date.now(),
                            roundName: `Round ${dynamicRounds.length + 1}`,
                            startDate: "",
                            endDate: "",
                            maxTeam: 40,
                            topAdvance: 10,
                            rubricMode: "new",
                            reuseSetId: "",
                            rubric: {
                              setName: `Round ${dynamicRounds.length + 1} Rubric`,
                              items: [
                                {
                                  id: 1,
                                  name: "Criteria",
                                  weight: 100,
                                  description: "",
                                },
                              ],
                            },
                          },
                        ])
                      }
                      className="px-5 py-2.5 bg-emerald-50 text-emerald-600 text-xs font-extrabold rounded-xl flex items-center gap-2 hover:bg-emerald-100 transition-all"
                    >
                      <Plus size={16} strokeWidth={3} /> Add Round
                    </button>
                  </div>

                  <div className="space-y-6">
                    {dynamicRounds.map((round, index) => (
                      <div
                        key={round.id}
                        className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 relative group"
                      >
                        {index > 0 && (
                          <button
                            onClick={() =>
                              setDynamicRounds(
                                dynamicRounds.filter((r) => r.id !== round.id),
                              )
                            }
                            className="absolute top-6 right-6 text-slate-300 hover:text-red-500 p-2 rounded-xl transition-colors bg-white shadow-sm border border-slate-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        <div className="w-2/3 mb-5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                            Round Name
                          </label>
                          <input
                            type="text"
                            value={round.roundName}
                            onChange={(e) =>
                              setDynamicRounds(
                                dynamicRounds.map((r) =>
                                  r.id === round.id
                                    ? { ...r, roundName: e.target.value }
                                    : r,
                                ),
                              )
                            }
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-extrabold text-[#0a192f] outline-none focus:border-blue-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-5 mb-5">
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                              Start Date
                            </label>
                            <input
                              type="datetime-local"
                              value={round.startDate}
                              onChange={(e) =>
                                setDynamicRounds(
                                  dynamicRounds.map((r) =>
                                    r.id === round.id
                                      ? { ...r, startDate: e.target.value }
                                      : r,
                                  ),
                                )
                              }
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                              End Date
                            </label>
                            <input
                              type="datetime-local"
                              value={round.endDate}
                              onChange={(e) =>
                                setDynamicRounds(
                                  dynamicRounds.map((r) =>
                                    r.id === round.id
                                      ? { ...r, endDate: e.target.value }
                                      : r,
                                  ),
                                )
                              }
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5 border-t border-slate-200 pt-5">
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                              Max Teams
                            </label>
                            <input
                              type="number"
                              value={round.maxTeam}
                              onChange={(e) =>
                                setDynamicRounds(
                                  dynamicRounds.map((r) =>
                                    r.id === round.id
                                      ? {
                                          ...r,
                                          maxTeam: Number(e.target.value),
                                        }
                                      : r,
                                  ),
                                )
                              }
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-extrabold outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                              Advance Top N
                            </label>
                            <input
                              type="number"
                              value={round.topAdvance}
                              onChange={(e) =>
                                setDynamicRounds(
                                  dynamicRounds.map((r) =>
                                    r.id === round.id
                                      ? {
                                          ...r,
                                          topAdvance: Number(e.target.value),
                                        }
                                      : r,
                                  ),
                                )
                              }
                              className="w-full px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-extrabold outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-8 mt-8 border-t border-slate-100">
                    <button
                      onClick={handleContinueToRubrics}
                      className="px-8 py-3.5 bg-[#0a192f] text-white text-sm font-bold rounded-2xl shadow-lg flex items-center gap-2"
                    >
                      Continue to Rubrics{" "}
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: RUBRICS (HIỂN THỊ TỰ ĐỘNG THEO SỐ ROUNDS) */}
            {activeTab === 4 && (
              <div className="space-y-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-extrabold text-[#0a192f] mb-2">
                    Grading Rubrics
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">
                    Please configure or select a rubric set for each round.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {dynamicRounds.map((round) => (
                    <div
                      key={round.id}
                      className="border border-slate-200 rounded-[2rem] p-1 bg-slate-50/50 shadow-sm flex flex-col"
                    >
                      <div className="flex items-center justify-between px-6 py-4">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Target Round
                          </span>
                          <h4 className="font-extrabold text-[#0a192f] text-base">
                            {round.roundName}
                          </h4>
                        </div>
                        <div className="flex bg-slate-200/60 p-1 rounded-xl">
                          <button
                            onClick={() =>
                              setDynamicRounds(
                                dynamicRounds.map((r) =>
                                  r.id === round.id
                                    ? { ...r, rubricMode: "new" }
                                    : r,
                                ),
                              )
                            }
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${round.rubricMode === "new" ? "bg-white text-[#0a192f] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                          >
                            New
                          </button>
                          <button
                            onClick={() =>
                              setDynamicRounds(
                                dynamicRounds.map((r) =>
                                  r.id === round.id
                                    ? { ...r, rubricMode: "reuse" }
                                    : r,
                                ),
                              )
                            }
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${round.rubricMode === "reuse" ? "bg-white text-[#0a192f] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                          >
                            Reuse
                          </button>
                        </div>
                      </div>

                      {round.rubricMode === "new" ? (
                        <div className="flex-1">
                          <RubricPanel
                            title="Custom Set"
                            setName={round.rubric.setName}
                            onSetNameChange={(name) =>
                              setDynamicRounds(
                                dynamicRounds.map((r) =>
                                  r.id === round.id
                                    ? {
                                        ...r,
                                        rubric: { ...r.rubric, setName: name },
                                      }
                                    : r,
                                ),
                              )
                            }
                            items={round.rubric.items}
                            onChange={(items) =>
                              setDynamicRounds(
                                dynamicRounds.map((r) =>
                                  r.id === round.id
                                    ? { ...r, rubric: { ...r.rubric, items } }
                                    : r,
                                ),
                              )
                            }
                          />
                        </div>
                      ) : (
                        <div className="flex-1 p-8 bg-white rounded-b-[2rem] border-t border-slate-100 flex flex-col justify-center">
                          {loadingSets ? (
                            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-sm">
                              <Loader2 size={18} className="animate-spin" />{" "}
                              Loading archive...
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                Select Existing Set
                              </label>
                              <select
                                value={round.reuseSetId}
                                onChange={(e) =>
                                  setDynamicRounds(
                                    dynamicRounds.map((r) =>
                                      r.id === round.id
                                        ? { ...r, reuseSetId: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-400"
                              >
                                <option value="" disabled>
                                  -- Choose a Rubric Set --
                                </option>
                                {availableSets.map((s) => (
                                  <option key={s.setId} value={s.setId}>
                                    {s.setName}
                                  </option>
                                ))}
                              </select>

                              {/* UI THÊM MỚI: HIỂN THỊ CHI TIẾT CÁC TIÊU CHÍ BÊN DƯỚI DROPDOWN */}
                              {round.reuseSetId &&
                                availableSets.find(
                                  (s) =>
                                    String(s.setId) ===
                                    String(round.reuseSetId),
                                ) && (
                                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                                    {availableSets
                                      .find(
                                        (s) =>
                                          String(s.setId) ===
                                          String(round.reuseSetId),
                                      )
                                      ?.items.map((it: any, i: number) => (
                                        <div
                                          key={i}
                                          className="p-4 bg-slate-50 border border-slate-100 rounded-xl shadow-sm"
                                        >
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-slate-800 text-sm">
                                              {it.name}
                                            </span>
                                            <span className="font-extrabold text-[#0a192f] bg-slate-200 px-2 py-0.5 rounded-md text-xs">
                                              {it.score}%
                                            </span>
                                          </div>
                                          {it.description && (
                                            <p className="text-xs text-slate-500 font-medium">
                                              {it.description}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-8 mt-8 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab(3)}
                    className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-50"
                  >
                    ← Back to Rounds
                  </button>
                  <button
                    onClick={handlePublishAll}
                    disabled={isPublishing}
                    className="px-8 py-3.5 bg-emerald-600 text-white text-sm font-extrabold rounded-2xl shadow-lg flex items-center gap-2"
                  >
                    {isPublishing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                    )}
                    {isPublishing ? "Initializing..." : "Publish Event"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
