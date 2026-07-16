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

interface RubricItem {
  id: number;
  name: string;
  description: string;
  weight: number;
}

function RubricPanel({
  title,
  items,
  onChange,
}: {
  title: string;
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
      <h4 className="font-extrabold text-[#0a192f] text-lg mb-5 pb-3 border-b border-slate-100/60">
        {title}
      </h4>
      <div className="space-y-4">
        {items.map((r) => (
          <div
            key={r.id}
            className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3 transition-all hover:bg-slate-50"
          >
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={r.name}
                onChange={(e) => updateItem(r.id, { name: e.target.value })}
                className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="Criteria Name (e.g., Innovation)"
              />
              <div className="relative w-24">
                <input
                  type="number"
                  value={r.weight}
                  onChange={(e) =>
                    updateItem(r.id, { weight: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 pr-6 text-sm text-center bg-white border border-slate-200 rounded-xl font-bold text-[#0a192f] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-bold">
                  %
                </span>
              </div>
              <button
                onClick={() => removeItem(r.id)}
                className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Remove Criteria"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <input
              type="text"
              value={r.description}
              onChange={(e) =>
                updateItem(r.id, { description: e.target.value })
              }
              className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none text-slate-500 font-medium focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
              placeholder="Description or grading guide (optional)"
            />
          </div>
        ))}
        <button
          onClick={addItem}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} /> Add Criteria
        </button>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center font-bold text-sm">
        <span className="text-slate-500">Total Weight:</span>
        <span
          className={`px-4 py-1.5 rounded-xl ${isValid ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
        >
          {total}%
        </span>
      </div>
      {!isValid && (
        <p className="text-[11px] text-red-500 mt-2 flex items-center gap-1.5 font-medium">
          <AlertCircle size={14} /> Total weight must be exactly 100% to save.
        </p>
      )}
    </div>
  );
}

export function CreateEvents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);

  const [savedEventId, setSavedEventId] = useState<string | null>(null);
  const [savedPrelimSetId, setSavedPrelimSetId] = useState<string | null>(null);
  const [savedFinalSetId, setSavedFinalSetId] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState({
    eventName: "",
    season: "Fall",
    year: 2026,
  });

  const [tracks, setTracks] = useState<any[]>([
    { id: 1, name: "", topics: [] },
  ]);
  const [topicInputs, setTopicInputs] = useState<{ [key: number]: string }>({});

  const [rubrics, setRubrics] = useState<{
    prelim: RubricItem[];
    final: RubricItem[];
  }>({
    prelim: [
      { id: 1, name: "Innovation & Creativity", description: "", weight: 50 },
      { id: 2, name: "Practicality", description: "", weight: 50 },
    ],
    final: [
      { id: 3, name: "Overall Completeness", description: "", weight: 100 },
    ],
  });
  const [isSavingRubrics, setIsSavingRubrics] = useState(false);

  const [rubricMode, setRubricMode] = useState<"new" | "reuse">("new");
  const [availableSets, setAvailableSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadSetsError, setLoadSetsError] = useState<string | null>(null);
  const [reusePrelimSetId, setReusePrelimSetId] = useState<string>("");
  const [reuseFinalSetId, setReuseFinalSetId] = useState<string>("");

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
          setName: s.setName || s.SetName || "Rubric Set",
        }))
        .filter((s): s is { setId: string; setName: string } => !!s.setId);

      const enriched = await loadSetsWithItems(baseSets, critMap, (setId) =>
        criteriaApi.getSetById(setId),
      );
      setAvailableSets(enriched);
    } catch (e) {
      setLoadSetsError("Failed to load existing rubric sets.");
      Swal.fire("Error", "Failed to load existing rubric sets.", "error");
    } finally {
      setLoadingSets(false);
    }
  };

  const switchRubricMode = (mode: "new" | "reuse") => {
    setRubricMode(mode);
    if (mode === "reuse" && availableSets.length === 0) loadAvailableSets();
  };

  const [rounds, setRounds] = useState({
    prelim: { startDate: "", endDate: "", maxTeams: 40, topAdvance: 10 },
    final: { endDate: "" },
  });
  const [isSavingRounds, setIsSavingRounds] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingTracks, setIsSavingTracks] = useState(false);

  // ===================== SAVE LOGIC =====================
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
      };

      if (savedEventId) {
        try {
          await eventApi.updateEvent(savedEventId, payload);
        } catch (e) {}
      } else {
        try {
          const res: any = await eventApi.createEvent(payload as any);
          let eventId = extractId(res);
          if (!eventId) throw new Error("No ID");
          setSavedEventId(eventId);
        } catch (error) {
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
        title: "Success!",
        showConfirmButton: false,
        timer: 1000,
      });
      setActiveTab(2);
    } catch (error) {
      Swal.fire("Error", "Failed to save event information!", "error");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleSaveTracks = async () => {
    if (!savedEventId)
      return Swal.fire(
        "Error",
        "Please save the event on Tab 1 first!",
        "error",
      );

    setIsSavingTracks(true);
    try {
      Swal.fire({
        title: "Syncing Tracks...",
        didOpen: () => Swal.showLoading(),
      });
      const topicFails: string[] = [];
      const allTracksRaw = await trackTopicApi.getAllTracks();
      const existingTracks = getList(allTracksRaw).filter(
        (t) => String(t.eventId || t.eventID) === String(savedEventId),
      );

      for (const track of tracks) {
        if (!track.name.trim()) continue;

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
          } catch (e) {}
        } else {
          try {
            const trackRes: any = await trackTopicApi.createTrack({
              eventId: savedEventId,
              trackName: track.name.trim(),
            } as any);
            currentTrackId = pickTrackId(trackRes);
          } catch (e: any) {}
        }

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

        if (!currentTrackId || String(currentTrackId) === String(savedEventId))
          continue;

        let existingTopics: any[] = [];
        try {
          existingTopics = getList(await trackTopicApi.getAllTopics()).filter(
            (t) => String(t.trackID || t.trackId) === String(currentTrackId),
          );
        } catch (e) {}

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
            topicFails.push(`"${name}"`);
          }
        }
      }

      if (topicFails.length > 0) {
        Swal.fire(
          "Warning",
          `Failed to create some topics (might already exist):<br><br>` +
            topicFails.join("<br>"),
          "warning",
        );
      } else {
        Swal.fire({
          icon: "success",
          title: "Tracks Saved!",
          showConfirmButton: false,
          timer: 1000,
        });
      }
      setActiveTab(3);
    } catch (error) {
      Swal.fire("Error", "Error saving tracks!", "error");
    } finally {
      setIsSavingTracks(false);
    }
  };

  const handleSaveRubrics = async () => {
    if (rubricMode === "reuse") {
      if (!reusePrelimSetId || !reuseFinalSetId)
        return Swal.fire(
          "Required",
          "Please select a rubric set for both Prelim and Final rounds!",
          "warning",
        );

      const prelimSet = availableSets.find(
        (s) => String(s.setId) === String(reusePrelimSetId),
      );
      const finalSet = availableSets.find(
        (s) => String(s.setId) === String(reuseFinalSetId),
      );
      const prelimTotal = sumWeight(prelimSet?.items || []);
      const finalTotal = sumWeight(finalSet?.items || []);

      if (prelimTotal !== 100 || finalTotal !== 100)
        return Swal.fire(
          "Invalid Weight",
          `Prelim total is ${prelimTotal}% and Final total is ${finalTotal}%. Must be exactly 100%.`,
          "error",
        );
    } else {
      if (
        rubrics.prelim.some((r) => !r.name.trim()) ||
        rubrics.final.some((r) => !r.name.trim())
      )
        return Swal.fire(
          "Required",
          "Please enter names for all criteria!",
          "warning",
        );
      const prelimTotal = sumWeight(rubrics.prelim);
      const finalTotal = sumWeight(rubrics.final);
      if (prelimTotal !== 100 || finalTotal !== 100)
        return Swal.fire(
          "Invalid Weight",
          `Prelim total is ${prelimTotal}% and Final total is ${finalTotal}%. Must be exactly 100%.`,
          "error",
        );
    }

    setIsSavingRubrics(true);
    try {
      Swal.fire({
        title: "Saving Rubrics...",
        didOpen: () => Swal.showLoading(),
      });

      const syncSet = async (
        rubricList: RubricItem[],
        setName: string,
        existingSetId: string | null,
      ) => {
        const criteriaMap = await Promise.all(
          rubricList.map(async (r) => {
            let cId = null;
            const description =
              r.description.trim() || DEFAULT_CRITERIA_DESCRIPTION;
            try {
              const res = await criteriaApi.createCriterion({
                criteriaName: r.name.trim(),
                description,
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
              if (cId) {
                try {
                  await criteriaApi.updateCriterion(cId, {
                    criteriaID: cId,
                    criteriaId: cId,
                    criteriaName: r.name.trim(),
                    description,
                  } as any);
                } catch (e) {}
              }
            }
            return {
              criteriaId: cId,
              CriteriaId: cId,
              score: Number(r.weight),
              Score: Number(r.weight),
            };
          }),
        );

        const payload = {
          setName: setName,
          isDefault: true,
          criteriaList: criteriaMap,
          CriteriaList: criteriaMap,
        };
        let setId = existingSetId;

        if (setId) {
          try {
            await criteriaApi.updateSet(setId, payload as any);
          } catch (e) {}
        } else {
          try {
            const res = await criteriaApi.createSet(payload as any);
            setId = extractId(res);
          } catch (e) {}
          if (!setId) {
            const allS = getList(await criteriaApi.getAllSet());
            const foundSet = [...allS]
              .reverse()
              .find(
                (s: any) =>
                  (s.setName || s.name || "").trim().toLowerCase() ===
                  setName.toLowerCase(),
              );
            setId = extractId(foundSet);
          }
        }
        return setId;
      };

      let pId: string | null;
      let fId: string | null;
      if (rubricMode === "reuse") {
        pId = reusePrelimSetId;
        fId = reuseFinalSetId;
      } else {
        pId = await syncSet(
          rubrics.prelim,
          `${eventForm.eventName} - Prelim Set`,
          savedPrelimSetId,
        );
        fId = await syncSet(
          rubrics.final,
          `${eventForm.eventName} - Final Set`,
          savedFinalSetId,
        );
      }

      setSavedPrelimSetId(pId);
      setSavedFinalSetId(fId);

      Swal.fire({
        icon: "success",
        title: "Rubrics Saved!",
        showConfirmButton: false,
        timer: 1000,
      });
      setActiveTab(4);
    } catch (error) {
      Swal.fire("Error", "Failed to save Rubrics!", "error");
    } finally {
      setIsSavingRubrics(false);
    }
  };

  const handleSaveRounds = async () => {
    if (!savedEventId || !savedPrelimSetId || !savedFinalSetId)
      return Swal.fire(
        "Error",
        "Please complete all previous tabs first!",
        "error",
      );
    if (
      !rounds.prelim.startDate ||
      !rounds.prelim.endDate ||
      !rounds.final.endDate
    )
      return Swal.fire(
        "Required",
        "Please fill in all date and time fields!",
        "warning",
      );

    const dStart = new Date(rounds.prelim.startDate);
    const dPrelimEnd = new Date(rounds.prelim.endDate);
    const dFinalEnd = new Date(rounds.final.endDate);

    if (
      isNaN(dStart.getTime()) ||
      isNaN(dPrelimEnd.getTime()) ||
      isNaN(dFinalEnd.getTime())
    )
      return Swal.fire("Invalid", "Date/Time is invalid.", "warning");
    if (dPrelimEnd <= dStart)
      return Swal.fire(
        "Timeline Error",
        "Prelim End Date must be after Prelim Start Date.",
        "warning",
      );
    if (dFinalEnd <= dPrelimEnd)
      return Swal.fire(
        "Timeline Error",
        "Final End Date must be after Prelim End Date.",
        "warning",
      );

    setIsSavingRounds(true);
    try {
      Swal.fire({ title: "Finalizing...", didOpen: () => Swal.showLoading() });
      const toIso = (dateStr: string) => new Date(dateStr).toISOString();

      const prelimPayload = {
        eventID: savedEventId,
        roundName: "Preliminary Round",
        startDate: toIso(rounds.prelim.startDate),
        endDate: toIso(rounds.prelim.endDate),
        topNPromotion: Number(rounds.prelim.topAdvance),
        maxTeam: Number(rounds.prelim.maxTeams),
        roundIndex: 0,
        criteriaSetID: savedPrelimSetId,
      };
      const finalPayload = {
        eventID: savedEventId,
        roundName: "Final Round",
        startDate: toIso(rounds.prelim.endDate),
        endDate: toIso(rounds.final.endDate),
        topNPromotion: 1,
        maxTeam: Number(rounds.prelim.topAdvance),
        roundIndex: 1,
        criteriaSetID: savedFinalSetId,
      };

      await roundApi.createRound(prelimPayload as any);
      await roundApi.createRound(finalPayload as any);

      Swal.fire({
        icon: "success",
        title: "All Set!",
        text: "The event has been successfully initialized and published.",
        confirmButtonColor: "#0a192f",
        customClass: { confirmButton: "rounded-xl font-bold px-6 py-2.5" },
      }).then(() => navigate("/admin/events"));
    } catch (error: any) {
      Swal.fire(
        "Error",
        "Server rejected the timeline configuration.",
        "error",
      );
    } finally {
      setIsSavingRounds(false);
    }
  };

  // ===================== RENDER =====================
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
            className="px-6 py-3.5 bg-white border border-slate-200 text-sm font-bold rounded-2xl hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
          >
            Cancel & Return
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[600px] flex flex-col">
          {/* TABS MENU */}
          <div className="flex border-b border-slate-100 px-4 bg-slate-50/50 pt-2">
            {[
              { id: 1, name: "1. Event Info", isSaved: !!savedEventId },
              { id: 2, name: "2. Tracks & Topics", isSaved: false },
              { id: 3, name: "3. Rubrics", isSaved: !!savedPrelimSetId },
              { id: 4, name: "4. Tournament Rounds", isSaved: false },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.id > 1 && !savedEventId}
                className={`flex-1 px-4 py-4 text-sm font-extrabold border-b-[3px] transition-all flex items-center justify-center gap-2
                  ${
                    activeTab === tab.id
                      ? "border-[#0a192f] text-[#0a192f] bg-white rounded-t-2xl"
                      : tab.isSaved
                        ? "border-transparent text-emerald-600 hover:bg-white rounded-t-2xl"
                        : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white rounded-t-2xl"
                  }`}
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
            {/* TAB 1: EVENT INFO */}
            {activeTab === 1 && (
              <div className="space-y-8 max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">
                    Basic Configuration
                  </h3>
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
                        placeholder="e.g., SEAL Hackathon Fall 2026..."
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
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
                          className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none cursor-pointer appearance-none"
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
                          className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-8 mt-8 border-t border-slate-100">
                    <button
                      onClick={handleSaveEvent}
                      disabled={isSavingEvent}
                      className="px-8 py-3.5 bg-[#0a192f] text-white text-sm font-bold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingEvent ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} strokeWidth={2.5} />
                      )}
                      {isSavingEvent ? "Saving..." : "Save & Continue"}
                      {!isSavingEvent && (
                        <ArrowRight size={18} strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TRACKS */}
            {activeTab === 2 && (
              <div className="space-y-8 max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-white p-2">
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
                    className="px-5 py-2.5 bg-blue-50 text-blue-600 text-xs font-extrabold rounded-xl flex items-center gap-2 hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={16} strokeWidth={3} /> Add Track
                  </button>
                </div>

                <div className="space-y-6">
                  {tracks.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative group transition-all hover:border-blue-100"
                    >
                      <button
                        onClick={() =>
                          setTracks(tracks.filter((tr) => tr.id !== t.id))
                        }
                        className="absolute top-6 right-6 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
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
                          className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-base font-bold text-[#0a192f] focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                          placeholder="e.g., Web App, AI/ML, IoT..."
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
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm"
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
                                className="text-slate-400 hover:text-red-500 transition-colors"
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
                          placeholder="Type a topic and press Enter..."
                          className="w-full px-5 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-8 mt-8 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab(1)}
                    className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSaveTracks}
                    disabled={isSavingTracks}
                    className="px-8 py-3.5 bg-[#0a192f] text-white text-sm font-bold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingTracks ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} strokeWidth={2.5} />
                    )}
                    {isSavingTracks ? "Saving..." : "Save Tracks & Continue"}
                    {!isSavingTracks && (
                      <ArrowRight size={18} strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: RUBRICS */}
            {activeTab === 3 && (
              <div className="space-y-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-extrabold text-[#0a192f] mb-4">
                    Grading Rubrics
                  </h3>

                  <div className="inline-flex bg-slate-100 p-1 rounded-2xl">
                    <button
                      onClick={() => switchRubricMode("new")}
                      className={`px-6 py-2.5 text-sm font-extrabold rounded-xl transition-all ${
                        rubricMode === "new"
                          ? "bg-white text-[#0a192f] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Create New Sets
                    </button>
                    <button
                      onClick={() => switchRubricMode("reuse")}
                      className={`px-6 py-2.5 text-sm font-extrabold rounded-xl transition-all ${
                        rubricMode === "reuse"
                          ? "bg-white text-[#0a192f] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Use Existing Sets
                    </button>
                  </div>
                </div>

                {rubricMode === "new" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <RubricPanel
                      title="Preliminary Round"
                      items={rubrics.prelim}
                      onChange={(items) =>
                        setRubrics((prev) => ({ ...prev, prelim: items }))
                      }
                    />
                    <RubricPanel
                      title="Final Round"
                      items={rubrics.final}
                      onChange={(items) =>
                        setRubrics((prev) => ({ ...prev, final: items }))
                      }
                    />
                  </div>
                )}

                {rubricMode === "reuse" && (
                  <div className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    {loadingSets && (
                      <div className="flex items-center justify-center gap-3 py-16 text-sm font-bold text-slate-400 uppercase tracking-widest">
                        <Loader2
                          size={20}
                          className="animate-spin text-[#0a192f]"
                        />
                        Loading Rubric Archive...
                      </div>
                    )}

                    {!loadingSets && loadSetsError && (
                      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                        <AlertCircle
                          size={32}
                          className="text-red-400"
                          strokeWidth={1.5}
                        />
                        <p className="text-sm text-red-500 font-bold">
                          {loadSetsError}
                        </p>
                        <button
                          onClick={loadAvailableSets}
                          className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          <RefreshCw size={14} className="inline mr-2" /> Try
                          Again
                        </button>
                      </div>
                    )}

                    {!loadingSets &&
                      !loadSetsError &&
                      availableSets.length === 0 && (
                        <div className="text-center py-16">
                          <p className="text-base text-slate-400 font-medium">
                            No existing rubrics found in the database. Please
                            create new ones.
                          </p>
                        </div>
                      )}

                    {!loadingSets &&
                      !loadSetsError &&
                      availableSets.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {(["prelim", "final"] as const).map((slot) => {
                            const isPrelim = slot === "prelim";
                            const selectedId = isPrelim
                              ? reusePrelimSetId
                              : reuseFinalSetId;
                            const setSel = isPrelim
                              ? setReusePrelimSetId
                              : setReuseFinalSetId;
                            const picked = availableSets.find(
                              (s) => String(s.setId) === String(selectedId),
                            );
                            const pickedTotal = picked
                              ? sumWeight(picked.items)
                              : 0;

                            return (
                              <div
                                key={slot}
                                className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6"
                              >
                                <h4 className="font-extrabold text-[#0a192f] mb-4">
                                  {isPrelim
                                    ? "Preliminary Round"
                                    : "Final Round"}
                                </h4>
                                <select
                                  value={selectedId}
                                  onChange={(e) => setSel(e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
                                >
                                  <option value="">
                                    -- Select a rubric set --
                                  </option>
                                  {availableSets.map((s) => (
                                    <option key={s.setId} value={s.setId}>
                                      {s.setName}
                                    </option>
                                  ))}
                                </select>

                                {picked && (
                                  <div className="mt-6">
                                    <div className="space-y-3">
                                      {picked.items.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">
                                          This set is empty.
                                        </p>
                                      ) : (
                                        picked.items.map(
                                          (it: any, i: number) => (
                                            <div
                                              key={it.criteriaId || i}
                                              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm"
                                            >
                                              <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-slate-800 text-sm">
                                                  {it.name}
                                                </span>
                                                <span className="font-extrabold text-[#0a192f] bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                                                  {it.score}%
                                                </span>
                                              </div>
                                              {it.description && (
                                                <p className="text-xs text-slate-500 font-medium">
                                                  {it.description}
                                                </p>
                                              )}
                                            </div>
                                          ),
                                        )
                                      )}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between font-bold text-sm">
                                      <span className="text-slate-500">
                                        Total Weight:
                                      </span>
                                      <span
                                        className={
                                          pickedTotal === 100
                                            ? "text-emerald-600"
                                            : "text-red-500"
                                        }
                                      >
                                        {pickedTotal}%
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                )}

                <div className="flex justify-between pt-8 mt-8 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab(2)}
                    className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSaveRubrics}
                    disabled={isSavingRubrics}
                    className="px-8 py-3.5 bg-[#0a192f] text-white text-sm font-bold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingRubrics ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} strokeWidth={2.5} />
                    )}
                    {isSavingRubrics ? "Saving..." : "Save Rubrics & Continue"}
                    {!isSavingRubrics && (
                      <ArrowRight size={18} strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: ROUNDS */}
            {activeTab === 4 && (
              <div className="space-y-8 max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-8 text-center">
                    Tournament Timeline Configuration
                  </h3>

                  <div className="space-y-8">
                    {/* PRELIM */}
                    <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6">
                      <h4 className="font-extrabold text-[#0a192f] text-lg mb-5 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>{" "}
                        Round 0: Preliminary
                      </h4>
                      <div className="grid grid-cols-2 gap-5 mb-5">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Opening Time
                          </label>
                          <input
                            type="datetime-local"
                            value={rounds.prelim.startDate}
                            onChange={(e) =>
                              setRounds({
                                ...rounds,
                                prelim: {
                                  ...rounds.prelim,
                                  startDate: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Closing Time
                          </label>
                          <input
                            type="datetime-local"
                            value={rounds.prelim.endDate}
                            onChange={(e) =>
                              setRounds({
                                ...rounds,
                                prelim: {
                                  ...rounds.prelim,
                                  endDate: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-5 border-t border-slate-200 pt-5">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Max Teams Limit
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={rounds.prelim.maxTeams}
                            onChange={(e) =>
                              setRounds({
                                ...rounds,
                                prelim: {
                                  ...rounds.prelim,
                                  maxTeams: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-extrabold text-[#0a192f] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Advance Top N to Final
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={rounds.prelim.topAdvance}
                            onChange={(e) =>
                              setRounds({
                                ...rounds,
                                prelim: {
                                  ...rounds.prelim,
                                  topAdvance: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-extrabold text-blue-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* FINAL */}
                    <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6">
                      <h4 className="font-extrabold text-[#0a192f] text-lg mb-2 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>{" "}
                        Round 1: Final
                      </h4>
                      <p className="text-xs font-medium text-slate-500 mb-5 leading-relaxed">
                        The Final round automatically begins right after the
                        Preliminary round closes, inheriting the Top{" "}
                        {rounds.prelim.topAdvance} teams.
                      </p>
                      <div className="space-y-2 w-1/2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          Final Closing Time
                        </label>
                        <input
                          type="datetime-local"
                          value={rounds.final.endDate}
                          onChange={(e) =>
                            setRounds({
                              ...rounds,
                              final: {
                                ...rounds.final,
                                endDate: e.target.value,
                              },
                            })
                          }
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-8 mt-8 border-t border-slate-100">
                    <button
                      onClick={() => setActiveTab(3)}
                      className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleSaveRounds}
                      disabled={isSavingRounds}
                      className="px-8 py-3.5 bg-emerald-600 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingRounds ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      )}
                      {isSavingRounds ? "Initializing..." : "Publish Event"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
