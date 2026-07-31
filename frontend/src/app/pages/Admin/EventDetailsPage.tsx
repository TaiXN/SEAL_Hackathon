import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Edit3,
  Lock,
  FastForward,
  Trash2,
  RotateCcw,
  Pencil,
  ListChecks,
  Scale,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trophy,
  Medal,
  Users,
  Plus,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";
import apiClient from "../../lib/api/apiClient";
import { eventApi } from "../../lib/api/eventApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { criteriaApi } from "../../lib/api/criteriaApi";
import { roundApi } from "../../lib/api/roundApi";
import { leaderboardApi } from "../../lib/api/leaderboardApi";

import {
  extractSetList,
  itemCriteriaId,
  itemScore,
  getServerMsg,
  sumWeight,
  DEFAULT_CRITERIA_DESCRIPTION,
  getList,
  grabSetId,
} from "../../lib/utils/criteriaHelpers";

const isInactiveRecord = (obj: any): boolean => {
  if (!obj) return false;
  if (
    obj.isDeleted === true ||
    obj.IsDeleted === true ||
    obj.deleted === true ||
    obj.Deleted === true
  )
    return true;
  if (
    obj.isActive === false ||
    obj.IsActive === false ||
    obj.status === false ||
    obj.Status === false
  )
    return true;
  const statusStr = String(obj.status ?? obj.Status ?? "").toLowerCase();
  if (statusStr === "deleted" || statusStr === "inactive") return true;
  return false;
};

const isNotFoundError = (e: any): boolean => {
  if (e?.response?.status === 404) return true;
  const msg = getServerMsg(e).toLowerCase();
  return msg.includes("not found") || msg.includes("không tìm thấy");
};

// Chuyển ISO string (UTC) sang định dạng cho input datetime-local (giờ local)
const toDatetimeLocalValue = (isoStr: string): string => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Định dạng ngày giờ để hiển thị đẹp trên UI (dd/mm/yyyy hh:mm)
const formatDisplayDateTime = (isoStr: string): string => {
  if (!isoStr) return "N/A";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "N/A";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function EventDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tracks, setTracks] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [criteriaSets, setCriteriaSets] = useState<any[]>([]);
  const [deletedCriteria, setDeletedCriteria] = useState<any[]>([]);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const deletedSetIdsRef = useRef<Set<string>>(new Set());

  const [eventRounds, setEventRounds] = useState<any[]>([]);

  // State cho Bảng xếp hạng Đội thi
  const [roundTeams, setRoundTeams] = useState<any[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        if (id) {
          const eventData = await eventApi.getEventById(id);
          setEvent(eventData);

          const allTracks = await trackTopicApi.getAllTracks();
          const allTopics = await trackTopicApi.getAllTopics();

          const eventTracks = allTracks
            .filter(
              (t: any) =>
                String(t.eventId || t.eventID) === String(id) &&
                !isInactiveRecord(t),
            )
            .map((t: any) => ({
              ...t,
              topics: allTopics.filter(
                (top: any) =>
                  String(top.trackID || top.trackId) ===
                    String(t.trackID || t.trackId) && !isInactiveRecord(top),
              ),
            }));
          setTracks(eventTracks);
        }
      } catch (error) {
        setLoadError(
          "Unable to load event details from the server. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchEventDetails();
  }, [id, reloadKey]);

  // ====================================================
  // TẢI BẢNG XẾP HẠNG GỘP (LEADERBOARD + TEAM IN ROUND)
  // ====================================================
  useEffect(() => {
    const loadTeamsAndScores = async () => {
      if (!event || eventRounds.length === 0) return;

      const curRoundIndex = Number(event.currentRound);
      let targetRoundIndex = curRoundIndex;

      // NẾU SỰ KIỆN ĐÃ KẾT THÚC -> LUÔN HIỂN THỊ BẢNG ĐIỂM CỦA VÒNG CUỐI CÙNG
      if (curRoundIndex >= eventRounds.length) {
        targetRoundIndex = eventRounds.length - 1;
      }

      if (targetRoundIndex < 0) return;

      const currentRoundObj = eventRounds[targetRoundIndex];
      const roundId =
        currentRoundObj.roundID ||
        currentRoundObj.roundId ||
        currentRoundObj.id;

      setIsLoadingTeams(true);
      try {
        const res = await apiClient.get(
          `/api/TeamInRound/details/round/${roundId}`,
        );
        const teams = getList(res.data);

        const trackIds = Array.from(
          new Set(
            teams
              .map((t) => String(t.trackId || t.trackID))
              .filter((id) => id && id !== "undefined"),
          ),
        );

        const leaderboards = await Promise.all(
          trackIds.map((tid) =>
            leaderboardApi
              .getLeaderboardByRoundAndTrack(roundId, tid)
              .catch(() => []),
          ),
        );

        const allScores = leaderboards.flat();

        const enrichedTeams = teams.map((t: any) => {
          const scoreData = allScores.find((s: any) => {
            // Ép kiểu chuẩn và tách riêng từng loại ID ra so sánh
            const sInRoundId = String(
              s.teamInRoundId || s.teamInRoundID || s.id || "",
            ).toLowerCase();
            const tInRoundId = String(
              t.teamInRoundId || t.teamInRoundID || t.id || "",
            ).toLowerCase();

            const sTeamId = String(s.teamId || s.teamID || "").toLowerCase();
            const tTeamId = String(t.teamId || t.teamID || "").toLowerCase();

            // Khớp đúng loại ID với nhau, không khớp chéo
            const matchInRoundId =
              sInRoundId &&
              sInRoundId !== "undefined" &&
              sInRoundId === tInRoundId;
            const matchTeamId =
              sTeamId && sTeamId !== "undefined" && sTeamId === tTeamId;
            const matchName =
              s.teamName && s.teamName === (t.teamName || t.name); // Cứu cánh cuối cùng

            return matchInRoundId || matchTeamId || matchName;
          });

          return {
            ...t,
            score: Number(t.score ?? scoreData?.score ?? 0),
          };
        });

        enrichedTeams.sort((a, b) => b.score - a.score);
        setRoundTeams(enrichedTeams);
      } catch (error) {
        console.error("Error fetching teams and scores", error);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    loadTeamsAndScores();
  }, [event, eventRounds, reloadKey]);

  // --- HANDLER XỬ LÝ ROUND ---
  const handleEditRound = async (round: any) => {
    const startVal = toDatetimeLocalValue(round.startDate || round.StartDate);
    const endVal = toDatetimeLocalValue(round.endDate || round.EndDate);

    const { value: formValues } = await Swal.fire({
      title: "Edit Round Details",
      html: `
        <div style="text-align: left;">
          <label style="font-size: 11px; font-weight: bold; color: #64748b;">ROUND NAME</label>
          <input id="sw-rname" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${round.roundName}">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 15px; display:block;">TOP N PROMOTION</label>
          <input id="sw-topn" type="number" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${round.topNPromotion ?? round.TopNPromotion ?? 0}">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 15px; display:block;">START DATE &amp; TIME</label>
          <input id="sw-start" type="datetime-local" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${startVal}">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 15px; display:block;">END DATE &amp; TIME</label>
          <input id="sw-end" type="datetime-local" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${endVal}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      preConfirm: () => {
        const startInput = (
          document.getElementById("sw-start") as HTMLInputElement
        ).value;
        const endInput = (
          document.getElementById("sw-end") as HTMLInputElement
        ).value;

        if (!startInput || !endInput) {
          Swal.showValidationMessage("Please select both start and end date/time");
          return false;
        }
        if (new Date(endInput) <= new Date(startInput)) {
          Swal.showValidationMessage("End date/time must be after start date/time");
          return false;
        }

        return {
          roundName: (document.getElementById("sw-rname") as HTMLInputElement)
            .value,
          topNPromotion: Number(
            (document.getElementById("sw-topn") as HTMLInputElement).value,
          ),
          startDate: new Date(startInput).toISOString(),
          endDate: new Date(endInput).toISOString(),
        };
      },
    });

    if (formValues) {
      try {
        const roundId = round.roundID || round.roundId || round.id;
        await apiClient.put(`/api/Round`, {
          roundID: roundId,
          eventID: id,
          roundName: formValues.roundName,
          topNPromotion: formValues.topNPromotion,
          maxTeam: round.maxTeam || 0,
          roundIndex: round.roundIndex ?? round.RoundIndex,
          startDate: formValues.startDate,
          endDate: formValues.endDate,
          criteriaSetID: round.criteriaSetID || round.criteriaSetId,
        });

        Swal.fire({
          icon: "success",
          title: "Updated!",
          timer: 1200,
          showConfirmButton: false,
        });
        // Gọi lại hàm loadCriteria() để refetch lại data hiển thị (vì hàm loadCriteria đang chứa eventRounds)
        loadCriteria();
      } catch (e: any) {
        Swal.fire("Error", `Update failed: ${getServerMsg(e)}`, "error");
      }
    }
  };

  const handleDeleteRound = async (round: any) => {
    const roundId = round.roundID || round.roundId || round.id;
    const ok = await Swal.fire({
      title: "Delete Round?",
      text: `Are you sure you want to delete ${round.roundName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
    });

    if (ok.isConfirmed) {
      try {
        await apiClient.delete(`/api/Round/${roundId}`);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          timer: 1200,
          showConfirmButton: false,
        });
        loadCriteria();
      } catch (e: any) {
        Swal.fire("Error", `Delete failed: ${getServerMsg(e)}`, "error");
      }
    }
  };
  const handleEditTrack = async (track: any) => {
    const { value: newName } = await Swal.fire({
      title: "Rename Track",
      input: "text",
      inputValue: track.trackName || track.name,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2 bg-fpt-orange",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
      inputValidator: (value) => {
        if (!value.trim()) return "Track name cannot be empty!";
      },
    });

    if (newName) {
      const trackId = track.trackID || track.trackId || track.id;
      try {
        await apiClient.put(`/api/Track/${trackId}`, {
          trackName: newName.trim(),
          eventID: id,
        });
        setTracks((prev) =>
          prev.map((t) =>
            (t.trackID || t.trackId || t.id) === trackId
              ? { ...t, trackName: newName.trim() }
              : t,
          ),
        );
        Swal.fire({
          icon: "success",
          title: "Updated!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        if (isNotFoundError(error)) {
          setTracks((prev) =>
            prev.filter((t) => (t.trackID || t.trackId || t.id) !== trackId),
          );
          Swal.fire(
            "Already Deleted",
            "This track was already deleted by another admin. The list has been refreshed.",
            "info",
          );
        } else {
          Swal.fire(
            "Error",
            `Cannot update track. Server responded: ${getServerMsg(error)}`,
            "error",
          );
        }
      }
    }
  };

  const handleDeleteTrack = async (track: any) => {
    const result = await Swal.fire({
      title: "Delete Track?",
      text: `Are you sure you want to delete the track "${track.trackName}"? Associated topics will also be affected.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
    });

    if (result.isConfirmed) {
      try {
        const trackId = track.trackID || track.trackId || track.id;
        await apiClient.delete(`/api/Track/${trackId}`);
        setTracks((prev) =>
          prev.filter((t) => (t.trackID || t.trackId || t.id) !== trackId),
        );
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        Swal.fire(
          "Error",
          `Cannot delete track. Server responded: ${getServerMsg(error)}`,
          "error",
        );
      }
    }
  };

  const handleEditTopic = async (topic: any, track: any) => {
    const { value: newDetail } = await Swal.fire({
      title: "Rename Topic",
      input: "text",
      inputValue: topic.topicDetail,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2 bg-fpt-orange",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
      inputValidator: (value) => {
        if (!value.trim()) return "Topic cannot be empty!";
      },
    });

    if (newDetail) {
      const topicId = topic.topicID || topic.topicId || topic.id;
      const trackId = track.trackID || track.trackId || track.id;
      try {
        await apiClient.put(`/api/Topic/topic/${topicId}`, {
          trackID: trackId,
          topicDetail: newDetail.trim(),
        });
        setTracks((prev) =>
          prev.map((t) => {
            if ((t.trackID || t.trackId || t.id) === trackId) {
              return {
                ...t,
                topics: t.topics.map((top: any) =>
                  (top.topicID || top.topicId || top.id) === topicId
                    ? { ...top, topicDetail: newDetail.trim() }
                    : top,
                ),
              };
            }
            return t;
          }),
        );
        Swal.fire({
          icon: "success",
          title: "Updated!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        if (isNotFoundError(error)) {
          setTracks((prev) =>
            prev.map((t) => {
              if ((t.trackID || t.trackId || t.id) === trackId) {
                return {
                  ...t,
                  topics: t.topics.filter(
                    (top: any) =>
                      (top.topicID || top.topicId || top.id) !== topicId,
                  ),
                };
              }
              return t;
            }),
          );
          Swal.fire(
            "Already Deleted",
            "This topic was already deleted by another admin. The list has been refreshed.",
            "info",
          );
        } else {
          Swal.fire(
            "Error",
            `Cannot update topic. Server responded: ${getServerMsg(error)}`,
            "error",
          );
        }
      }
    }
  };

  const handleDeleteTopic = async (topic: any, track: any) => {
    const result = await Swal.fire({
      title: "Delete Topic?",
      text: `Are you sure you want to delete the topic "${topic.topicDetail}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
    });

    if (result.isConfirmed) {
      try {
        const topicId = topic.topicID || topic.topicId || topic.id;
        const trackId = track.trackID || track.trackId || track.id;
        await apiClient.delete(`/api/Topic/topic/${topicId}`);
        setTracks((prev) =>
          prev.map((t) => {
            if ((t.trackID || t.trackId || t.id) === trackId) {
              return {
                ...t,
                topics: t.topics.filter(
                  (top: any) =>
                    (top.topicID || top.topicId || top.id) !== topicId,
                ),
              };
            }
            return t;
          }),
        );
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        Swal.fire(
          "Error",
          `Cannot delete topic. Server responded: ${getServerMsg(error)}`,
          "error",
        );
      }
    }
  };

  // --- THÊM TRACK & TOPIC MỚI ---
  const handleAddTrack = async () => {
    const { value: trackName } = await Swal.fire({
      title: "Add New Track",
      input: "text",
      inputPlaceholder: "Enter track name...",
      showCancelButton: true,
      confirmButtonText: "Add Track",
      confirmButtonColor: "#f26f21",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton: "rounded-xl font-bold px-6 py-2",
      },
    });

    if (trackName) {
      try {
        await apiClient.post("/api/Track", {
          eventId: id,
          trackName: trackName.trim(),
        });
        Swal.fire({
          icon: "success",
          title: "Added!",
          timer: 1000,
          showConfirmButton: false,
        });
        setReloadKey((k) => k + 1); // Load lại dữ liệu
      } catch (error) {
        Swal.fire("Error", "Could not add track.", "error");
      }
    }
  };

  const handleAddTopic = async (track: any) => {
    const { value: topicName } = await Swal.fire({
      title: "Add Topic",
      input: "text",
      inputPlaceholder: "Enter topic name...",
      showCancelButton: true,
      confirmButtonText: "Add Topic",
      confirmButtonColor: "#f26f21",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton: "rounded-xl font-bold px-6 py-2",
      },
    });

    if (topicName) {
      try {
        const trackId = track.trackID || track.trackId || track.id;
        await apiClient.post("/api/Topic/topic", {
          trackID: trackId,
          topicDetail: topicName.trim(),
        });
        Swal.fire({
          icon: "success",
          title: "Added!",
          timer: 1000,
          showConfirmButton: false,
        });
        setReloadKey((k) => k + 1); // Load lại dữ liệu
      } catch (error) {
        Swal.fire("Error", "Could not add topic.", "error");
      }
    }
  };

  const handleSave = async () => {
    if (!id || !event) return;
    if (!event.semester) {
      Swal.fire(
        "Hold on!",
        "You forgot to select the Season (Semester)!",
        "warning",
      );
      return;
    }
    try {
      setIsLoading(true);
      const roundBefore = Number(event.currentRound);
      const payload = {
        eventName: event.name,
        season: event.semester,
        year: Number(event.year),
        currentRound: event.currentRound,
      };

      await eventApi.updateEvent(id, payload);
      const after = await eventApi.getEventById(id);
      const roundAfter = Number(after.currentRound);
      setEvent(after);

      if (roundAfter !== roundBefore) {
        Swal.fire(
          "Saved",
          `Information saved successfully, but server adjusted the current round.`,
          "warning",
        );
      } else {
        Swal.fire({
          icon: "success",
          title: "Saved Successfully!",
          confirmButtonColor: "#f26f21",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire("Error", "Update failed. Please try again!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextRound = async () => {
    if (!id || eventRounds.length === 0) return;

    // --- ĐOẠN CODE ĐÃ FIX ---
    // Lấy giá trị thô từ Backend (ví dụ: 1 hoặc 2)
    const rawCurrentRound = Number(event?.currentRound);

    // Quy đổi về index mảng (0-based) bằng cách dò roundIndex
    let curRoundIndex = eventRounds.findIndex(
      (r: any) => Number(r.roundIndex ?? r.RoundIndex) === rawCurrentRound,
    );

    // Fallback: Nếu không khớp roundIndex, tự động lùi 1 đơn vị
    if (curRoundIndex === -1) {
      curRoundIndex = rawCurrentRound > 0 ? rawCurrentRound - 1 : 0;
    }

    const currentRoundObj = eventRounds[curRoundIndex];
    // ------------------------

    if (!currentRoundObj) {
      return Swal.fire(
        "Error",
        "Could not find current round information in the system!",
        "error",
      );
    }

    const roundId =
      currentRoundObj.roundID || currentRoundObj.roundId || currentRoundObj.id;
    const topN =
      currentRoundObj.topNPromotion ??
      currentRoundObj.topNpromotion ??
      currentRoundObj.TopNPromotion ??
      0;
    const isLastRound = curRoundIndex === eventRounds.length - 1;

    if (isLastRound) {
      const lastRoundIndex = Number(
        currentRoundObj.roundIndex ??
          currentRoundObj.RoundIndex ??
          rawCurrentRound,
      );

      const result = await Swal.fire({
        title: "Conclude Tournament?",
        html: 'The server has no automated "conclude" step yet, so this will <b>manually mark the event as ended</b> and lock all further editing. The current leaderboard of the final round becomes the official final result. This cannot be undone from this screen.',
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f26f21",
        cancelButtonColor: "#cbd5e1",
        confirmButtonText: "Yes, Force Conclude",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "rounded-[2rem]",
          confirmButton: "rounded-xl font-bold px-6 py-2",
          cancelButton: "rounded-xl font-bold px-6 py-2 text-slate-700",
        },
      });

      if (!result.isConfirmed) return;

      try {
        setIsLoading(true);
        await eventApi.updateEvent(id, {
          eventName: event.name,
          season: event.semester,
          year: Number(event.year),
          currentRound: lastRoundIndex + 1,
        } as any);
        Swal.fire({
          icon: "success",
          title: "Concluded!",
          text: "The event has been marked as ended.",
          confirmButtonColor: "#f26f21",
          customClass: { confirmButton: "rounded-xl font-bold px-6 py-2" },
        });
        const updatedData = await eventApi.getEventById(id);
        setEvent(updatedData);
      } catch (error: any) {
        Swal.fire(
          "Error",
          `Failed to conclude event. ${getServerMsg(error)}`,
          "error",
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const actionText = `The system will automatically advance the Top ${topN} teams with the highest scores to the next round.`;

    const result = await Swal.fire({
      title: "Advance to Next Round?",
      text: `${actionText} This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f26f21",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Yes, Advance Teams!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton: "rounded-xl font-bold px-6 py-2 text-slate-700",
      },
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        await roundApi.autoTransition(roundId);
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Event status updated successfully.",
          confirmButtonColor: "#f26f21",
          customClass: { confirmButton: "rounded-xl font-bold px-6 py-2" },
        });
        const updatedData = await eventApi.getEventById(id);
        setEvent(updatedData);
      } catch (error: any) {
        Swal.fire(
          "Error",
          `Cannot transition round! ${getServerMsg(error)}`,
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadCriteria = async () => {
    if (!id) return;
    try {
      setLoadingCriteria(true);
      setCriteriaError(null);

      const allRounds = await roundApi.getAllRounds();
      const matchedRounds = (allRounds || []).filter(
        (r: any) => String(r.eventID || r.eventId) === String(id),
      );
      const sortedRounds = [...matchedRounds].sort((a: any, b: any) => {
        const ai = Number(a.roundIndex ?? a.RoundIndex ?? 0);
        const bi = Number(b.roundIndex ?? b.RoundIndex ?? 0);
        if (ai !== bi) return ai - bi;
        return (
          new Date(a.startDate || a.StartDate || 0).getTime() -
          new Date(b.startDate || b.StartDate || 0).getTime()
        );
      });
      setEventRounds(sortedRounds);

      const allCrit = await criteriaApi.getAllCriteria();
      const critMap: Record<string, any> = {};
      (allCrit || []).forEach((c: any) => {
        const cid = c.criteriaID || c.criteriaId || c.id;
        if (cid) critMap[String(cid)] = c;
      });
      setDeletedCriteria(
        (allCrit || []).filter((c: any) => isInactiveRecord(c)),
      );

      // TẠO TỪ ĐIỂN TÊN BỘ TIÊU CHÍ (WORKAROUND THẦN THÁNH)
      let allSetsRaw: any[] = [];
      try {
        const res = await criteriaApi.getAllSet();
        allSetsRaw = getList(res);
      } catch (e) {}

      const setNameDictionary: Record<string, string> = {};
      allSetsRaw.forEach((st: any) => {
        // DÙNG HÀM grabSetId CHUYÊN TRỊ MỌI TÊN ID TỪ BACKEND
        const sId = String(grabSetId(st));
        if (sId && sId !== "undefined" && sId !== "null") {
          const validName = st.setName || st.SetName || st.name;
          if (validName) {
            setNameDictionary[sId] = validName;
          }
        }
      });

      const sets: any[] = [];
      const seen = new Set<string>();
      for (const r of sortedRounds) {
        const setId =
          (r as any).criteriaSetID ||
          (r as any).criteriaSetId ||
          (r as any).CriteriaSetID ||
          (r as any).CriteriaSetId;
        if (!setId || seen.has(String(setId))) continue;
        if (deletedSetIdsRef.current.has(String(setId))) continue;
        seen.add(String(setId));
        try {
          const setRes: any = await criteriaApi.getSetById(setId);
          const s = setRes?.data || setRes;

          if (isInactiveRecord(s)) continue;

          const rawList = extractSetList(setRes);
          const items = rawList
            .map((it: any) => {
              const cid = itemCriteriaId(it);
              const info = critMap[String(cid)] || {};
              return {
                criteriaId: cid,
                name:
                  info.criteriaName ||
                  info.name ||
                  it.criteriaName ||
                  it.name ||
                  "(Unknown)",
                description: info.description || it.description || "",
                score: itemScore(it),
                isActive: !isInactiveRecord(info),
              };
            })
            .filter((it: any) => it.isActive);

          // LẤY TÊN TỪ TỪ ĐIỂN TRƯỚC, NẾU KHÔNG CÓ MỚI XÀI HÀNG SERVER
          const dictName = setNameDictionary[String(setId)];
          const serverName = s.setName || s.SetName;
          const finalName = dictName || serverName || "Rubric Set";

          sets.push({
            setId,
            setName: finalName,
            isDefault: s.isDefault ?? s.IsDefault ?? false,
            roundName: r.roundName || "",
            items,
          });
        } catch (e) {}
      }
      setCriteriaSets(sets);
    } catch (e) {
      setCriteriaError("Failed to load rubrics. Please try again.");
    } finally {
      setLoadingCriteria(false);
    }
  };

  useEffect(() => {
    loadCriteria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEditCriterion = async (crit: any) => {
    const esc = (s: string) => (s || "").replace(/"/g, "&quot;");
    const { value } = await Swal.fire({
      title: "Edit Criterion",
      html: `<div style="text-align:left; padding: 0 10px;"><label style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Criterion Name</label><input id="sw-name" class="swal2-input" style="width:100%; max-width: 100%; border-radius: 12px; margin: 5px 0 20px; font-size:14px;" placeholder="Criterion name" value="${esc(crit.name)}"><label style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Description</label><input id="sw-desc" class="swal2-input" style="width:100%; max-width: 100%; border-radius: 12px; margin: 5px 0 10px; font-size:14px;" placeholder="Description" value="${esc(crit.description)}"></div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2.5 bg-fpt-orange",
        cancelButton:
          "rounded-xl font-bold px-6 py-2.5 bg-slate-100 text-slate-700",
      },
      preConfirm: () => {
        const name = (
          document.getElementById("sw-name") as HTMLInputElement
        )?.value?.trim();
        const description = (
          document.getElementById("sw-desc") as HTMLInputElement
        )?.value?.trim();
        if (!name) {
          Swal.showValidationMessage("Criterion name cannot be empty");
          return false;
        }
        return { name, description };
      },
    });
    if (!value) return;
    try {
      await criteriaApi.updateCriterion(crit.criteriaId, {
        criteriaID: crit.criteriaId,
        criteriaId: crit.criteriaId,
        criteriaName: value.name,
        description: value.description || DEFAULT_CRITERIA_DESCRIPTION,
      } as any);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      Swal.fire(
        "Update Failed",
        `Server responded: ${getServerMsg(e)}`,
        "error",
      );
    }
  };

  const handleDeleteCriterion = async (crit: any) => {
    const ok = await Swal.fire({
      title: "Delete Criterion?",
      html: `Delete criterion <b>${crit.name}</b>? You can restore it later.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
    });
    if (!ok.isConfirmed) return;
    try {
      await criteriaApi.deleteCriterion(crit.criteriaId);
      setCriteriaSets((prev) =>
        prev.map((s) => ({
          ...s,
          items: s.items.filter(
            (it: any) => String(it.criteriaId) !== String(crit.criteriaId),
          ),
        })),
      );
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      Swal.fire(
        "Error",
        `Deletion failed. Server responded: ${getServerMsg(e)}`,
        "error",
      );
    }
  };

  const handleRestoreCriterion = async (crit: any) => {
    const cid = crit.criteriaID || crit.criteriaId || crit.id;
    setDeletedCriteria((prev) =>
      prev.filter(
        (c: any) =>
          String(c.criteriaID || c.criteriaId || c.id) !== String(cid),
      ),
    );
    try {
      await criteriaApi.restoreCriterion(cid);
      await loadCriteria();
      Swal.fire({
        icon: "success",
        title: "Restored!",
        text: "Criterion has been reactivated.",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (e: any) {
      await loadCriteria();
      Swal.fire(
        "Error",
        `Restore failed. Server responded: ${getServerMsg(e)}`,
        "error",
      );
    }
  };

  const handleSaveSet = async (set: any) => {
    if (!set.setName || !set.setName.trim()) {
      return Swal.fire("Required", "Set name cannot be empty.", "warning");
    }
    if (!set.items || set.items.length === 0) {
      return Swal.fire("Error", "This set has no criteria.", "warning");
    }
    const total = sumWeight(set.items);
    if (total !== 100) {
      return Swal.fire(
        "Invalid Weight",
        `Total weight is currently ${total}%. Must be exactly 100%.`,
        "error",
      );
    }
    try {
      const mappedCriteriaList = set.items.map((it: any) => ({
        criteriaId: String(it.criteriaId || it.criteriaID || it.id),
        criteriaID: String(it.criteriaId || it.criteriaID || it.id),
        score: Number(it.score || 0),
      }));

      await criteriaApi.updateSet(set.setId, {
        setID: set.setId,
        setId: set.setId,
        eventID: id,
        eventId: id,
        setName: set.setName.trim(),
        isDefault: set.isDefault ?? false,
        criteriaList: mappedCriteriaList,
      } as any);

      Swal.fire({
        icon: "success",
        title: "Saved Successfully!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      Swal.fire("Error", `Server responded: ${getServerMsg(e)}`, "error");
    }
  };

  const handleDeleteSet = async (set: any) => {
    const ok = await Swal.fire({
      title: "Delete Rubric Set?",
      html: `Delete entire set <b>${set.setName}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete Set",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
    });
    if (!ok.isConfirmed) return;
    try {
      await criteriaApi.deleteSet(set.setId);
      deletedSetIdsRef.current.add(String(set.setId));
      setCriteriaSets((prev) =>
        prev.filter((s) => String(s.setId) !== String(set.setId)),
      );
      Swal.fire({
        icon: "success",
        title: "Set Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      Swal.fire(
        "Error",
        `Deletion failed. Server responded: ${getServerMsg(e)}`,
        "error",
      );
    }
  };

  const updateScoreLocal = (setIdx: number, itemIdx: number, val: number) => {
    setCriteriaSets((prev) =>
      prev.map((s, si) =>
        si !== setIdx
          ? s
          : {
              ...s,
              items: s.items.map((it: any, ii: number) =>
                ii !== itemIdx ? it : { ...it, score: val },
              ),
            },
      ),
    );
  };

  const updateSetNameLocal = (setIdx: number, val: string) => {
    setCriteriaSets((prev) =>
      prev.map((s, si) => (si !== setIdx ? s : { ...s, setName: val })),
    );
  };

  if (isLoading && !event)
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-20 text-slate-400">
        <Loader2 size={36} className="animate-spin text-[#f26f21]" />
        <span className="text-sm font-bold uppercase tracking-widest">
          Loading Event details...
        </span>
      </div>
    );
  if (loadError)
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-20 text-center bg-white m-10 rounded-[2rem] shadow-sm">
        <AlertCircle size={40} className="text-red-500" strokeWidth={1.5} />
        <p className="text-base font-medium text-red-500">{loadError}</p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  if (!event)
    return (
      <div className="p-20 text-center font-medium text-slate-500">
        Event not found!
      </div>
    );

  // --- ĐOẠN CODE ĐÃ FIX LỖI ROUND 4 ---
  const numRounds = eventRounds.length || 2;
  const rawCurrentRound = Number(event?.currentRound);

  let curRound = 0;

  if (eventRounds.length > 0) {
    const foundIndex = eventRounds.findIndex(
      (r: any) => Number(r.roundIndex ?? r.RoundIndex) === rawCurrentRound,
    );

    if (foundIndex !== -1) {
      curRound = foundIndex;
    } else {
      // FIX: Nếu không tìm thấy, kiểm tra xem nó đang ở trước vòng 1 hay sau vòng cuối
      const firstRoundIdx = Number(
        eventRounds[0].roundIndex ?? eventRounds[0].RoundIndex,
      );
      const lastRoundIdx = Number(
        eventRounds[eventRounds.length - 1].roundIndex ??
          eventRounds[eventRounds.length - 1].RoundIndex,
      );

      if (rawCurrentRound < firstRoundIdx) {
        curRound = 0; // Sự kiện mới tinh, Backend trả 0 -> Ép về vòng đầu tiên
      } else if (rawCurrentRound > lastRoundIdx) {
        curRound = numRounds; // Lớn hơn vòng cuối -> Đã kết thúc
      } else {
        curRound = 0; // An toàn nhất vẫn là vòng đầu
      }
    }
  }

  const isEnded = curRound >= numRounds;
  const currentRoundName =
    curRound < 0
      ? "Upcoming"
      : isEnded
        ? "Concluded"
        : eventRounds[curRound]?.roundName || `Round ${curRound + 1}`;
  // ----------------------------------------------

  // TÍNH TOÁN VÒNG ĐANG XEM Ở BẢNG XẾP HẠNG
  const displayRoundIndex = isEnded ? numRounds - 1 : curRound;
  const canShowLeaderboard = displayRoundIndex >= 0 && eventRounds.length > 0;
  const displayRoundObj = canShowLeaderboard
    ? eventRounds[displayRoundIndex]
    : null;
  const advanceTopN =
    displayRoundObj?.topNPromotion ??
    displayRoundObj?.topNpromotion ??
    displayRoundObj?.TopNPromotion ??
    0;
  const isLastRound = displayRoundIndex === numRounds - 1;
  // ----------------------------------------------
  // ------------------------

  return (
    <main className="w-full bg-[#f4f6f8] min-h-screen p-10 animate-in fade-in duration-500 font-sans selection:bg-slate-200">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => navigate("/admin/events")}
                className="text-slate-400 hover:text-fpt-orange transition-colors p-2 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-slate-300"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-4xl font-black text-[#f26f21] tracking-tight">
                Event Configuration
              </h2>
            </div>
            <p className="text-slate-500 font-medium text-base ml-[3.25rem]">
              Manage details, tracks, and rubrics.
            </p>
          </div>

          {!isEnded && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white text-sm font-extrabold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Save size={18} strokeWidth={2.5} />{" "}
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {isEnded && (
          <div className="bg-slate-100/80 border border-slate-200 text-slate-600 p-5 rounded-[2rem] flex items-center gap-4 shadow-sm mb-6">
            <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
              <Lock size={24} strokeWidth={2.5} />
            </div>
            <p className="text-base font-medium">
              This event has concluded. All configurations are locked and
              provided for historical reference only.
            </p>
          </div>
        )}

        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xl font-extrabold text-[#f26f21] mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Edit3 size={20} strokeWidth={2.5} />
              </div>
              Basic Information
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Event Display Name
                </label>
                <input
                  disabled={isEnded}
                  type="text"
                  value={event.name || ""}
                  onChange={(e) => setEvent({ ...event, name: e.target.value })}
                  className={`w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl mt-2 outline-none font-bold text-[#f26f21] text-base ${isEnded ? "opacity-60 cursor-not-allowed" : "focus:bg-white focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10 transition-all"}`}
                />
              </div>

              {/* HIỂN THỊ CURRENT STATUS NGẮN GỌN */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Current Status
                </label>
                <div
                  className={`w-full px-5 py-3.5 border rounded-2xl font-bold flex items-center justify-center shadow-sm ${curRound < 0 ? "bg-amber-50 border-amber-200 text-amber-700" : isEnded ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-fpt-orange-soft border-fpt-orange/30 text-fpt-orange-dark"}`}
                >
                  <span className="text-sm uppercase tracking-widest">
                    {currentRoundName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QUẢN LÝ CÁC VÒNG THI */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xl font-extrabold text-[#f26f21] mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <FastForward size={20} strokeWidth={2.5} />
              </div>
              Tournament Rounds
            </h3>

            <div
              className={`grid grid-cols-1 gap-6 ${
                eventRounds.length >= 3
                  ? "md:grid-cols-2 lg:grid-cols-3"
                  : eventRounds.length === 2
                    ? "md:grid-cols-2"
                    : "max-w-md mx-auto w-full"
              }`}
            >
              {eventRounds.map((r, idx) => (
                <div
                  key={r.roundID || r.roundId || r.id}
                  className="p-6 bg-slate-50/50 border border-slate-200 rounded-2xl relative group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        Index: {r.roundIndex ?? r.RoundIndex}
                      </span>
                      <h4 className="font-extrabold text-[#f26f21] text-lg">
                        {r.roundName}
                      </h4>
                    </div>
                    {!isEnded && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditRound(r)}
                          className="p-2 text-slate-400 hover:text-fpt-orange bg-white border border-slate-100 rounded-lg shadow-sm"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRound(r)}
                          className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-lg shadow-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm font-semibold text-slate-600">
                    <p className="flex justify-between">
                      <span>Advance Top N:</span>
                      {/* FIX: Bắt tất cả các case viết hoa/thường từ API */}
                      <span className="text-fpt-blue">
                        {r.topNPromotion ??
                          r.topNpromotion ??
                          r.TopNPromotion ??
                          0}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Max Teams:</span>{" "}
                      <span className="text-[#f26f21]">{r.maxTeam ?? 0}</span>
                    </p>
                    <div className="pt-2 mt-2 border-t border-slate-200 space-y-1.5">
                      <p className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar size={13} strokeWidth={2.5} /> Start:
                        </span>
                        <span className="text-[#f26f21] text-xs font-bold">
                          {formatDisplayDateTime(
                            r.startDate || r.StartDate,
                          )}
                        </span>
                      </p>
                      <p className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar size={13} strokeWidth={2.5} /> End:
                        </span>
                        <span className="text-[#f26f21] text-xs font-bold">
                          {formatDisplayDateTime(r.endDate || r.EndDate)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NÚT ADD TRACK NẰM Ở ĐÂY */}
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-extrabold text-[#f26f21] ml-2">
              Event Tracks
            </h3>
            {!isEnded && (
              <button
                onClick={handleAddTrack}
                className="px-5 py-2.5 bg-fpt-orange-soft text-fpt-orange-dark text-xs font-extrabold rounded-xl flex items-center gap-2 hover:bg-fpt-orange/15 transition-colors"
              >
                <Plus size={16} strokeWidth={3} /> Add Track
              </button>
            )}
          </div>
          <div
            className={`grid grid-cols-1 gap-6 ${tracks.length > 1 ? "md:grid-cols-2" : tracks.length === 1 ? "max-w-xl mx-auto w-full" : ""}`}
          >
            {tracks.length > 0 ? (
              tracks.map((track: any, idx: number) => (
                <div
                  key={track.trackID || track.trackId || idx}
                  className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5 hover:border-fpt-orange/30 transition-colors"
                >
                  <div className="flex gap-4 items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Track #{idx + 1}
                      </label>
                      <div className="font-extrabold text-lg text-[#f26f21] mt-0.5">
                        {track.trackName}
                      </div>
                    </div>
                    {!isEnded && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTrack(track)}
                          title="Rename Track"
                          className="text-slate-400 hover:text-fpt-orange p-2 rounded-xl hover:bg-fpt-orange-soft transition-colors bg-slate-50"
                        >
                          <Pencil size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleDeleteTrack(track)}
                          title="Delete Track"
                          className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors bg-slate-50"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                      Sub-Topics
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {track.topics.length > 0 ? (
                        track.topics.map((topic: any, i: number) => (
                          <div
                            key={i}
                            className="group inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all hover:bg-white hover:border-slate-300"
                          >
                            <span>{topic.topicDetail}</span>
                            {!isEnded && (
                              <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditTopic(topic, track)}
                                  className="text-slate-400 hover:text-fpt-orange"
                                  title="Edit Topic"
                                >
                                  <Pencil size={12} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteTopic(topic, track)
                                  }
                                  className="text-slate-400 hover:text-red-500"
                                  title="Delete Topic"
                                >
                                  <X size={14} strokeWidth={3} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          No topics added yet.
                        </span>
                      )}
                      {/* NÚT ADD TOPIC CHO TỪNG TRACK */}
                      {!isEnded && (
                        <button
                          onClick={() => handleAddTopic(track)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 text-slate-400 rounded-xl text-xs font-bold hover:border-fpt-orange hover:text-fpt-orange transition-colors"
                        >
                          <Plus size={14} strokeWidth={3} /> Add Topic
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-10 border-2 border-dashed border-slate-200 rounded-[2rem] text-center bg-white text-slate-500 font-medium">
                No tracks configured for this event.
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xl font-extrabold text-[#f26f21] mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <ListChecks size={20} strokeWidth={2.5} />
              </div>
              Grading Rubrics
            </h3>

            {loadingCriteria ? (
              <div className="flex items-center gap-3 text-sm text-slate-400 py-10 justify-center font-bold tracking-widest uppercase">
                <Loader2 size={20} className="animate-spin text-[#f26f21]" />{" "}
                Loading rubrics...
              </div>
            ) : criteriaError ? (
              <div className="flex items-center justify-center gap-3 py-10 bg-red-50 rounded-2xl">
                <span className="flex items-center gap-2 text-sm text-red-600 font-bold">
                  <AlertCircle size={18} strokeWidth={2.5} /> {criteriaError}
                </span>
                <button
                  onClick={loadCriteria}
                  className="px-4 py-2 text-xs font-bold bg-white text-slate-700 rounded-xl shadow-sm hover:bg-slate-50"
                >
                  <RefreshCw size={12} className="inline mr-1" /> Retry
                </button>
              </div>
            ) : criteriaSets.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium text-center py-10">
                No rubric sets linked to this event.
              </p>
            ) : (
              <div
                className={`grid grid-cols-1 gap-6 ${criteriaSets.length > 1 ? "md:grid-cols-2" : "max-w-2xl mx-auto w-full"}`}
              >
                {criteriaSets.map((set: any, setIdx: number) => {
                  const total = sumWeight(set.items);
                  return (
                    <div
                      key={set.setId}
                      className="border border-slate-200 rounded-[1.5rem] overflow-hidden bg-white shadow-sm flex flex-col"
                    >
                      <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-100">
                        {/* THAY ĐỔI LỚN: TÊN BỘ TIÊU CHÍ BÂY GIỜ LÀ Ô INPUT ĐỂ SỬA TRỰC TIẾP TRÊN FORM */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <input
                            type="text"
                            value={set.setName}
                            onChange={(e) =>
                              updateSetNameLocal(setIdx, e.target.value)
                            }
                            disabled={isEnded}
                            className={`font-extrabold text-base px-3 py-1.5 rounded-lg outline-none w-full max-w-[300px] ${isEnded ? "bg-transparent text-[#f26f21] cursor-not-allowed" : "bg-white border border-slate-200 text-[#f26f21] focus:border-fpt-orange focus:ring-2 focus:ring-fpt-orange/10 transition-all shadow-sm"}`}
                          />
                          {set.roundName && (
                            <span className="text-[9px] px-2.5 py-1 rounded-md bg-fpt-orange text-white font-bold uppercase tracking-widest shrink-0 shadow-sm">
                              {set.roundName}
                            </span>
                          )}
                        </div>
                        {!isEnded && (
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <button
                              onClick={() => handleDeleteSet(set)}
                              title="Delete Set"
                              className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors bg-white shadow-sm border border-slate-100"
                            >
                              <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="divide-y divide-slate-50 flex-1">
                        {set.items.length === 0 ? (
                          <p className="text-sm text-slate-400 font-medium px-6 py-8 text-center">
                            This set is empty.
                          </p>
                        ) : (
                          set.items.map((it: any, itemIdx: number) => (
                            <div
                              key={it.criteriaId || itemIdx}
                              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-slate-800">
                                  {it.name}
                                </div>
                                {it.description && (
                                  <div className="text-xs text-slate-500 font-medium mt-1 truncate">
                                    {it.description}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  disabled={isEnded}
                                  value={it.score}
                                  onChange={(e) =>
                                    updateScoreLocal(
                                      setIdx,
                                      itemIdx,
                                      Number(e.target.value),
                                    )
                                  }
                                  className={`w-16 px-3 py-2 text-center border border-slate-200 rounded-xl text-sm font-extrabold outline-none transition-all ${isEnded ? "bg-slate-50 cursor-not-allowed text-slate-500" : "text-[#f26f21] focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10"}`}
                                />
                                <span className="text-xs text-slate-400 font-bold">
                                  %
                                </span>
                              </div>
                              {!isEnded && (
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <button
                                    onClick={() => handleEditCriterion(it)}
                                    className="text-slate-300 hover:text-fpt-orange p-2 rounded-xl hover:bg-fpt-orange-soft transition-colors"
                                  >
                                    <Pencil size={14} strokeWidth={2.5} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCriterion(it)}
                                    className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={14} strokeWidth={2.5} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex items-center justify-between bg-slate-50/80 px-6 py-4 border-t border-slate-100">
                        <span
                          className={`text-xs font-bold flex items-center gap-1.5 ${total === 100 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          <Scale size={14} strokeWidth={2.5} /> Total Weight:{" "}
                          {total}%
                        </span>
                        {!isEnded && (
                          <button
                            onClick={() => handleSaveSet(set)}
                            disabled={total !== 100 || !set.setName.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-fpt-orange text-white text-xs font-bold rounded-xl hover:bg-fpt-orange-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                          >
                            <Save size={14} strokeWidth={2.5} /> Save Updates
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {deletedCriteria.length > 0 && !isEnded && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <RotateCcw size={14} strokeWidth={2.5} /> Recover Deleted
                  Criteria
                </p>
                <div className="flex flex-wrap gap-3">
                  {deletedCriteria.map((c: any, i: number) => (
                    <div
                      key={c.criteriaID || c.criteriaId || i}
                      className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <span className="text-xs font-bold text-slate-500 line-through">
                        {c.criteriaName || c.name}
                      </span>
                      <button
                        onClick={() => handleRestoreCriterion(c)}
                        className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-lg transition-colors"
                      >
                        <RotateCcw size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION: BẢNG XẾP HẠNG TRỰC TIẾP & NÚT CHUYỂN VÒNG (MỚI) */}

          {/* ========================================================= */}
          {canShowLeaderboard && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100">
                <h3 className="text-xl font-extrabold text-[#f26f21] flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Trophy size={20} strokeWidth={2.5} />
                  </div>
                  Live Leaderboard & Round Transition
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-2 ml-[3.25rem]">
                  Review the standings across all tracks.
                </p>
              </div>

              <div className="flex-1 bg-slate-50/30">
                {isLoadingTeams ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-400">
                    <Loader2
                      size={36}
                      className="animate-spin text-[#f26f21] mb-4"
                    />
                    <span className="font-bold text-sm uppercase tracking-widest">
                      Aggregating Scores...
                    </span>
                  </div>
                ) : roundTeams.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 font-medium text-base">
                    No teams found in this round yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-5 w-24 text-center">Rank</th>
                          <th className="px-6 py-5">Team Name</th>
                          <th className="px-6 py-5">Track Category</th>
                          <th className="px-8 py-5 text-center w-36">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50/80 bg-white">
                        {roundTeams.map((team, index) => {
                          let rankIcon = null;
                          let rankTextClass = "text-slate-400 font-extrabold";
                          let scoreClass = "text-slate-600 font-extrabold";

                          if (index === 0) {
                            rankIcon = (
                              <Trophy
                                size={24}
                                className="text-amber-400 drop-shadow-sm mb-1"
                                strokeWidth={2}
                              />
                            );
                            rankTextClass = "text-amber-600 font-extrabold";
                            scoreClass = "text-amber-600 font-black";
                          } else if (index === 1) {
                            rankIcon = (
                              <Medal
                                size={24}
                                className="text-slate-400 drop-shadow-sm mb-1"
                                strokeWidth={2}
                              />
                            );
                            rankTextClass = "text-slate-500 font-extrabold";
                            scoreClass = "text-slate-600 font-black";
                          } else if (index === 2) {
                            rankIcon = (
                              <Medal
                                size={24}
                                className="text-amber-700/70 drop-shadow-sm mb-1"
                                strokeWidth={2}
                              />
                            );
                            rankTextClass = "text-amber-800 font-extrabold";
                            scoreClass = "text-amber-700 font-black";
                          }

                          const trackName =
                            tracks.find(
                              (tr) =>
                                String(tr.trackID || tr.trackId || tr.id) ===
                                String(team.trackId || team.trackID),
                            )?.trackName || "Unassigned";

                          return (
                            <tr
                              key={team.teamId || index}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-8 py-4">
                                <div className="flex flex-col items-center justify-center">
                                  {rankIcon ? (
                                    <>
                                      {rankIcon}
                                      <span
                                        className={`text-[9px] tracking-widest uppercase ${rankTextClass}`}
                                      >
                                        TOP {index + 1}
                                      </span>
                                    </>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 font-extrabold text-xs shadow-sm">
                                      {index + 1}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-base font-extrabold ${index < 3 ? "text-[#f26f21]" : "text-slate-700"}`}
                                >
                                  {team.teamName ||
                                    team.name ||
                                    "Anonymous Team"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold">
                                  {trackName}
                                </span>
                              </td>
                              <td className="px-8 py-4 text-center">
                                <span className={`text-xl ${scoreClass}`}>
                                  {Number(team.score || 0).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CHỈ HIỂN THỊ NÚT CHUYỂN VÒNG NẾU SỰ KIỆN CHƯA KẾT THÚC */}
              {!isEnded && (
                <div className="p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[#f26f21]">
                      <Users size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-0.5">
                        Total Teams
                      </span>
                      <span className="font-extrabold text-[#f26f21] text-base">
                        {roundTeams.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleNextRound}
                      disabled={
                        isLoading || isLoadingTeams || roundTeams.length === 0
                      }
                      className="w-full sm:w-auto px-8 py-4 bg-fpt-orange text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-fpt-orange-dark hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FastForward size={18} strokeWidth={2.5} />
                      {isLastRound
                        ? "Conclude Event"
                        : `Advance Top ${advanceTopN} Teams to Next Round`}
                    </button>
                    {/* {isLastRound && (
                      <p className="text-xs text-slate-400 font-medium text-right max-w-xs">
                        No backend "conclude" step exists yet — this manually
                        marks the event as ended on the frontend.
                      </p>
                    )} */}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
